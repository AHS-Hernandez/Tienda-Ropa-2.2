# 06 — Reglas de negocio

Este documento concentra las reglas duras del dominio que el sistema garantiza, independientemente de la interfaz que las invoque. Cada regla está acompañada del mecanismo técnico que la hace cumplir.

## Ventas

| # | Regla | Garantía técnica |
| --- | --- | --- |
| V-01 | Un cliente puede tener **un único carrito (borrador) abierto** a la vez. | Pre-check aplicativo + índice único filtrado por `(id_cliente, Estado='Borrador')` |
| V-02 | El número de factura es único entre ventas emitidas. Los borradores admiten `Nro_factura = NULL`. | Filtered Unique Index `WHERE Nro_factura IS NOT NULL` |
| V-03 | Una venta no puede cobrarse sin cliente o sin líneas. | Validación dentro de `sp_Procesar_Cobro_Venta` |
| V-04 | El cobro descuenta stock y registra kardex en la misma transacción. | `BEGIN TRAN ... COMMIT` que abarca cabecera, detalle, stock y kardex |
| V-05 | El precio y el nombre del producto **se congelan** en `Venta_Detalle` al momento de la venta. | El SP copia los valores desde `Producto`; cambios posteriores no alteran la factura |
| V-06 | Una venta solo puede transitar Borrador → Pagada → Entregada (o Anulada). | `CHECK` sobre `Estado` + lógica en SPs de cambio de estado |
| V-07 | Una sede no central no puede emitir ventas que no le pertenecen. | `id_sede` se toma del usuario autenticado, no del input del cliente |

## Inventario

| # | Regla | Garantía técnica |
| --- | --- | --- |
| I-01 | El stock por sede nunca puede ser negativo. | `CHECK (Cantidad >= 0)` + validación previa en SPs de venta |
| I-02 | Toda variación de stock genera una entrada en `Kardex`. | SPs de venta, compra, ajuste y transferencia insertan kardex en la misma transacción |
| I-03 | Las transferencias entre sedes son atómicas: o se mueve todo, o no se mueve nada. | `sp_Transferir_Stock` en transacción única |
| I-04 | El umbral mínimo de stock se define por `(subcategoría, sede)`. | Clave compuesta en `Stock_Umbral` |
| I-05 | El dueño define el umbral una vez y se aplica a todas las sedes activas. | El endpoint `POST /api/owner/umbrales` itera sobre `Sede WHERE Activa=1` |
| I-06 | El módulo de notificaciones muestra alerta **solo si hay stock por debajo del umbral**. | El endpoint consulta `vw_Stock_Bajo`; si está vacío, la campana se oculta |

## Catálogo y promociones

| # | Regla | Garantía técnica |
| --- | --- | --- |
| C-01 | El catálogo es maestro en Central y se replica a las sedes. | Triggers + cola `Cola_Replicacion` + SP consumidor |
| C-02 | Una promoción puede aplicar a un producto, a una categoría o a una subcategoría. | `Promocion_Aplicacion` con tres FK opcionales y validación de exclusividad |
| C-03 | El descuento se calcula en el momento de la venta, no se almacena anticipado. | `fn_Calcular_Descuento_Producto` se llama desde el SP de agregar línea |
| C-04 | Una promoción fuera de vigencia no aplica, aunque esté en la tabla. | El filtro de fecha está dentro de la función, no del control de visibilidad |
| C-05 | Las imágenes y descripciones extendidas viven en MongoDB (`producto_foto`) o se sirven desde el endpoint `/api/foto`. | Separación de datos transaccionales y datos pesados |

## Reseñas

| # | Regla | Garantía técnica |
| --- | --- | --- |
| R-01 | Solo el cliente que compró un producto puede reseñarlo. | La aplicación verifica la venta en SQL antes de insertar en Mongo |
| R-02 | Una compra solo admite **una** reseña por (cliente, producto, venta). | Índice único compuesto en MongoDB |
| R-03 | El rating válido está entre 1 y 5. | `$jsonSchema` con `minimum: 1, maximum: 5` |
| R-04 | Una reseña oculta no aparece al público, pero sí al moderador. | Filtro por `estado: "publicada"` en la consulta pública |
| R-05 | El nombre del cliente y del producto se resuelven en consulta, no se almacenan en la reseña. | Mongo guarda solo IDs; la aplicación enriquece al servir |

## Identidad y seguridad

| # | Regla | Garantía técnica |
| --- | --- | --- |
| S-01 | Una misma persona puede ser cliente y empleado simultáneamente. | Tablas `Cliente` y `Empleado` apuntan a la misma `Persona` |
| S-02 | El username de un usuario coincide con su email. | `trg_Username_Unico` valida y normaliza |
| S-03 | La desactivación de usuarios es lógica, nunca física, para preservar bitácora. | Columna `Estado BIT`; los SPs nunca borran usuarios |
| S-04 | Cada acción audita su autor en `Bitacora`. | Triggers de auditoría en tablas sensibles |
| S-05 | El cliente registrado por la web puede vincularse a un cliente físico ya existente (mismo CI). | `sp_Vincular_Cuenta_Cliente_Existente` |
| S-06 | El nivel de acceso (1 a 4) define qué páginas y endpoints son visibles. | Middleware de autenticación + cookies HTTP-only con JWT (jose) |

## Replicación y red

| # | Regla | Garantía técnica |
| --- | --- | --- |
| N-01 | Las tablas comunes (catálogo, promociones, sedes, umbrales) se mantienen sincronizadas entre Central y Sede. | Triggers de cola + Job de consumo |
| N-02 | Una operación local no se bloquea si el linked server está caído. | La cola es asincrónica |
| N-03 | Un fallo permanente de replicación se descarta tras 3 intentos. | Lógica de reintentos en `sp_Procesar_Cola_Replicacion` |
| N-04 | El stock de la red completa se ve siempre en vivo, nunca replicado. | Vistas globales con linked server |
| N-05 | El umbral de stock se replica solo a sedes no centrales. | Trigger filtra `WHERE s.Es_Central = 0` |

## Cliente final (interfaz web)

| # | Regla | Garantía técnica |
| --- | --- | --- |
| W-01 | El cliente solo ve productos cuya disponibilidad real existe en alguna sede. | El endpoint del catálogo cruza `Producto` con `Stock_Actual` |
| W-02 | El cliente solo ve sus propios pedidos. | Filtro por `id_cliente` derivado de la sesión autenticada |
| W-03 | El feed personalizado caduca y se regenera. | Índice TTL en `feed_cliente` |
| W-04 | El cliente no puede reseñar productos que no compró: el formulario muestra una explicación inline. | El componente `ProductResenas` detecta la ausencia de compra y muestra el mensaje |
| W-05 | Las imágenes del producto admiten upload por administrador y se sirven con headers de caché. | Endpoint `/api/foto` |
