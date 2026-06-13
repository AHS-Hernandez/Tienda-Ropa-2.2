-- ================================================================
-- Parches para integración frontend ERP
-- Ejecutar en TiendaRopa (Central). Las vistas Linked Server
-- deben existir con los mismos nombres (Views Linked Server.sql).
-- ================================================================

USE TiendaRopa;
GO

-- ----------------------------------------------------------------
-- Ventas.vw_Factura_Detallada — incluye id_detalle y Estado
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- Líneas de borrador para carrito / POS (sin tabla directa en app)
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- Dashboards (sin Linked Server)
-- ----------------------------------------------------------------
CREATE OR ALTER VIEW Ventas.vw_Resumen_Ventas_Hoy_Sede AS
SELECT
    vc.id_sede,
    COUNT(*) AS transacciones,
    SUM(vc.Total_neto) AS total_neto,
    AVG(vc.Total_neto) AS ticket_promedio,
    COUNT(DISTINCT vc.id_cliente) AS clientes_unicos
FROM Ventas.Venta_Cabecera vc
WHERE CAST(vc.Fecha_emision AS DATE) = CAST(GETDATE() AS DATE)
  AND vc.Estado IN ('Completada', 'Entregada')
GROUP BY vc.id_sede;
GO

CREATE OR ALTER VIEW Ventas.vw_Ventas_Ultimos_7_Dias AS
SELECT
    CAST(vc.Fecha_emision AS DATE) AS dia,
    SUM(vc.Total_neto) AS total_neto,
    COUNT(*) AS transacciones
FROM Ventas.Venta_Cabecera vc
WHERE vc.Fecha_emision >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
  AND vc.Estado IN ('Completada', 'Entregada')
GROUP BY CAST(vc.Fecha_emision AS DATE);
GO

CREATE OR ALTER VIEW Ventas.vw_Ventas_Por_Categoria_7Dias AS
SELECT
    c.Nombre AS categoria,
    SUM(vd.Subtotal) AS total,
    SUM(vd.Cantidad) AS unidades
FROM Ventas.Venta_Detalle vd
INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
INNER JOIN Producto.Producto p ON p.id_producto = vd.id_producto
INNER JOIN Producto.Subcategoria sc ON sc.id_subcategoria = p.id_subcategoria
INNER JOIN Producto.Categoria c ON c.id_categoria = sc.id_categoria
WHERE vc.Fecha_emision >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
  AND vc.Estado IN ('Completada', 'Entregada')
GROUP BY c.Nombre;
GO

CREATE OR ALTER VIEW Ventas.vw_Top_Productos_7Dias AS
SELECT TOP 15
    vd.Nombre AS producto,
    SUM(vd.Cantidad) AS unidades,
    SUM(vd.Subtotal) AS total
FROM Ventas.Venta_Detalle vd
INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
WHERE vc.Fecha_emision >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
  AND vc.Estado IN ('Completada', 'Entregada')
GROUP BY vd.Nombre
ORDER BY total DESC;
GO

-- ----------------------------------------------------------------
-- Marketing — editar campaña
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE Marketing.sp_Modificar_Campana
    @id_promocion INT,
    @nombre       NVARCHAR(100),
    @porcentaje   DECIMAL(5,2) = NULL,
    @monto        DECIMAL(10,2) = NULL,
    @fecha_inicio DATE,
    @fecha_fin    DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @porcentaje IS NOT NULL AND @monto IS NOT NULL
            RAISERROR('No puede tener porcentaje y monto a la vez.', 16, 1);
        IF @porcentaje IS NULL AND @monto IS NULL
            RAISERROR('Debe indicar porcentaje o monto.', 16, 1);
        IF @fecha_inicio > @fecha_fin
            RAISERROR('Rango de fechas inválido.', 16, 1);

        UPDATE Marketing.Promocion
        SET
            Nombre       = @nombre,
            Porcentaje   = @porcentaje,
            Monto        = @monto,
            Fecha_inicio = @fecha_inicio,
            Fecha_fin    = @fecha_fin
        WHERE id_promocion = @id_promocion;

        IF @@ROWCOUNT = 0
            RAISERROR('Promoción no encontrada.', 16, 1);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

GRANT EXECUTE ON Marketing.sp_Modificar_Campana TO usr_nivel4;
GO

-- ----------------------------------------------------------------
-- Usuarios de prueba adicionales (vendedor + cliente)
-- Idempotente: reutiliza Persona si CI/Email ya existen (re-ejecución segura)
-- ----------------------------------------------------------------
DECLARE @id_actor_patch INT = (
    SELECT TOP 1 id_usuario FROM Seguridad.Usuario ORDER BY id_usuario
);
DECLARE @pid_v INT;
DECLARE @p_cliente_web INT;

IF @id_actor_patch IS NOT NULL
    EXEC sys.sp_set_session_context @key = N'id_usuario', @value = @id_actor_patch;

IF @id_actor_patch IS NULL
    PRINT 'AVISO: No hay usuarios en Seguridad.Usuario. Ejecute Datos prueba.sql antes del bloque de vendedor/cliente.';
ELSE
BEGIN
    -- Vendedor POS
    IF NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE Username = 'vendedor@test.com')
    BEGIN
        SELECT @pid_v = id_persona
        FROM Persona.Persona
        WHERE Email = 'vendedor@test.com' OR CI = '5566778';

        IF @pid_v IS NULL
        BEGIN
            INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
            VALUES (1, 'Pedro', 'Vendedor POS', '5566778', '75566778', 'vendedor@test.com', 'La Paz');
            SET @pid_v = SCOPE_IDENTITY();
        END

        IF NOT EXISTS (SELECT 1 FROM Persona.Empleado WHERE id_persona = @pid_v)
            INSERT INTO Persona.Empleado (id_persona, Fecha_contratacion, Salario_base)
            VALUES (@pid_v, '2024-06-01', 3500);

        INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
        VALUES (@pid_v, 1, 'vendedor@test.com', 'Abc123!', 2, 1);

        PRINT 'Usuario vendedor@test.com listo.';
    END
    ELSE
        PRINT 'vendedor@test.com ya existe — omitido.';

    -- Credencial web para cliente de Datos prueba (misma persona, otro login si aplica)
    SELECT @p_cliente_web = id_persona
    FROM Persona.Persona
    WHERE Email = 'cliente@test.com';

    IF @p_cliente_web IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE Username = 'cliente@test.com')
    BEGIN
        INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
        VALUES (@p_cliente_web, 1, 'cliente@test.com', 'Abc123!', 1, 1);

        PRINT 'Usuario cliente@test.com listo.';
    END
    ELSE IF @p_cliente_web IS NULL
        PRINT 'AVISO: No hay Persona con Email cliente@test.com. Ejecute Datos prueba.sql.';
    ELSE
        PRINT 'cliente@test.com ya existe — omitido.';
END
GO

-- Registro web desde la app (cuenta login_nivel4)
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'login_nivel4')
    GRANT EXECUTE ON Seguridad.sp_Registro_Maestro_Cliente TO login_nivel4;
GO

-- Actualizar trigger bitácora (evita FK cuando id_usuario=1 no existe)
CREATE OR ALTER TRIGGER Persona.trg_Bitacora_Persona
ON Persona.Persona
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_usuario INT = TRY_CAST(SESSION_CONTEXT(N'id_usuario') AS INT);

    IF @id_usuario IS NULL
       OR NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_usuario = @id_usuario)
        SELECT @id_usuario = MIN(id_usuario) FROM Seguridad.Usuario;

    IF @id_usuario IS NULL
        RETURN;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        i.id_sede,
        'INSERT',
        'Persona.Persona',
        NULL,
        CONCAT('ID:', i.id_persona, '|Nombre:', i.Nombre, '|Apellido:', i.Apellido)
    FROM inserted i
    LEFT JOIN deleted d ON i.id_persona = d.id_persona
    WHERE d.id_persona IS NULL;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        d.id_sede,
        'DELETE',
        'Persona.Persona',
        CONCAT('ID:', d.id_persona, '|Nombre:', d.Nombre, '|Apellido:', d.Apellido),
        NULL
    FROM deleted d
    LEFT JOIN inserted i ON d.id_persona = i.id_persona
    WHERE i.id_persona IS NULL;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        i.id_sede,
        'UPDATE',
        'Persona.Persona',
        CONCAT('ID:', d.id_persona, '|Nombre:', d.Nombre, '|Apellido:', d.Apellido),
        CONCAT('ID:', i.id_persona, '|Nombre:', i.Nombre, '|Apellido:', i.Apellido)
    FROM inserted i
    INNER JOIN deleted d ON i.id_persona = d.id_persona;
END;
GO
