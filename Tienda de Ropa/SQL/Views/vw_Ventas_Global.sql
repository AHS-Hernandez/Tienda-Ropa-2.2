USE TiendaRopa;
GO

-- ================================================================
-- Ventas.vw_Ventas_Global
-- ================================================================
-- Historial completo de ventas de Central + Sede via Linked Server.
-- No filtra por fecha (a diferencia de vw_Ventas_Hoy_Global).
-- Útil para reportes, análisis de desempeño y auditorías.
-- ================================================================

CREATE OR ALTER VIEW Ventas.vw_Ventas_Global AS

    SELECT
        'Central'                               AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        vc.Estado,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        c.Nit_ci_facturacion                    AS Cliente_NIT,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
        vc.Metodo_pago,
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
    INNER JOIN Persona.Persona pu
        ON u.id_persona   = pu.id_persona
    WHERE vc.Estado <> 'Borrador'

UNION ALL

    SELECT
        'Sede'                                  AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        vc.Estado,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        c.Nit_ci_facturacion                    AS Cliente_NIT,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
        vc.Metodo_pago,
        vc.Total_bruto,
        vc.Total_descuento,
        vc.Total_neto
    FROM SEDE.TiendaRopa.Ventas.Venta_Cabecera vc
    INNER JOIN SEDE.TiendaRopa.Persona.Cliente c
        ON vc.id_cliente  = c.id_cliente
    INNER JOIN SEDE.TiendaRopa.Persona.Persona pp
        ON c.id_persona   = pp.id_persona
    INNER JOIN SEDE.TiendaRopa.Seguridad.Usuario u
        ON vc.id_usuario  = u.id_usuario
    INNER JOIN SEDE.TiendaRopa.Persona.Persona pu
        ON u.id_persona   = pu.id_persona
    WHERE vc.Estado <> 'Borrador';
GO


-- ================================================================
-- Ventas.vw_Ventas_Detalle_Global
-- ================================================================
-- Detalle línea a línea de todas las ventas (Central + Sede).
-- Cada fila es un producto vendido con su contexto de cabecera.
-- Útil para análisis de productos más vendidos, márgenes, etc.
-- ================================================================

CREATE OR ALTER VIEW Ventas.vw_Ventas_Detalle_Global AS

    SELECT
        'Central'                               AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        vc.Estado,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
        vc.Metodo_pago,
        vd.id_detalle,
        vd.id_producto,
        vd.Nombre                               AS Producto,
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
        ON vc.id_venta    = vd.id_venta
    INNER JOIN Persona.Cliente c
        ON vc.id_cliente  = c.id_cliente
    INNER JOIN Persona.Persona pp
        ON c.id_persona   = pp.id_persona
    INNER JOIN Seguridad.Usuario u
        ON vc.id_usuario  = u.id_usuario
    INNER JOIN Persona.Persona pu
        ON u.id_persona   = pu.id_persona
    WHERE vc.Estado <> 'Borrador'

UNION ALL

    SELECT
        'Sede'                                  AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        vc.Estado,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
        vc.Metodo_pago,
        vd.id_detalle,
        vd.id_producto,
        vd.Nombre                               AS Producto,
        vd.Color,
        vd.Talla,
        vd.Cantidad,
        vd.Precio_unitario,
        vd.Subtotal,
        vc.Total_bruto,
        vc.Total_descuento,
        vc.Total_neto
    FROM SEDE.TiendaRopa.Ventas.Venta_Cabecera vc
    INNER JOIN SEDE.TiendaRopa.Ventas.Venta_Detalle vd
        ON vc.id_venta    = vd.id_venta
    INNER JOIN SEDE.TiendaRopa.Persona.Cliente c
        ON vc.id_cliente  = c.id_cliente
    INNER JOIN SEDE.TiendaRopa.Persona.Persona pp
        ON c.id_persona   = pp.id_persona
    INNER JOIN SEDE.TiendaRopa.Seguridad.Usuario u
        ON vc.id_usuario  = u.id_usuario
    INNER JOIN SEDE.TiendaRopa.Persona.Persona pu
        ON u.id_persona   = pu.id_persona
    WHERE vc.Estado <> 'Borrador';
GO
