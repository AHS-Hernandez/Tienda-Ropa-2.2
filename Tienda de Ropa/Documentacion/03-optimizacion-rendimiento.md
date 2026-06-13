# 03 — Optimización y rendimiento

## Filosofía aplicada

Cada índice del sistema responde a una **consulta concreta y recurrente** del flujo operativo. No se crearon índices "por si acaso": cada `CREATE INDEX` está documentado con el SP o vista que lo justifica. La motivación es doble:

- Minimizar el costo de mantenimiento del optimizador (cada índice extra ralentiza `INSERT`/`UPDATE`).
- Garantizar que los índices que sí existen sean rentables todo el día.

El script completo, con justificación línea por línea, se encuentra en `SQL/Index & Statics.sql`.

## Inventario de índices por dominio

### Persona y Seguridad

| Índice | Tabla | Consulta justificada |
| --- | --- | --- |
| `IX_Persona_CI` | `Persona.Persona` | Búsqueda por CI en `fn_Buscar_Cliente` y validación anti-duplicado en registro |
| `IX_Persona_Email` | `Persona.Persona` | Login y validación de unicidad de correo |
| `IX_Persona_Sede` | `Persona.Persona` | Directorios filtrados por sede |
| `IX_Cliente_Persona` | `Persona.Cliente` | JOIN ineludible en todas las vistas de venta |
| `IX_Cliente_Nit` | `Persona.Cliente` | Autocompletado por NIT en el POS |
| `IX_Usuario_Username` | `Seguridad.Usuario` | Autenticación en cada login |
| `IX_Bitacora_Sede_Fecha` | `Seguridad.Bitacora` | Vista de trazabilidad por sede y rango |
| `IX_Bitacora_Usuario` | `Seguridad.Bitacora` | Auditoría dirigida a un empleado |

### Producto y Catálogo

| Índice | Tabla | Justificación |
| --- | --- | --- |
| `IX_Producto_Subcategoria` | `Producto.Producto` | JOIN masivo en `vw_Catalogo_Maestro` y reportes de ventas por categoría |
| `IX_Producto_Nombre` | `Producto.Producto` | Autocompletado al agregar al carrito |

### Inventario

| Índice | Tabla | Justificación |
| --- | --- | --- |
| `IX_StockActual_Sede_Producto` | `Inventario.Stock_Actual` | Crítico: validado en cada venta antes de descontar stock |
| `IX_Kardex_Producto_Sede` | `Inventario.Kardex` | Historial de movimientos por producto/sede |
| `IX_Kardex_Fecha` | `Inventario.Kardex` | Reporte de últimos movimientos ordenados |
| `IX_StockActual_Cantidad` | `Inventario.Stock_Actual` | Vista de alertas de stock bajo |
| `IX_Ajuste_Sede_Fecha` | `Inventario.Ajuste_Inventario` | Reporte de ajustes por sede |

### Ventas

| Índice | Tabla | Justificación |
| --- | --- | --- |
| `IX_VentaCabecera_Sede_Fecha` | `Ventas.Venta_Cabecera` | Consulta más frecuente del día: cierre de caja y dashboard |
| `IX_VentaCabecera_Estado` | `Ventas.Venta_Cabecera` | Búsqueda de borradores activos en el POS |
| `IX_VentaCabecera_Cliente` | `Ventas.Venta_Cabecera` | Historial de un cliente |
| `IX_VentaDetalle_Venta` | `Ventas.Venta_Detalle` | JOIN central de toda factura |
| `IX_VentaDetalle_Producto` | `Ventas.Venta_Detalle` | Top productos y ventas por categoría |

### Marketing

| Índice | Tabla | Justificación |
| --- | --- | --- |
| `IX_Promocion_Fechas` | `Marketing.Promocion` | Filtro de promociones vigentes (ejecutado en cada cálculo de precio) |
| `IX_PromoApp_Producto` | `Marketing.Promocion_Aplicacion` | Lookup de descuento por producto |
| `IX_PromoApp_Categoria_Sub` | `Marketing.Promocion_Aplicacion` | Descuentos a nivel de categoría/subcategoría |

### Compras y configuración

| Índice | Tabla | Justificación |
| --- | --- | --- |
| `IX_DetalleCompra_Compra` | `Compras.Detalle_Compra` | Detalle de cada orden |
| `IX_OrdenCompra_Estado_Fecha` | `Compras.Orden_Compra` | Pendientes vs recibidas |
| `IX_ReplicaControl_Sede_Tabla` | `Configuracion.Replica_Control` | EXISTS + UPDATE en cada ciclo de sincronización |

## Índice único filtrado para borradores

El número de factura admite múltiples `NULL` (un `NULL` por cada borrador activo). Para garantizar unicidad solo entre facturas emitidas:

```sql
CREATE UNIQUE NONCLUSTERED INDEX UX_Venta_Cabecera_NroFactura
    ON Ventas.Venta_Cabecera (Nro_factura)
    WHERE Nro_factura IS NOT NULL;
```

El filtro `WHERE` permite **mantener la integridad sin sacrificar el patrón de borrador-por-cliente**. La operación correcta del índice exige `SET QUOTED_IDENTIFIER ON` al momento de crear los procedimientos almacenados que insertan o actualizan la tabla.

## STATISTICS manuales

Sobre columnas frecuentemente filtradas pero sin índice dedicado se crearon estadísticas para mejorar la estimación de cardinalidad del optimizador:

| Estadística | Razón |
| --- | --- |
| `STAT_Persona_NombreApellido` | El `LIKE '%texto%'` de `fn_Buscar_Cliente` necesita estimación realista |
| `STAT_Usuario_NivelEstado` | Triggers de blindaje filtran por nivel y estado |
| `STAT_VentaCabecera_Fecha_Estado` | Dashboards de hoy y de últimos 7 días |
| `STAT_Kardex_Origenes` | Distribución de movimientos según el tipo de documento de origen |
| `STAT_Promocion_RangoFechas` | Promociones activas son pocas vs el total histórico |
| `STAT_StockActual_Cantidad_Sede` | Alertas de stock bajo |

## Reescritura de consultas — patrones aplicados

1. **`UNION ALL` en lugar de `UNION`** en vistas globales — no hay duplicados posibles entre Central y Sede, evitando el ordenamiento de deduplicación.
2. **`EXISTS` en lugar de `IN` con subconsulta** para validaciones en SPs — menor uso de memoria y mejor estimación.
3. **`TOP 500` en vistas de historial** — `vw_Ventas_Global` se consume desde la UI; limitar previene el escaneo total cuando solo se muestran las últimas operaciones.
4. **JOIN explícito en lugar de tuplas IN** — SQL Server no admite la sintaxis `(col1, col2) IN (subquery)`. En la replicación se usa el patrón:
   ```sql
   DELETE s FROM tabla s
   JOIN (SELECT id_a, id_b FROM OPENJSON(@payload) WITH (...)) j
     ON s.id_a = j.id_a AND s.id_b = j.id_b;
   ```
5. **`EXEC ('sql') AT SEDE`** para INSERTs en tablas con columna IDENTITY en el linked server. El proveedor OLE DB intenta mapear todas las columnas (incluida la IDENTITY) y falla; ejecutar el SQL como texto en el nodo remoto sortea ese mapeo.

## Análisis de plan de ejecución

Los planes se validaron sobre las consultas críticas en `SQL/Test Index.sql`. Las tres operaciones más sensibles del sistema (cobro de venta, validación de stock, cálculo de descuento) muestran:

- **Index Seek** sobre los índices declarados, sin Key Lookups gracias a la cláusula `INCLUDE`.
- **Nested Loop** en JOINs de cardinalidad baja (`Cliente → Persona`) e **Hash Match** en agregaciones de ventas históricas.
- Eliminación de **Sort** operators en `ORDER BY Fecha_emision DESC` por orden físico del índice `IX_VentaCabecera_Sede_Fecha`.

## Mantenimiento programado

Las estadísticas se actualizan vía `UPDATE STATISTICS` semanal y los índices se reconstruyen cuando la fragmentación supera el 30 %, según la práctica estándar recomendada por Microsoft. El SQL Agent Job que procesa la cola de replicación incluye una tarea complementaria de mantenimiento de stats sobre las tablas que reciben mayor volumen de inserts (`Venta_Detalle`, `Kardex`, `Bitacora`).
