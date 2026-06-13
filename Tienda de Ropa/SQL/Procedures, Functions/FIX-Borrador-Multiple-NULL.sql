-- ================================================================
-- FIX-Borrador-Multiple-NULL.sql
--
-- PROBLEMA:
--   "Violation of UNIQUE KEY constraint 'UQ__Venta_Ca__...'.
--    Cannot insert duplicate key ... The duplicate key value is (<NULL>)"
--   al agregar productos al carrito.
--
-- CAUSA:
--   La constraint UNIQUE de SQL Server sobre Nro_factura solo permite
--   UN único NULL en toda la tabla. Como los borradores no tienen
--   factura todavía (Nro_factura = NULL), a partir del segundo borrador
--   (de cualquier cliente) la inserción falla.
--
-- SOLUCION:
--   1. Reemplazar la constraint por un INDICE FILTRADO único que solo
--      aplica cuando Nro_factura IS NOT NULL  -> permite N borradores.
--   2. Recrear con SET QUOTED_IDENTIFIER ON todos los SP/triggers que
--      escriben en Venta_Cabecera. Los índices filtrados EXIGEN
--      QUOTED_IDENTIFIER ON en cada INSERT/UPDATE, y SQL Server graba
--      ese setting DENTRO de cada SP al momento de crearlo. Si el SP se
--      creó con QUOTED_IDENTIFIER OFF, falla con:
--        "UPDATE failed because the following SET options have incorrect
--         settings: 'QUOTED_IDENTIFIER'"
--
-- Ejecutar este script COMPLETO una sola vez en SSMS.
-- ================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ----------------------------------------------------------------
-- 1) Constraint UNIQUE  ->  Indice filtrado
-- ----------------------------------------------------------------
DECLARE @uq SYSNAME;
SELECT @uq = kc.name
FROM sys.key_constraints kc
WHERE kc.parent_object_id = OBJECT_ID(N'Ventas.Venta_Cabecera')
  AND kc.type = 'UQ'
  AND EXISTS (
        SELECT 1
        FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id  = kc.unique_index_id
          AND c.name = 'Nro_factura'
  );

IF @uq IS NOT NULL
    EXEC('ALTER TABLE Ventas.Venta_Cabecera DROP CONSTRAINT ' + @uq);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UIX_VentaCabecera_NroFactura')
    CREATE UNIQUE NONCLUSTERED INDEX UIX_VentaCabecera_NroFactura
        ON Ventas.Venta_Cabecera (Nro_factura)
        WHERE Nro_factura IS NOT NULL;
GO

-- ----------------------------------------------------------------
-- 2) Recrear SP/triggers con QUOTED_IDENTIFIER ON
--    (el SET de arriba aplica a todos los batches siguientes)
-- ----------------------------------------------------------------

CREATE OR ALTER PROCEDURE Ventas.sp_Crear_Venta_Borrador
    @id_cliente         INT,
    @id_usuario         INT,
    @id_sede            INT,
    @id_venta_generado  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Persona.Cliente WHERE id_cliente = @id_cliente)
            RAISERROR('El cliente especificado no existe.', 16, 1);

        IF NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_usuario = @id_usuario AND Estado = 1)
            RAISERROR('El usuario especificado no existe o está inactivo.', 16, 1);

        INSERT INTO Ventas.Venta_Cabecera
            (id_sede, id_cliente, id_usuario, Fecha_emision, Estado)
        VALUES
            (@id_sede, @id_cliente, @id_usuario, GETDATE(), 'Borrador');

        SET @id_venta_generado = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Agregar_Producto_Venta
    @id_venta   INT,
    @id_producto INT,
    @cantidad    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @estado               NVARCHAR(50);
        DECLARE @stock_actual         INT;
        DECLARE @precio_original      DECIMAL(10,2);
        DECLARE @nombre               NVARCHAR(100);
        DECLARE @color                NVARCHAR(50);
        DECLARE @talla                NVARCHAR(50);
        DECLARE @id_promo_aplicada    INT;
        DECLARE @descuento_unitario   DECIMAL(10,2);
        DECLARE @precio_final         DECIMAL(10,2);
        DECLARE @subtotal_neto        DECIMAL(10,2);

        IF @cantidad <= 0
            RAISERROR('La cantidad debe ser mayor a cero.', 16, 1);

        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC WITH (UPDLOCK)
        WHERE VC.id_venta = @id_venta;

        IF @estado IS NULL
            RAISERROR('La venta especificada no existe.', 16, 1);

        IF @estado <> 'Borrador'
            RAISERROR('Solo se pueden agregar productos a ventas en estado Borrador.', 16, 1);

        SELECT @stock_actual = SA.Cantidad
        FROM Inventario.Stock_Actual SA
        WHERE SA.id_producto = @id_producto;

        IF ISNULL(@stock_actual, 0) < @cantidad
            RAISERROR('Stock insuficiente para este producto.', 16, 1);

        SELECT
            @precio_original = P.Precio_venta,
            @nombre          = P.Nombre,
            @color           = P.Color,
            @talla           = P.Talla
        FROM Producto.Producto P
        WHERE P.id_producto = @id_producto;

        IF @precio_original IS NULL
            RAISERROR('El producto especificado no existe.', 16, 1);

        SELECT
            @id_promo_aplicada  = id_promocion,
            @descuento_unitario = Descuento_Unitario
        FROM Marketing.fn_Calcular_Descuento_Producto(@id_producto, @precio_original);

        SET @descuento_unitario = ISNULL(@descuento_unitario, 0);
        SET @precio_final       = @precio_original - @descuento_unitario;
        SET @subtotal_neto      = @precio_final * @cantidad;

        INSERT INTO Ventas.Venta_Detalle (
            id_venta, id_producto, id_promocion_aplicada,
            Nombre, Color, Talla,
            Cantidad, Precio_unitario, Subtotal)
        VALUES (
            @id_venta, @id_producto, @id_promo_aplicada,
            @nombre, @color, @talla,
            @cantidad, @precio_final, @subtotal_neto);

        UPDATE Ventas.Venta_Cabecera
        SET Total_bruto     = Total_bruto     + (@precio_original * @cantidad),
            Total_descuento = Total_descuento + (@descuento_unitario * @cantidad),
            Total_neto      = Total_neto      + @subtotal_neto
        WHERE id_venta = @id_venta;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Eliminar_Producto_Venta
    @id_detalle INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @id_venta           INT;
        DECLARE @estado             NVARCHAR(50);
        DECLARE @precio_unitario    DECIMAL(10,2);
        DECLARE @cantidad           INT;
        DECLARE @subtotal           DECIMAL(10,2);
        DECLARE @precio_original    DECIMAL(10,2);
        DECLARE @descuento_linea    DECIMAL(10,2);

        SELECT
            @id_venta        = VD.id_venta,
            @precio_unitario = VD.Precio_unitario,
            @cantidad        = VD.Cantidad,
            @subtotal        = VD.Subtotal
        FROM Ventas.Venta_Detalle VD
        WHERE VD.id_detalle = @id_detalle;

        IF @id_venta IS NULL
            RAISERROR('El detalle de venta especificado no existe.', 16, 1);

        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC WITH (UPDLOCK)
        WHERE VC.id_venta = @id_venta;

        IF @estado <> 'Borrador'
            RAISERROR('Solo se pueden eliminar productos de ventas en estado Borrador.', 16, 1);

        SELECT @precio_original = P.Precio_venta
        FROM Ventas.Venta_Detalle VD
        INNER JOIN Producto.Producto P ON P.id_producto = VD.id_producto
        WHERE VD.id_detalle = @id_detalle;

        SET @descuento_linea = (@precio_original - @precio_unitario) * @cantidad;

        DELETE FROM Ventas.Venta_Detalle
        WHERE id_detalle = @id_detalle;

        UPDATE Ventas.Venta_Cabecera
        SET Total_bruto     = Total_bruto     - (@precio_original * @cantidad),
            Total_descuento = Total_descuento - @descuento_linea,
            Total_neto      = Total_neto      - @subtotal
        WHERE id_venta = @id_venta;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Procesar_Cobro_Venta
    @id_venta    INT,
    @metodo_pago NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @estado      NVARCHAR(50);
        DECLARE @nro_factura NVARCHAR(50);

        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC
        WHERE VC.id_venta = @id_venta;

        IF @estado IS NULL
            RAISERROR('La venta especificada no existe.', 16, 1);

        IF @estado <> 'Borrador'
            RAISERROR('La venta ya fue cobrada o no está disponible.', 16, 1);

        SET @nro_factura = 'FAC-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-' + CAST(@id_venta AS NVARCHAR);

        UPDATE Ventas.Venta_Cabecera
        SET Estado      = 'Completada',
            Nro_factura = @nro_factura,
            Metodo_pago = @metodo_pago
        WHERE id_venta = @id_venta;

        INSERT INTO Inventario.Kardex
            (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
        SELECT
            VD.id_producto,
            VC.id_sede,
            (VD.Cantidad * -1),
            GETDATE(), @id_venta, NULL, NULL
        FROM Ventas.Venta_Detalle VD
        INNER JOIN Ventas.Venta_Cabecera VC ON VC.id_venta = VD.id_venta
        WHERE VD.id_venta = @id_venta;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Anular_Venta_Borrador
    @id_venta INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @estado NVARCHAR(50);

        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC WITH (UPDLOCK)
        WHERE VC.id_venta = @id_venta;

        IF @estado IS NULL
            RAISERROR('La venta especificada no existe.', 16, 1);

        IF @estado <> 'Borrador'
            RAISERROR('Solo se pueden anular ventas en estado Borrador. Para ventas Completadas o Entregadas contacte al administrador.', 16, 1);

        DELETE FROM Ventas.Venta_Detalle
        WHERE id_venta = @id_venta;

        DELETE FROM Ventas.Venta_Cabecera
        WHERE id_venta = @id_venta;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Marcar_Venta_Entregada
    @p_id_venta INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE Ventas.Venta_Cabecera
        SET Estado = 'Entregada'
        WHERE id_venta = @p_id_venta AND Estado = 'Completada';

        IF @@ROWCOUNT = 0
            RAISERROR('La venta no existe o aún no ha sido pagada (Completada).', 16, 1);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER Ventas.trg_Venta_Solo_Sede_Propia
ON Ventas.Venta_Cabecera
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_sede_local INT;

    SELECT @id_sede_local = id_sede
    FROM Configuracion.Sede
    WHERE Es_Central = 1;

    IF @id_sede_local IS NULL
        SELECT TOP 1 @id_sede_local = id_sede
        FROM Configuracion.Sede
        WHERE Activa = 1
        ORDER BY id_sede;

    IF @id_sede_local IS NULL
        RETURN;

    IF EXISTS (
        SELECT 1 FROM inserted
        WHERE id_sede <> @id_sede_local
    )
    BEGIN
        RAISERROR('No puedes registrar ventas de otra sede en este servidor.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
