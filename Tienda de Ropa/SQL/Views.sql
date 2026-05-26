-- -------------------------------------
-- SCHEMA: Persona
-- -------------------------------------

CREATE VIEW Persona.vw_Directorio_Clientes AS
SELECT 
    c.id_cliente,
    p.id_persona,
    p.id_sede,
    CONCAT(p.Nombre, ' ', p.Apellido) AS Nombre_completo,
    p.CI,
    p.Telefono,
    p.Email,
    c.Nit_ci_facturacion
FROM Persona.Cliente c
INNER JOIN Persona.Persona p 
    ON c.id_persona = p.id_persona;
GO

CREATE VIEW Persona.vw_Clientes_Autocompletado AS
SELECT 
    c.id_cliente,
    p.id_sede,
    p.CI,
    c.Nit_ci_facturacion
FROM Persona.Cliente c
INNER JOIN Persona.Persona p 
    ON c.id_persona = p.id_persona;
GO

CREATE VIEW Persona.vw_Directorio_RRHH AS
SELECT 
    e.id_empleado,
    p.id_sede,
    CONCAT(p.Nombre, ' ', p.Apellido) AS Nombre_completo,
    p.CI,
    p.Telefono,
    p.Email,
    e.Fecha_contratacion,
    e.Salario_base
FROM Persona.Empleado e
INNER JOIN Persona.Persona p 
    ON e.id_persona = p.id_persona;
GO

-- -------------------------------------
-- SCHEMA: Seguridad
-- -------------------------------------

CREATE VIEW Seguridad.vw_Usuarios_Sistema AS
SELECT 
    p.Nombre,
    p.Apellido,
    u.id_usuario,
    u.id_sede,
    u.Username,
    u.Nivel_acceso,
    u.Estado
FROM Seguridad.Usuario u
INNER JOIN Persona.Persona p 
    ON u.id_persona = p.id_persona;
GO

CREATE VIEW Seguridad.vw_Trazabilidad_Bitacora AS
SELECT 
    b.id_log,
    b.id_sede,
    b.Accion,
    b.Tabla_afectada,
    b.Fecha_hora,
    CONCAT(p.Nombre, ' ', p.Apellido) AS Usuario,
    u.Username,
    b.Valor_anterior,
    b.Valor_nuevo
FROM Seguridad.Bitacora b
INNER JOIN Seguridad.Usuario u 
    ON b.id_usuario = u.id_usuario
INNER JOIN Persona.Persona p 
    ON u.id_persona = p.id_persona;
GO

-- -------------------------------------
-- SCHEMA: Compras (SOLO CENTRAL)
-- -------------------------------------

CREATE VIEW Compras.vw_Directorio_Proveedores AS
SELECT 
    id_proveedor,
    Razon_social,
    Nit,
    Contacto_nombre,
    Telefono,
    Email,
    Direccion
FROM Compras.Proveedor;
GO

CREATE VIEW Compras.vw_Selector_Proveedores_Activos AS
SELECT 
    id_proveedor,
    Razon_social
FROM Compras.Proveedor;
GO

CREATE VIEW Compras.vw_Compras_Totales AS
SELECT 
    OC.id_compra,
    OC.Fecha AS Fecha_Emision,
    PV.Razon_social AS Proveedor,
    PV.Nit AS NIT_Proveedor,
    OC.Estado,
    OC.Total_compra
FROM Compras.Orden_Compra OC
INNER JOIN Compras.Proveedor PV 
    ON OC.id_proveedor = PV.id_proveedor;
GO

CREATE VIEW Compras.vw_Detalle_Mercaderia AS
SELECT 
    DC.id_compra,
    P.id_producto,
    P.Nombre AS Producto_Nombre,
    P.Marca,
    P.Talla,
    P.Color,
    DC.Cantidad,
    DC.Costo_unitario,
    CAST((DC.Cantidad * DC.Costo_unitario) AS DECIMAL(10,2)) AS Subtotal
FROM Compras.Detalle_Compra DC
INNER JOIN Producto.Producto P 
    ON DC.id_producto = P.id_producto;
GO

-- -------------------------------------
-- SCHEMA: Producto
-- CENTRAL: incluye Precio_costo
-- -------------------------------------

CREATE VIEW Producto.vw_Catalogo_Maestro AS
SELECT 
    p.id_producto,
    p.Nombre,
    p.Descripcion,
    p.Marca,
    p.Color,
    p.Talla,
    p.Precio_costo,
    p.Precio_venta,
    sc.Nombre AS Subcategoria,
    c.Nombre  AS Categoria
FROM Producto.Producto p
INNER JOIN Producto.Subcategoria sc 
    ON p.id_subcategoria = sc.id_subcategoria
INNER JOIN Producto.Categoria c 
    ON sc.id_categoria = c.id_categoria;
GO

CREATE VIEW Producto.vw_Listado_Categorias AS
SELECT 
    id_categoria,
    Nombre
FROM Producto.Categoria;
GO

CREATE VIEW Producto.vw_Listado_Subcategorias AS
SELECT 
    sc.id_subcategoria,
    sc.Nombre,
    sc.id_categoria,
    c.Nombre AS Categoria
FROM Producto.Subcategoria sc
INNER JOIN Producto.Categoria c 
    ON sc.id_categoria = c.id_categoria;
GO

-- -------------------------------------
-- SCHEMA: Inventario
-- -------------------------------------

CREATE VIEW Inventario.vw_Disponibilidad_Stock AS
SELECT 
    p.id_producto,
    p.Nombre,
    p.Talla,
    p.Color,
    s.id_sede,
    s.Cantidad AS Cantidad_Disponible
FROM Inventario.Stock_Actual s
INNER JOIN Producto.Producto p 
    ON s.id_producto = p.id_producto;
GO

CREATE VIEW Inventario.vw_Reporte_Ajustes AS
SELECT 
    a.id_ajuste,
    a.Fecha,
    a.id_sede,
    pe.Nombre + ' ' + pe.Apellido AS Autorizado_Por,
    a.Tipo_ajuste,
    a.Motivo,
    p.Nombre AS Producto_Afectado,
    k.Cantidad AS Cantidad_Ajustada
FROM Inventario.Ajuste_Inventario a
INNER JOIN Seguridad.Usuario u  
    ON a.id_usuario  = u.id_usuario
INNER JOIN Persona.Persona pe   
    ON u.id_persona  = pe.id_persona
INNER JOIN Inventario.Kardex k  
    ON a.id_ajuste   = k.id_ajuste
INNER JOIN Producto.Producto p  
    ON k.id_producto = p.id_producto;
GO

-- SOLO CENTRAL: cruza con Compras que Sede no tiene
CREATE VIEW Inventario.vw_Auditoria_Kardex_Maestro AS
SELECT 
    k.id_movimiento,
    k.id_sede,
    k.Fecha AS Fecha_Movimiento,
    p.Nombre AS Producto,
    p.Talla,
    p.Color,
    k.Cantidad AS Variacion_Stock,
    CASE 
        WHEN k.id_venta  IS NOT NULL 
            THEN CONCAT('Factura #', COALESCE(v.Nro_factura, CAST(v.id_venta AS NVARCHAR)))
        WHEN k.id_compra IS NOT NULL 
            THEN CONCAT('Orden de Compra #', c.id_compra)
        WHEN k.id_ajuste IS NOT NULL 
            THEN CONCAT('Ajuste: ', a.Tipo_ajuste)
        ELSE 'Origen Desconocido'
    END AS Documento_Referencia
FROM Inventario.Kardex k
INNER JOIN Producto.Producto p             
    ON k.id_producto = p.id_producto
LEFT JOIN  Ventas.Venta_Cabecera v         
    ON k.id_venta    = v.id_venta
LEFT JOIN  Compras.Orden_Compra c          
    ON k.id_compra   = c.id_compra
LEFT JOIN  Inventario.Ajuste_Inventario a  
    ON k.id_ajuste   = a.id_ajuste;
GO

-- SOLO CENTRAL: stock de todas las sedes unificado
CREATE VIEW Inventario.vw_Stock_Consolidado AS
SELECT 
    p.id_producto,
    p.Nombre AS Producto,
    p.Talla,
    p.Color,
    s.Nombre AS Sede,
    sa.Cantidad,
    sa.id_sede
FROM Inventario.Stock_Actual sa
INNER JOIN Producto.Producto p   
    ON sa.id_producto = p.id_producto
INNER JOIN Configuracion.Sede s  
    ON sa.id_sede     = s.id_sede;
GO

CREATE VIEW Inventario.vw_Alertas_Stock_Bajo AS
SELECT
    s.Nombre        AS Sede,
    p.id_producto,
    p.Nombre        AS Producto,
    p.Talla,
    p.Color,
    ISNULL(sa.Cantidad, 0) AS Cantidad,
    CASE
        WHEN ISNULL(sa.Cantidad, 0) = 0 THEN 'Agotado'
        WHEN sa.Cantidad <= 5       THEN 'Crítico'
        ELSE 'Bajo'
    END             AS Nivel_Alerta
FROM Producto.Producto p
CROSS JOIN Configuracion.Sede s
LEFT JOIN Inventario.Stock_Actual sa
    ON sa.id_producto = p.id_producto AND sa.id_sede = s.id_sede
WHERE ISNULL(sa.Cantidad, 0) <= 10;
GO

-- -------------------------------------
-- SCHEMA: Ventas
-- -------------------------------------

CREATE VIEW Ventas.vw_Monitor_Ventas_Cabecera AS
SELECT 
    vc.id_venta,
    vc.Nro_factura,
    vc.Fecha_emision,
    vc.id_sede,
    pp.Nombre + ' ' + pp.Apellido AS Cliente_Nombre,
    c.Nit_ci_facturacion AS Cliente_NIT,
    p_usu.Nombre + ' ' + p_usu.Apellido AS Cajero_Nombre,
    vc.Metodo_pago,
    vc.Estado,
    vc.Total_bruto,
    vc.Total_descuento,
    vc.Total_neto
FROM Ventas.Venta_Cabecera vc
INNER JOIN Persona.Cliente c      
    ON vc.id_cliente  = c.id_cliente
INNER JOIN Persona.Persona pp     
    ON c.id_persona   = pp.id_persona
INNER JOIN Seguridad.Usuario u    
    ON vc.id_usuario  = u.id_usuario
INNER JOIN Persona.Persona p_usu  
    ON u.id_persona   = p_usu.id_persona;
GO

CREATE OR ALTER VIEW Ventas.vw_Factura_Detallada AS
SELECT
    vc.id_venta,
    vc.id_sede,
    vc.Estado,
    vc.Nro_factura,
    vc.Fecha_emision,
    vc.Metodo_pago,
    p_cli.Nombre + ' ' + p_cli.Apellido AS Razon_Social,
    cli.Nit_ci_facturacion AS NIT_Facturacion,
    vd.id_detalle,
    vd.id_producto,
    vd.Nombre AS Producto_Vendido,
    vd.Color,
    vd.Talla,
    vd.Cantidad,
    vd.Precio_unitario,
    vd.Subtotal,
    vc.Total_bruto,
    vc.Total_descuento,
    vc.Total_neto
FROM Ventas.Venta_Cabecera vc
INNER JOIN Ventas.Venta_Detalle vd
    ON vc.id_venta = vd.id_venta
INNER JOIN Persona.Cliente cli
    ON vc.id_cliente = cli.id_cliente
INNER JOIN Persona.Persona p_cli
    ON cli.id_persona = p_cli.id_persona;
GO

CREATE OR ALTER VIEW Ventas.vw_Venta_Borrador_Linea AS
SELECT
    vd.id_detalle,
    vd.id_venta,
    vd.id_producto,
    vc.id_sede,
    vc.id_cliente,
    vc.id_usuario,
    vc.Estado,
    vd.Nombre AS nombre,
    vd.Color AS color,
    vd.Talla AS talla,
    vd.Cantidad AS cantidad,
    vd.Precio_unitario AS precio_unitario,
    vd.Subtotal AS subtotal
FROM Ventas.Venta_Detalle vd
INNER JOIN Ventas.Venta_Cabecera vc
    ON vd.id_venta = vc.id_venta
WHERE vc.Estado = 'Borrador';
GO

CREATE VIEW Compras.vw_Compras_Con_Detalle AS
SELECT
    oc.id_compra,
    oc.Fecha            AS Fecha_Emision,
    pv.Razon_social     AS Proveedor,
    pv.Nit              AS NIT_Proveedor,
    oc.Estado,
    oc.Total_compra,
    p.id_producto,
    p.Nombre            AS Producto,
    p.Marca,
    p.Talla,
    p.Color,
    dc.Cantidad,
    dc.Costo_unitario,
    CAST(dc.Cantidad * dc.Costo_unitario AS DECIMAL(10,2)) AS Subtotal_Linea
FROM Compras.Orden_Compra oc
INNER JOIN Compras.Proveedor pv
    ON oc.id_proveedor  = pv.id_proveedor
INNER JOIN Compras.Detalle_Compra dc
    ON oc.id_compra     = dc.id_compra
INNER JOIN Producto.Producto p
    ON dc.id_producto   = p.id_producto;
GO

-- -------------------------------------
-- SCHEMA: Marketing
-- -------------------------------------

CREATE VIEW Marketing.vw_Promociones_Activas_Hoy AS
SELECT 
    id_promocion,
    Nombre,
    Porcentaje,
    Monto,
    Fecha_inicio,
    Fecha_fin
FROM Marketing.Promocion
WHERE CAST(GETDATE() AS DATE) BETWEEN Fecha_inicio AND Fecha_fin;
GO

CREATE VIEW Marketing.vw_Explorador_Descuentos_Full AS
SELECT 
    p.id_promocion,
    p.Nombre AS Campana,
    CASE 
        WHEN p.Porcentaje IS NOT NULL 
            THEN CAST(p.Porcentaje AS NVARCHAR) + ' %'
        WHEN p.Monto IS NOT NULL 
            THEN '$us ' + CAST(p.Monto AS NVARCHAR)
        ELSE 'Error de Configuración'
    END AS Descuento_Ofrecido,
    CASE 
        WHEN pa.id_producto     IS NOT NULL 
            THEN 'Producto: '     + prod.Nombre
        WHEN pa.id_categoria    IS NOT NULL 
            THEN 'Categoría: '    + cat.Nombre
        WHEN pa.id_subcategoria IS NOT NULL 
            THEN 'Subcategoría: ' + subcat.Nombre
        ELSE 'Alcance Huérfano'
    END AS Aplica_A,
    pa.Monto_minimo_compra,
    p.Fecha_inicio,
    p.Fecha_fin,
    CASE 
        WHEN CAST(GETDATE() AS DATE) > p.Fecha_fin    THEN 'Expirada'
        WHEN CAST(GETDATE() AS DATE) < p.Fecha_inicio THEN 'Programada'
        ELSE 'Activa'
    END AS Estado_Actual
FROM Marketing.Promocion p
INNER JOIN Marketing.Promocion_Aplicacion pa 
    ON p.id_promocion      = pa.id_promocion
LEFT JOIN  Producto.Producto prod            
    ON pa.id_producto      = prod.id_producto
LEFT JOIN  Producto.Categoria cat            
    ON pa.id_categoria     = cat.id_categoria
LEFT JOIN  Producto.Subcategoria subcat      
    ON pa.id_subcategoria  = subcat.id_subcategoria;
GO

CREATE VIEW Marketing.vw_Validacion_Precios_Oferta AS
SELECT 
    prod.id_producto,
    prod.Nombre AS Producto,
    prod.Precio_venta AS Precio_Regular,
    ISNULL(motor.Descuento_Unitario, 0) AS Descuento_Aplicado,
    (prod.Precio_venta - ISNULL(motor.Descuento_Unitario, 0)) AS Precio_Final_Oferta,
    ISNULL(prom.Nombre, 'Sin Oferta') AS Promocion_Vigente
FROM Producto.Producto prod
OUTER APPLY Marketing.fn_Calcular_Descuento_Producto(
    prod.id_producto, prod.Precio_venta) motor
LEFT JOIN Marketing.Promocion prom 
    ON motor.id_promocion = prom.id_promocion
WHERE motor.id_promocion IS NOT NULL;
GO

-- -------------------------------------
-- SCHEMA: Configuracion (SOLO CENTRAL)
-- -------------------------------------

CREATE VIEW Configuracion.vw_Estado_Red AS
SELECT 
    s.id_sede,
    s.Nombre AS Sede,
    s.IP_Servidor,
    s.Activa,
    rc.Tabla_nombre,
    rc.Ultima_sync,
    rc.Registros_sync,
    rc.Estado AS Estado_Replica,
    rc.Detalle_error
FROM Configuracion.Sede s
LEFT JOIN Configuracion.Replica_Control rc 
    ON s.id_sede = rc.id_sede
WHERE s.Es_Central = 0;
GO
