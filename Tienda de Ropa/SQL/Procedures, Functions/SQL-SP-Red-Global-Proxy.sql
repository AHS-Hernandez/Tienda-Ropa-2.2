-- =============================================================================
-- TiendaRopa (CENTRAL) — sysadmin
-- NO usa linked server para login_nivel4: une Central (local) + Sede (OPENROWSET).
-- La app ejecuta estos SP con usr_nivel4.
-- =============================================================================
USE master;
GO

EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'Ad Hoc Distributed Queries', 1;
RECONFIGURE;
GO

USE TiendaRopa;
GO

-- Cadena sucursal (mismo login_linkedserver del linked server)
-- Server=10.224.111.77,1433;Database=TiendaRopa;UID=login_linkedserver;PWD=...

-- ── Clientes ─────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE Configuracion.sp_Red_Clientes_Global
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Nombre AS Sede,
        p.id_sede,
        c.id_cliente,
        p.Nombre + N' ' + p.Apellido AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        c.Nit_ci_facturacion
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p ON c.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s ON p.id_sede = s.id_sede
    WHERE s.Es_Central = 1

    UNION ALL

    SELECT
        Sede,
        id_sede,
        id_cliente,
        Nombre_completo,
        CI,
        Telefono,
        Email,
        Direccion,
        Nit_ci_facturacion
    FROM OPENROWSET(
        'MSOLEDBSQL',
        N'Server=10.224.111.77,1433;Database=TiendaRopa;UID=login_linkedserver;PWD=L1nk3d#S3rv3r2026!;Encrypt=Optional;TrustServerCertificate=Yes',
        N'SELECT
            ''Sede'' AS Sede,
            p.id_sede,
            c.id_cliente,
            p.Nombre + '' '' + p.Apellido AS Nombre_completo,
            p.CI,
            p.Telefono,
            p.Email,
            p.Direccion,
            c.Nit_ci_facturacion
        FROM Persona.Cliente c
        INNER JOIN Persona.Persona p ON c.id_persona = p.id_persona'
    ) AS rem (
        Sede NVARCHAR(50),
        id_sede INT,
        id_cliente INT,
        Nombre_completo NVARCHAR(201),
        CI NVARCHAR(50),
        Telefono NVARCHAR(50),
        Email NVARCHAR(100),
        Direccion NVARCHAR(MAX),
        Nit_ci_facturacion NVARCHAR(50)
    )
    ORDER BY Sede, Nombre_completo;
END;
GO

-- ── Empleados ──────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE Configuracion.sp_Red_Empleados_Global
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Nombre AS Sede,
        p.id_sede,
        e.id_empleado,
        p.Nombre + N' ' + p.Apellido AS Nombre_completo,
        p.CI,
        p.Telefono,
        p.Email,
        p.Direccion,
        e.Fecha_contratacion,
        e.Salario_base
    FROM Persona.Empleado e
    INNER JOIN Persona.Persona p ON e.id_persona = p.id_persona
    INNER JOIN Configuracion.Sede s ON p.id_sede = s.id_sede
    WHERE s.Es_Central = 1

    UNION ALL

    SELECT
        Sede, id_sede, id_empleado, Nombre_completo, CI, Telefono, Email,
        Direccion, Fecha_contratacion, Salario_base
    FROM OPENROWSET(
        'MSOLEDBSQL',
        N'Server=10.224.111.77,1433;Database=TiendaRopa;UID=login_linkedserver;PWD=L1nk3d#S3rv3r2026!;Encrypt=Optional;TrustServerCertificate=Yes',
        N'SELECT
            ''Sede'' AS Sede,
            p.id_sede,
            e.id_empleado,
            p.Nombre + '' '' + p.Apellido AS Nombre_completo,
            p.CI, p.Telefono, p.Email, p.Direccion,
            e.Fecha_contratacion, e.Salario_base
        FROM Persona.Empleado e
        INNER JOIN Persona.Persona p ON e.id_persona = p.id_persona'
    ) AS rem (
        Sede NVARCHAR(50), id_sede INT, id_empleado INT,
        Nombre_completo NVARCHAR(201), CI NVARCHAR(50), Telefono NVARCHAR(50),
        Email NVARCHAR(100), Direccion NVARCHAR(MAX),
        Fecha_contratacion DATE, Salario_base DECIMAL(18, 2)
    )
    ORDER BY Sede, Nombre_completo;
END;
GO

-- ── Stock ──────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE Configuracion.sp_Red_Stock_Sede_TiempoReal
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Nombre AS Sede,
        sa.id_sede,
        p.id_producto,
        p.Nombre AS Producto,
        p.Marca,
        p.Talla,
        p.Color,
        sa.Cantidad AS Cantidad_Disponible,
        CASE
            WHEN sa.Cantidad = 0 THEN 'Agotado'
            WHEN sa.Cantidad <= 5 THEN 'Critico'
            WHEN sa.Cantidad <= 10 THEN 'Bajo'
            ELSE 'Optimo'
        END AS Nivel_Stock
    FROM Inventario.Stock_Actual sa
    INNER JOIN Producto.Producto p ON sa.id_producto = p.id_producto
    INNER JOIN Configuracion.Sede s ON sa.id_sede = s.id_sede
    WHERE s.Es_Central = 1

    UNION ALL

    SELECT
        Sede, id_sede, id_producto, Producto, Marca, Talla, Color,
        Cantidad_Disponible, Nivel_Stock
    FROM OPENROWSET(
        'MSOLEDBSQL',
        N'Server=10.224.111.77,1433;Database=TiendaRopa;UID=login_linkedserver;PWD=L1nk3d#S3rv3r2026!;Encrypt=Optional;TrustServerCertificate=Yes',
        N'SELECT
            ''Sede'' AS Sede,
            sa.id_sede,
            p.id_producto,
            p.Nombre AS Producto,
            p.Marca, p.Talla, p.Color,
            sa.Cantidad AS Cantidad_Disponible,
            CASE
                WHEN sa.Cantidad = 0 THEN ''Agotado''
                WHEN sa.Cantidad <= 5 THEN ''Critico''
                WHEN sa.Cantidad <= 10 THEN ''Bajo''
                ELSE ''Optimo''
            END AS Nivel_Stock
        FROM Inventario.Stock_Actual sa
        INNER JOIN Producto.Producto p ON sa.id_producto = p.id_producto'
    ) AS rem (
        Sede NVARCHAR(50), id_sede INT, id_producto INT,
        Producto NVARCHAR(100), Marca NVARCHAR(100), Talla NVARCHAR(50),
        Color NVARCHAR(50), Cantidad_Disponible INT, Nivel_Stock NVARCHAR(20)
    )
    ORDER BY Sede, Producto;
END;
GO

-- ── Ventas hoy ─────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE Configuracion.sp_Red_Ventas_Hoy_Global
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Nombre AS Sede,
        vc.id_venta,
        vc.id_sede,
        vc.Nro_factura,
        vc.Fecha_emision,
        pp.Nombre + N' ' + pp.Apellido AS Cliente_Nombre,
        c.Nit_ci_facturacion AS Cliente_NIT,
        pu.Nombre + N' ' + pu.Apellido AS Cajero_Nombre,
        vc.Metodo_pago,
        vc.Estado,
        vc.Total_bruto,
        vc.Total_descuento,
        vc.Total_neto
    FROM Ventas.Venta_Cabecera vc
    INNER JOIN Persona.Cliente c ON vc.id_cliente = c.id_cliente
    INNER JOIN Persona.Persona pp ON c.id_persona = pp.id_persona
    INNER JOIN Seguridad.Usuario u ON vc.id_usuario = u.id_usuario
    INNER JOIN Persona.Persona pu ON u.id_persona = pu.id_persona
    INNER JOIN Configuracion.Sede s ON vc.id_sede = s.id_sede
    WHERE s.Es_Central = 1
      AND CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)

    UNION ALL

    SELECT
        Sede, id_venta, id_sede, Nro_factura, Fecha_emision,
        Cliente_Nombre, Cliente_NIT, Cajero_Nombre, Metodo_pago, Estado,
        Total_bruto, Total_descuento, Total_neto
    FROM OPENROWSET(
        'MSOLEDBSQL',
        N'Server=10.224.111.77,1433;Database=TiendaRopa;UID=login_linkedserver;PWD=L1nk3d#S3rv3r2026!;Encrypt=Optional;TrustServerCertificate=Yes',
        N'SELECT
            ''Sede'' AS Sede,
            vc.id_venta, vc.id_sede, vc.Nro_factura, vc.Fecha_emision,
            pp.Nombre + '' '' + pp.Apellido AS Cliente_Nombre,
            c.Nit_ci_facturacion AS Cliente_NIT,
            pu.Nombre + '' '' + pu.Apellido AS Cajero_Nombre,
            vc.Metodo_pago, vc.Estado,
            vc.Total_bruto, vc.Total_descuento, vc.Total_neto
        FROM Ventas.Venta_Cabecera vc
        INNER JOIN Persona.Cliente c ON vc.id_cliente = c.id_cliente
        INNER JOIN Persona.Persona pp ON c.id_persona = pp.id_persona
        INNER JOIN Seguridad.Usuario u ON vc.id_usuario = u.id_usuario
        INNER JOIN Persona.Persona pu ON u.id_persona = pu.id_persona
        WHERE CAST(vc.Fecha_emision AS DATE) = CAST(CAST(GETDATE() AS DATE) AS DATETIME)'
    ) AS rem (
        Sede NVARCHAR(50), id_venta INT, id_sede INT, Nro_factura NVARCHAR(50),
        Fecha_emision DATETIME, Cliente_Nombre NVARCHAR(201), Cliente_NIT NVARCHAR(50),
        Cajero_Nombre NVARCHAR(201), Metodo_pago NVARCHAR(50), Estado NVARCHAR(50),
        Total_bruto DECIMAL(18, 2), Total_descuento DECIMAL(18, 2), Total_neto DECIMAL(18, 2)
    )
    ORDER BY Fecha_emision DESC;
END;
GO

GRANT EXECUTE ON Configuracion.sp_Red_Ventas_Hoy_Global    TO usr_nivel4;
GRANT EXECUTE ON Configuracion.sp_Red_Empleados_Global      TO usr_nivel4;
GRANT EXECUTE ON Configuracion.sp_Red_Clientes_Global        TO usr_nivel4;
GRANT EXECUTE ON Configuracion.sp_Red_Stock_Sede_TiempoReal TO usr_nivel4;
GO

PRINT '=== Prueba usr_nivel4 (como la app) ===';
EXECUTE AS USER = N'usr_nivel4';

BEGIN TRY
    EXEC Configuracion.sp_Red_Clientes_Global;
    PRINT 'OK: sp_Red_Clientes_Global (Central + Sede sin mapping)';
END TRY
BEGIN CATCH
    PRINT 'FALLO: ' + ERROR_MESSAGE();
END CATCH

REVERT;
GO
