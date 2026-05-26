-- ----------------------------------------------------------------
-- sp_Procesar_Cobro_Venta
-- Cierra la venta, genera factura y descuenta Kardex.
-- SERIALIZABLE para evitar ventas fantasma en concurrencia.
-- ----------------------------------------------------------------
CREATE PROCEDURE Ventas.sp_Procesar_Cobro_Venta
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