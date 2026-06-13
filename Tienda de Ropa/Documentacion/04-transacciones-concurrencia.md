# 04 — Transacciones y concurrencia

## Principios aplicados

El sistema asume operación **multi-usuario, multi-sede y simultánea**: el dueño consulta reportes globales mientras vendedores cobran en dos sedes y un cliente edita su carrito desde la web. Por lo tanto cada operación que toca más de una tabla se ejecuta dentro de una transacción explícita, y cada transacción declara su nivel de aislamiento en función del riesgo que enfrenta.

## Transacciones críticas del dominio

### Cobro de venta (`sp_Procesar_Cobro_Venta`)

Es la transacción más sensible. Realiza, en un único `BEGIN TRAN`:

1. Validación de que el borrador tenga al menos una línea y un cliente asociado.
2. Asignación del `Nro_factura` siguiente (lectura + escritura sobre la secuencia interna).
3. Descuento de stock en `Inventario.Stock_Actual` por cada producto vendido.
4. Inserción de movimientos en `Inventario.Kardex` (uno por línea, con `Cantidad` negativa).
5. Transición del estado del cabecera a `Pagada`.

Si cualquier paso falla, `ROLLBACK` revierte todo: la factura no se emite, el stock queda intacto, el kardex no registra movimientos huérfanos. Se garantiza **atomicidad** sobre las cuatro tablas afectadas.

### Transferencia de stock (`sp_Transferir_Stock`)

Mueve unidades de la sede A a la sede B. En la misma transacción:

1. Verificación de stock suficiente en origen.
2. Descuento en `Stock_Actual(origen)`.
3. Incremento en `Stock_Actual(destino)`.
4. Doble entrada en `Kardex` (salida en origen, entrada en destino).

Sin transacción se podría descontar de origen y fallar al incrementar destino, perdiendo unidades. La transacción garantiza la **conservación de inventario**.

### Recepción de mercadería (`sp_Consolidar_Recepcion_Mercaderia`)

Recibe una orden de compra. En una sola transacción se actualiza la cabecera (`Estado='Recibida'`), se incrementa el stock central por cada línea recibida, y se generan los kardex de entrada correspondientes.

### Borrador único por cliente (`sp_Crear_Venta_Borrador`)

Antes de insertar un nuevo borrador, el SP verifica con `EXISTS` la presencia de uno previo. La capa de aplicación duplica esta validación con un `pre-check` propio y captura el error de `UNIQUE` por si la condición de carrera se diera entre la lectura y la escritura. El mecanismo combina **optimismo en la aplicación + integridad en la base**.

## Niveles de aislamiento

| Operación | Nivel | Justificación |
| --- | --- | --- |
| Cobro de venta | `READ COMMITTED` (default) + bloqueos exclusivos sobre las filas de stock | El conteo de stock se actualiza con `UPDATE` que toma X-lock; impide que otra venta lea el mismo valor desactualizado |
| Reportes del dueño | `READ COMMITTED SNAPSHOT` (recomendado) | Lecturas no bloquean las ventas en curso; el dueño ve un punto consistente sin frenar a los cajeros |
| Replicación de cola | `READ COMMITTED` | Toma de a una fila con `TOP 1 ORDER BY id_cola`; no requiere repeatable read |
| Cálculo de descuento | `READ COMMITTED` | Las promociones cambian con baja frecuencia; el riesgo de lectura sucia es nulo |
| Ajuste manual de inventario | `SERIALIZABLE` opcional | Evita lecturas fantasma cuando se audita una sede mientras se aplica un ajuste masivo |

El sistema NO usa `READ UNCOMMITTED` en ninguna operación de escritura ni en reportes financieros, para evitar la inconsistencia de lecturas sucias.

## Cola asincrónica como amortiguador de concurrencia

La replicación entre Central y Sede no es síncrona. Cada cambio sobre una tabla replicada (catálogo, promociones, umbrales de stock) dispara un trigger que serializa el registro a JSON y lo encola en `Configuracion.Cola_Replicacion`. Un SQL Agent Job consume la cola periódicamente.

**Beneficio para la concurrencia**: la transacción del usuario que modifica un producto no espera a que la sede remota lo aplique. Si el linked server está caído, la cola crece pero el negocio no se detiene. Cuando el enlace se restablece, el job procesa el atraso.

**Manejo de fallos en la cola**: cada fila admite hasta **3 intentos**. El SP `sp_Procesar_Cola_Replicacion` incrementa el contador `intentos` y registra el error en la columna `error` cuando falla. Al alcanzar 3, la fila se marca como `procesado=1` con su error guardado, evitando que un error permanente bloquee el procesamiento del resto. Este mecanismo combina **idempotencia, reintentos y descarte controlado**.

```sql
BEGIN CATCH
    UPDATE Configuracion.Cola_Replicacion
    SET intentos        = intentos + 1,
        error           = LEFT(ERROR_MESSAGE(), 500),
        procesado       = CASE WHEN intentos + 1 >= 3 THEN 1 ELSE 0 END,
        fecha_procesado = CASE WHEN intentos + 1 >= 3 THEN GETDATE() ELSE NULL END
    WHERE id_cola = @id;
END CATCH
```

## Prevención de deadlocks

Los SPs que tocan múltiples tablas siguen siempre el **mismo orden de acceso** para evitar interbloqueos:

1. `Venta_Cabecera`
2. `Venta_Detalle`
3. `Stock_Actual`
4. `Kardex`

Mientras dos transacciones respeten ese orden, una espera a la otra pero ninguna queda esperando recíprocamente. El triggers de auditoría (`Bitacora`) toman bloqueos solo de escritura y nunca leen tablas operativas, eliminando una fuente común de ciclos.

Cuando se detecta un deadlock (víctima elegida por SQL Server), el sistema confía en el manejador de errores estándar: el SP retorna el error a la aplicación, que reintenta la operación. Las operaciones críticas son idempotentes en su entrada (carrito por cliente, recepción por orden de compra), por lo que un reintento no genera duplicidad.

## Triggers como red de seguridad

Los triggers `AFTER` actúan como segunda línea de defensa cuando un SP olvida algo o cuando un acceso fuera del SP (por ejemplo, una migración) toca la tabla:

- `trg_Bitacora_Persona` registra automáticamente todo `INSERT/UPDATE/DELETE` sobre `Persona.Persona`.
- `trg_Username_Unico` valida la unicidad y el formato del username dentro de la misma transacción que generó la inserción.
- `trg_Cola_Stock_Umbral` encola el cambio para replicación. Si el insert hace rollback, el encolado también: ambos forman la misma unidad atómica.

## Diagnóstico operativo

El sistema mantiene `Configuracion.Replica_Control` como tablero de estado de cada sincronización (`Ultima_sync`, `Estado`, `Detalle_error`) y la vista `vw_Estado_Red` resume la salud de la replicación para el dashboard del dueño. La auditoría de transacciones se consulta en `vw_Trazabilidad_Bitacora`. Estos dos puntos cubren respectivamente el plano de **mensajería** y el plano de **datos** para diagnosticar incidentes de concurrencia.
