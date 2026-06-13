# 01 — Modelado lógico y físico

## Visión general

El modelo relacional se organiza en **ocho esquemas por dominio funcional**, una decisión deliberada para limitar el acoplamiento entre subsistemas y permitir granular los permisos por área de responsabilidad.

| Esquema | Responsabilidad | Tablas principales |
| --- | --- | --- |
| `Configuracion` | Topología de la red, control de réplica | `Sede`, `Replica_Control`, `Cola_Replicacion` |
| `Persona` | Identidad común a clientes y empleados | `Persona`, `Cliente`, `Empleado` |
| `Seguridad` | Autenticación y auditoría | `Usuario`, `Bitacora` |
| `Producto` | Catálogo maestro jerárquico | `Categoria`, `Subcategoria`, `Producto` |
| `Compras` | Abastecimiento (solo Central) | `Proveedor`, `Orden_Compra`, `Detalle_Compra` |
| `Inventario` | Stock, kardex y umbrales | `Stock_Actual`, `Kardex`, `Ajuste_Inventario`, `Stock_Umbral` |
| `Ventas` | Cabecera y detalle de facturación | `Venta_Cabecera`, `Venta_Detalle` |
| `Marketing` | Promociones y alcance | `Promocion`, `Promocion_Aplicacion` |

## Justificación de la separación Persona / Cliente / Empleado

La tabla `Persona.Persona` agrupa los **atributos comunes a toda persona física** (nombre, apellido, CI, contacto). Las tablas `Cliente` y `Empleado` extienden esta entidad con los atributos exclusivos de cada rol. Esta organización elimina la repetición de datos y permite que **una misma persona sea simultáneamente cliente y empleado** sin duplicación de registros, una situación frecuente en negocios familiares.

## Cumplimiento de la Tercera Forma Normal

Todas las tablas cumplen 3FN. Casos representativos:

- **`Producto.Producto`** depende únicamente de `id_producto`. La categoría no se almacena directamente: se accede vía `id_subcategoria → id_categoria`, eliminando la dependencia transitiva.
- **`Ventas.Venta_Detalle`** almacena `Nombre`, `Color`, `Talla` y `Precio_unitario` como **datos históricos congelados**, no como duplicación. Esto es deliberado: si el precio o nombre del producto cambia mañana, la factura emitida debe mantener los valores vigentes al momento de la venta. Es una **desnormalización justificada por requisitos de auditoría legal de facturación**.
- **`Persona.Persona`** no almacena el nombre de la sede, solo su `id_sede`. La denormalización de nombres se hace en vistas (`vw_Directorio_Clientes`), no en la tabla base.

## Integridad referencial

Toda relación entre entidades se establece mediante **claves foráneas explícitas con nombre convencional** (`FK_<Hijo>_<Padre>`). Las restricciones de dominio se expresan como `CHECK`:

- `Seguridad.Usuario.Nivel_acceso ∈ {1, 2, 3, 4}` — cuatro niveles jerárquicos del sistema.
- `Seguridad.Bitacora.Accion ∈ {'INSERT', 'UPDATE', 'DELETE', 'LOGIN'}` — enumera los eventos auditables.
- `Ventas.Venta_Cabecera.Estado ∈ {'Borrador', 'Pendiente', 'Pagada', 'Entregada', 'Anulada'}` — máquina de estados de venta.
- `Inventario.Stock_Actual.Cantidad >= 0` — invariante de inventario.
- `Persona.Empleado.Salario_base >= 0` — invariante de negocio.

## Restricciones especiales

**Filtered Unique Index sobre `Nro_factura`** — el número de factura es único entre ventas emitidas, pero los borradores (carritos abiertos) lo mantienen en `NULL`. Un `UNIQUE` clásico permitiría un solo NULL en toda la tabla; se emplea un índice único filtrado que excluye los nulos:

```sql
CREATE UNIQUE NONCLUSTERED INDEX UX_Venta_Cabecera_NroFactura
    ON Ventas.Venta_Cabecera (Nro_factura)
    WHERE Nro_factura IS NOT NULL;
```

**Identificador compuesto en `Stock_Actual`** — la clave es `(id_producto, id_sede)`. Cada combinación es única; cada sede maneja su propio stock por producto.

**Identificador compuesto en `Stock_Umbral`** — la clave de negocio es `(id_subcategoria, id_sede)`. El umbral mínimo de seguridad se define por familia de productos y por sucursal.

## Fragmentación horizontal por sede

El sistema es físicamente distribuido. La columna `id_sede` actúa como **clave de fragmentación**: cada nodo de SQL Server contiene **únicamente los registros que le pertenecen** para las tablas operativas.

| Tabla | Estrategia | Justificación |
| --- | --- | --- |
| `Persona.Persona` | Fragmentada por `id_sede` | Cada sede gestiona sus propios clientes y empleados |
| `Seguridad.Usuario` | Fragmentada por `id_sede` | El login es local a la sede del usuario |
| `Seguridad.Bitacora` | Fragmentada por `id_sede` | Auditoría local; no se centraliza |
| `Ventas.Venta_Cabecera` | Fragmentada por `id_sede` | Cada venta pertenece a la sucursal donde se emitió |
| `Ventas.Venta_Detalle` | Fragmentada vía la cabecera | Sigue el fragmento del padre |
| `Inventario.Stock_Actual` | Fragmentada por `id_sede` | Cada sede ve solo su stock disponible |
| `Inventario.Kardex` | Fragmentada por `id_sede` | Cada movimiento ocurre en una sede específica |
| `Producto.*` | **Replicada** | Catálogo común a toda la cadena |
| `Marketing.*` | **Replicada** | Campañas vigentes en toda la red |
| `Configuracion.Sede` | **Replicada** | Topología conocida por todos los nodos |
| `Compras.*` | **Solo Central** | Las compras a proveedores las decide la oficina central |

La replicación de tablas comunes se gestiona mediante triggers `AFTER INSERT/UPDATE/DELETE` que encolan operaciones en `Configuracion.Cola_Replicacion`. Un procedimiento `sp_Procesar_Cola_Replicacion`, ejecutado por **SQL Server Agent Job**, consume la cola y replica los cambios a través del *linked server* `SEDE`.

## Estrategia de visibilidad transversal

Cuando una operación necesita ver datos de **todas** las sedes (por ejemplo, el dashboard del dueño o la búsqueda de clientes nuevos), no se consulta el dato replicado: se accede en vivo mediante linked server. Esto se materializa en vistas:

- `Inventario.vw_Stock_Sede_TiempoReal`
- `Ventas.vw_Ventas_Hoy_Global`
- `Ventas.vw_Ventas_Global` (historial completo)
- `Ventas.vw_Ventas_Detalle_Global`
- `Persona.vw_Empleados_Global_TiempoReal`
- `Persona.vw_Clientes_Global_TiempoReal`

Cada vista realiza un `UNION ALL` entre el fragmento local de Central y el fragmento remoto de Sede vía `SEDE.TiendaRopa.<esquema>.<tabla>`. Esta decisión arquitectónica separa el **dato sincronizado para operación local** del **dato en vivo para decisión gerencial**, evitando que el stock visto por el dueño esté desactualizado respecto a la venta que se acaba de cobrar en una sucursal.
