-- ================================================================
-- vw_Stock_Sede_TiempoReal
-- ================================================================
-- Por qué Linked Server:
--   El stock cambia con cada venta y cada ajuste.
--   Ver stock de hace 1 hora no sirve para tomar decisiones.
--   El dueño necesita saber ahora mismo si hay unidades
--   disponibles en cada sede.
-- ================================================================

CREATE OR ALTER VIEW Inventario.vw_Stock_Sede_TiempoReal AS

    SELECT
        s.Nombre                AS Sede,
        s.id_sede,
        p.id_producto,
        p.Nombre                AS Producto,
        p.Marca,
        p.Talla,
        p.Color,
        sa.Cantidad             AS Cantidad_Disponible,
        CASE
            WHEN sa.Cantidad = 0   THEN 'Agotado'
            WHEN sa.Cantidad <= 5  THEN 'Critico'
            WHEN sa.Cantidad <= 10 THEN 'Bajo'
            ELSE                       'Optimo'
        END                     AS Nivel_Stock
    FROM Inventario.Stock_Actual sa
    INNER JOIN Producto.Producto p
        ON sa.id_producto = p.id_producto
    INNER JOIN Configuracion.Sede s
        ON sa.id_sede     = s.id_sede
    WHERE s.Es_Central = 1

UNION ALL

    SELECT
        'Sede'                  AS Sede,
        sa.id_sede,
        p.id_producto,
        p.Nombre                AS Producto,
        p.Marca,
        p.Talla,
        p.Color,
        sa.Cantidad             AS Cantidad_Disponible,
        CASE
            WHEN sa.Cantidad = 0   THEN 'Agotado'
            WHEN sa.Cantidad <= 5  THEN 'Critico'
            WHEN sa.Cantidad <= 10 THEN 'Bajo'
            ELSE                       'Optimo'
        END                     AS Nivel_Stock
    FROM SEDE.TiendaRopa.Inventario.Stock_Actual sa
    INNER JOIN SEDE.TiendaRopa.Producto.Producto p
        ON sa.id_producto = p.id_producto;
GO


-- ================================================================
-- Ventas.vw_Ventas_Hoy_Global
-- ================================================================
-- Por qué Linked Server:
--   El cierre de caja del dueño necesita ver LO DE HOY
--   de ambas tiendas en una sola pantalla.
--   No tiene sentido ver ventas de ayer sincronizadas
--   cuando hay ventas activas ahora mismo en Sede.
-- ================================================================

CREATE OR ALTER VIEW Ventas.vw_Ventas_Hoy_Global AS

    SELECT
        'Central'                               AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        c.Nit_ci_facturacion                    AS Cliente_NIT,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
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
    INNER JOIN Persona.Persona pu
        ON u.id_persona   = pu.id_persona
    WHERE CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)

UNION ALL

    SELECT
        'Sede'                                  AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        CONCAT(pp.Nombre, ' ', pp.Apellido)     AS Cliente_Nombre,
        c.Nit_ci_facturacion                    AS Cliente_NIT,
        CONCAT(pu.Nombre, ' ', pu.Apellido)     AS Cajero_Nombre,
        vc.Metodo_pago,
        vc.Estado,
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
    WHERE CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE);
GO


-- ================================================================
-- vw_Empleados_Global_TiempoReal
-- ================================================================
-- Por qué Linked Server:
--   Si el admin de Sede contrata un empleado hoy,
--   el dueño en Central debe verlo inmediatamente
--   sin esperar ninguna sincronización.
--   También necesario para nómina y control de personal.
-- ================================================================

CREATE OR ALTER VIEW Persona.vw_Empleados_Global_TiempoReal AS

    SELECT
        'Central'                               AS Sede,
        p.id_sede,
        e.id_empleado,
        CONCAT(p.Nombre, ' ', p.Apellido)       AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        e.Fecha_contratacion,
        e.Salario_base
    FROM Persona.Empleado e
    INNER JOIN Persona.Persona p
        ON e.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s
        ON p.id_sede    = s.id_sede
    WHERE s.Es_Central = 1

UNION ALL

    SELECT
        'Sede'                                  AS Sede,
        p.id_sede,
        e.id_empleado,
        CONCAT(p.Nombre, ' ', p.Apellido)       AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        e.Fecha_contratacion,
        e.Salario_base
    FROM SEDE.TiendaRopa.Persona.Empleado e
    INNER JOIN SEDE.TiendaRopa.Persona.Persona p
        ON e.id_persona = p.id_persona;
GO


-- ================================================================
-- vw_Clientes_Global_TiempoReal
-- ================================================================
-- Por qué Linked Server:
--   Caso real de negocio: un cliente se registra en Sede
--   por la mañana y viene a Central por la tarde.
--   El vendedor de Central debe poder encontrarlo
--   para no duplicar su registro ni pedirle datos de nuevo.
--   Sin tiempo real esto no es posible.       
-- ================================================================

CREATE OR ALTER VIEW Persona.vw_Clientes_Global_TiempoReal AS
    SELECT
        'Central'                               AS Sede,
        p.id_sede,
        c.id_cliente,
        CONCAT(p.Nombre, ' ', p.Apellido)       AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        c.Nit_ci_facturacion
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p
        ON c.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s
        ON p.id_sede    = s.id_sede
    WHERE s.Es_Central = 1

UNION ALL

    -- Fragmento de SEDE (via Linked Server, tiempo real)
    SELECT
        'Sede'                                  AS Sede,
        p.id_sede,
        c.id_cliente,
        CONCAT(p.Nombre, ' ', p.Apellido)       AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        c.Nit_ci_facturacion
    FROM SEDE.TiendaRopa.Persona.Cliente c
    INNER JOIN SEDE.TiendaRopa.Persona.Persona p
        ON c.id_persona = p.id_persona;
GO
