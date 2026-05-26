-- ================================================================
-- ÍNDICES Y STATISTICS — TiendaRopa
-- Ejecutar en: USE TiendaRopa
-- Aplica a: Central y Sede (se indica cuáles son solo Central)
-- ================================================================
-- ORDEN RECOMENDADO DE EJECUCIÓN:
--   1. Índices de búsqueda/lookup frecuente
--   2. Índices de JOINs en vistas y SP críticos
--   3. Índices de rango/fecha para dashboards
--   4. Statistics manuales en columnas de filtro no indexadas
-- ================================================================

USE TiendaRopa;
GO

-- ================================================================
-- SCHEMA: Persona
-- ================================================================

-- [IDX-01] Búsqueda por CI — fn_Buscar_Cliente, sp_Registrar_Cliente_Completo
-- Cada registro de venta valida duplicados por CI. Es el lookup más frecuente.
CREATE NONCLUSTERED INDEX IX_Persona_CI
    ON Persona.Persona (CI)
    INCLUDE (Nombre, Apellido, Email, id_sede);
GO

-- [IDX-02] Búsqueda por Email — login, validación de duplicados en registro
-- Seguridad.trg_Username_Unico exige Username = Email; se busca por ambos.
CREATE NONCLUSTERED INDEX IX_Persona_Email
    ON Persona.Persona (Email)
    INCLUDE (Nombre, Apellido, id_sede);
GO

-- [IDX-03] Búsqueda de persona por sede — vistas globales y reportes RRHH
-- vw_Directorio_RRHH, vw_Empleados_Global_TiempoReal filtran por id_sede.
CREATE NONCLUSTERED INDEX IX_Persona_Sede
    ON Persona.Persona (id_sede)
    INCLUDE (Nombre, Apellido, CI, Email);
GO

-- [IDX-04] JOIN Cliente → Persona — toda venta pasa por este join
-- vw_Factura_Detallada, vw_Monitor_Ventas_Cabecera, fn_Buscar_Cliente.
CREATE NONCLUSTERED INDEX IX_Cliente_Persona
    ON Persona.Cliente (id_persona)
    INCLUDE (Nit_ci_facturacion);
GO

-- [IDX-05] Búsqueda por NIT de facturación — autocompletado POS
-- vw_Clientes_Autocompletado y fn_Buscar_Cliente buscan por NIT.
CREATE NONCLUSTERED INDEX IX_Cliente_Nit
    ON Persona.Cliente (Nit_ci_facturacion)
    INCLUDE (id_persona);
GO


-- ================================================================
-- SCHEMA: Seguridad
-- ================================================================

-- [IDX-06] Login por Username — autenticación en cada sesión
-- sp_Login busca por Username en cada acceso al sistema.
CREATE NONCLUSTERED INDEX IX_Usuario_Username
    ON Seguridad.Usuario (Username)
    INCLUDE (id_persona, id_sede, Nivel_acceso, Estado, Password);
GO

-- [IDX-07] Bitácora por sede + fecha — trazabilidad y auditoría
-- vw_Trazabilidad_Bitacora; administrador filtra por sede y rango de fechas.
CREATE NONCLUSTERED INDEX IX_Bitacora_Sede_Fecha
    ON Seguridad.Bitacora (id_sede, Fecha_hora DESC)
    INCLUDE (id_usuario, Accion, Tabla_afectada);
GO

-- [IDX-08] Bitácora por usuario — historial de acciones de un empleado
-- Consulta frecuente al auditar un usuario específico.
CREATE NONCLUSTERED INDEX IX_Bitacora_Usuario
    ON Seguridad.Bitacora (id_usuario, Fecha_hora DESC);
GO


-- ================================================================
-- SCHEMA: Producto
-- ================================================================

-- [IDX-09] Producto por subcategoría — JOIN desde vistas de catálogo
-- vw_Catalogo_Maestro, vw_Ventas_Por_Categoria_7Dias hacen este JOIN masivo.
CREATE NONCLUSTERED INDEX IX_Producto_Subcategoria
    ON Producto.Producto (id_subcategoria)
    INCLUDE (Nombre, Marca, Color, Talla, Precio_venta, Precio_costo);
GO

-- [IDX-10] Búsqueda de producto por nombre — autocompletado al agregar al carrito
-- sp_Agregar_Producto_Venta busca y valida productos por nombre/ID.
CREATE NONCLUSTERED INDEX IX_Producto_Nombre
    ON Producto.Producto (Nombre)
    INCLUDE (id_subcategoria, Precio_venta, Color, Talla);
GO


-- ================================================================
-- SCHEMA: Inventario
-- ================================================================

-- [IDX-11] Stock por sede — CRÍTICO: consultado en cada venta antes de vender
-- sp_Agregar_Producto_Venta verifica stock por id_producto + id_sede.
-- trg_Kardex_SincronizarStock hace MERGE sobre esta clave compuesta.
CREATE NONCLUSTERED INDEX IX_StockActual_Sede_Producto
    ON Inventario.Stock_Actual (id_sede, id_producto)
    INCLUDE (Cantidad);
GO

-- [IDX-12] Kardex por producto + sede — historial de movimientos
-- vw_Auditoria_Kardex_Maestro y reportes de trazabilidad filtran por ambos.
CREATE NONCLUSTERED INDEX IX_Kardex_Producto_Sede
    ON Inventario.Kardex (id_producto, id_sede)
    INCLUDE (Cantidad, Fecha, id_venta, id_compra, id_ajuste);
GO

-- [IDX-13] Kardex por fecha DESC — reporte de últimos movimientos
-- Consultas de auditoría reciente siempre ordenan por Fecha descendente.
CREATE NONCLUSTERED INDEX IX_Kardex_Fecha
    ON Inventario.Kardex (Fecha DESC)
    INCLUDE (id_producto, id_sede, Cantidad);
GO

-- [IDX-14] Alertas de stock bajo — vw_Alertas_Stock_Bajo (CROSS JOIN filtrado)
-- La vista filtra Stock_Actual por Cantidad <= 10; este índice lo cubre.
CREATE NONCLUSTERED INDEX IX_StockActual_Cantidad
    ON Inventario.Stock_Actual (Cantidad)
    INCLUDE (id_producto, id_sede);
GO

-- [IDX-15] Ajuste por sede + fecha — reporte de ajustes por sede
-- vw_Reporte_Ajustes filtra y ordena por id_sede y Fecha.
CREATE NONCLUSTERED INDEX IX_Ajuste_Sede_Fecha
    ON Inventario.Ajuste_Inventario (id_sede, Fecha DESC)
    INCLUDE (id_usuario, Tipo_ajuste, Motivo);
GO


-- ================================================================
-- SCHEMA: Ventas
-- ================================================================

-- [IDX-16] Venta_Cabecera por sede + fecha — dashboards y cierre de caja
-- vw_Resumen_Ventas_Hoy_Sede, vw_Ventas_Hoy_Global filtran por sede y fecha HOY.
-- Es la consulta más ejecutada durante el horario comercial.
CREATE NONCLUSTERED INDEX IX_VentaCabecera_Sede_Fecha
    ON Ventas.Venta_Cabecera (id_sede, Fecha_emision DESC)
    INCLUDE (Estado, Total_neto, Total_bruto, Total_descuento, id_cliente, id_usuario, Metodo_pago);
GO

-- [IDX-17] Venta_Cabecera por estado — vw_Venta_Borrador_Linea filtra Estado='Borrador'
-- El POS consulta borradores activos constantemente durante la jornada.
CREATE NONCLUSTERED INDEX IX_VentaCabecera_Estado
    ON Ventas.Venta_Cabecera (Estado)
    INCLUDE (id_sede, id_cliente, id_usuario, Fecha_emision);
GO

-- [IDX-18] Venta_Cabecera por cliente — historial de compras de un cliente
-- sp_Marcar_Venta_Entregada y consultas de historial buscan por id_cliente.
CREATE NONCLUSTERED INDEX IX_VentaCabecera_Cliente
    ON Ventas.Venta_Cabecera (id_cliente)
    INCLUDE (Estado, Fecha_emision, Total_neto, Nro_factura);
GO

-- [IDX-19] Venta_Detalle por venta — JOIN central de toda factura
-- vw_Factura_Detallada, sp_Eliminar_Producto_Venta, sp_Procesar_Cobro_Venta.
-- Cada cobro recorre todos los detalles de la venta.
CREATE NONCLUSTERED INDEX IX_VentaDetalle_Venta
    ON Ventas.Venta_Detalle (id_venta)
    INCLUDE (id_producto, Cantidad, Precio_unitario, Subtotal, Nombre, Color, Talla);
GO

-- [IDX-20] Venta_Detalle por producto — top productos, ventas por categoría
-- vw_Top_Productos_7Dias y vw_Ventas_Por_Categoria_7Dias agregan por producto.
CREATE NONCLUSTERED INDEX IX_VentaDetalle_Producto
    ON Ventas.Venta_Detalle (id_producto)
    INCLUDE (id_venta, Cantidad, Subtotal, Nombre);
GO


-- ================================================================
-- SCHEMA: Compras (SOLO CENTRAL)
-- ================================================================

-- [IDX-21] Detalle_Compra por compra — vw_Detalle_Mercaderia, vw_Compras_Con_Detalle
-- Cada consulta de orden de compra hace JOIN con sus detalles.
CREATE NONCLUSTERED INDEX IX_DetalleCompra_Compra
    ON Compras.Detalle_Compra (id_compra)
    INCLUDE (id_producto, Cantidad, Costo_unitario);
GO

-- [IDX-22] Orden_Compra por estado — filtrado de compras pendientes vs recibidas
-- Administración filtra por Estado para gestión de compras activas.
CREATE NONCLUSTERED INDEX IX_OrdenCompra_Estado_Fecha
    ON Compras.Orden_Compra (Estado, Fecha DESC)
    INCLUDE (id_proveedor, Total_compra);
GO


-- ================================================================
-- SCHEMA: Marketing
-- ================================================================

-- [IDX-23] Promoción por rango de fechas — fn_Calcular_Descuento_Producto
-- Esta función se llama en CADA producto agregado al carrito.
-- Filtra promociones vigentes por fecha; sin índice = scan completo.
CREATE NONCLUSTERED INDEX IX_Promocion_Fechas
    ON Marketing.Promocion (Fecha_inicio, Fecha_fin)
    INCLUDE (Porcentaje, Monto);
GO

-- [IDX-24] Promocion_Aplicacion por producto — lookup de descuento por producto
-- fn_Calcular_Descuento_Producto busca si hay promo aplicable al id_producto.
CREATE NONCLUSTERED INDEX IX_PromoApp_Producto
    ON Marketing.Promocion_Aplicacion (id_producto)
    INCLUDE (id_promocion, Monto_minimo_compra);
GO

-- [IDX-25] Promocion_Aplicacion por categoría y subcategoría — descuentos por categoría
-- La función también evalúa promos que aplican a toda una categoría/subcategoría.
CREATE NONCLUSTERED INDEX IX_PromoApp_Categoria_Sub
    ON Marketing.Promocion_Aplicacion (id_categoria, id_subcategoria)
    INCLUDE (id_promocion, id_producto, Monto_minimo_compra);
GO


-- ================================================================
-- SCHEMA: Configuracion
-- ================================================================

-- [IDX-26] Replica_Control por sede + tabla — sp_Registrar_Sincronizacion
-- Hace EXISTS + UPDATE sobre (id_sede, Tabla_nombre) en cada sincronización.
CREATE NONCLUSTERED INDEX IX_ReplicaControl_Sede_Tabla
    ON Configuracion.Replica_Control (id_sede, Tabla_nombre)
    INCLUDE (Ultima_sync, Estado, Registros_sync);
GO


-- ================================================================
-- STATISTICS MANUALES
-- Columnas usadas en WHERE/JOIN sin índice propio suficiente.
-- SQL Server crea stats automáticas en columnas indexadas,
-- pero estas son columnas de filtro en scans o funciones escalares.
-- ================================================================

-- [STAT-01] Persona.Persona — búsqueda por nombre/apellido (LIKE en fn_Buscar_Cliente)
-- El optimizador subestima la selectividad de LIKE '%texto%' sin stats actualizadas.
CREATE STATISTICS STAT_Persona_NombreApellido
    ON Persona.Persona (Nombre, Apellido);
GO

-- [STAT-02] Seguridad.Usuario — filtrado por Nivel_acceso + Estado
-- Triggers de blindaje y SP de creación filtran por Nivel_acceso frecuentemente.
CREATE STATISTICS STAT_Usuario_NivelEstado
    ON Seguridad.Usuario (Nivel_acceso, Estado);
GO

-- [STAT-03] Ventas.Venta_Cabecera — filtro por Fecha_emision (dashboards de hoy/7 días)
-- Las vistas de dashboard aplican WHERE sobre fecha; stats mejoran estimación de filas.
CREATE STATISTICS STAT_VentaCabecera_Fecha_Estado
    ON Ventas.Venta_Cabecera (Fecha_emision, Estado);
GO

-- [STAT-04] Inventario.Kardex — distribución de movimientos por tipo de origen
-- El optimizador necesita saber cuántos registros tienen id_venta vs id_compra vs id_ajuste.
CREATE STATISTICS STAT_Kardex_Origenes
    ON Inventario.Kardex (id_venta, id_compra, id_ajuste);
GO

-- [STAT-05] Marketing.Promocion — distribución de promociones activas por fecha
-- fn_Calcular_Descuento_Producto filtra por fecha hoy; pocas promos activas vs total.
CREATE STATISTICS STAT_Promocion_RangoFechas
    ON Marketing.Promocion (Fecha_inicio, Fecha_fin);
GO

-- [STAT-06] Inventario.Stock_Actual — distribución de cantidad por sede
-- vw_Alertas_Stock_Bajo filtra Cantidad <= 10; el optimizador debe saber cuántos hay.
CREATE STATISTICS STAT_Stock_Cantidad_Sede
    ON Inventario.Stock_Actual (id_sede, Cantidad);
GO

-- [STAT-07] Ventas.Venta_Detalle — distribución de productos vendidos
-- vw_Top_Productos_7Dias agrupa por id_producto; stats mejoran el plan de GROUP BY.
CREATE STATISTICS STAT_VentaDetalle_Producto_Cantidad
    ON Ventas.Venta_Detalle (id_producto, Cantidad);
GO


-- ================================================================
-- MANTENIMIENTO — UPDATE STATISTICS PROGRAMADO
-- Ejecutar diariamente en horario de baja carga (madrugada).
-- Las tablas de Ventas, Kardex y Bitacora crecen cada jornada.
-- ================================================================

UPDATE STATISTICS Ventas.Venta_Cabecera   WITH FULLSCAN;
UPDATE STATISTICS Ventas.Venta_Detalle    WITH FULLSCAN;
UPDATE STATISTICS Inventario.Kardex       WITH FULLSCAN;
UPDATE STATISTICS Inventario.Stock_Actual WITH FULLSCAN;
UPDATE STATISTICS Seguridad.Bitacora      WITH FULLSCAN;
UPDATE STATISTICS Marketing.Promocion     WITH FULLSCAN;
GO

PRINT '================================================================';
PRINT 'Índices y Statistics creados correctamente — TiendaRopa';
PRINT 'Total índices  : 26';
PRINT 'Total statistics: 7';
PRINT 'UPDATE STATISTICS programado: 6 tablas críticas';
PRINT '================================================================';
GO