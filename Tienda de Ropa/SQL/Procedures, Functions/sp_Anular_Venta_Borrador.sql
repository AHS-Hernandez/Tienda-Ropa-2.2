-- ================================================================
-- sp_Anular_Venta_Borrador
-- Elimina completamente una venta que aún está en Borrador.
-- No toca el Kardex porque el Borrador no ha descontado stock
-- ================================================================
CREATE PROCEDURE Ventas.sp_Anular_Venta_Borrador
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
 
        -- Primero los detalles (FK), luego la cabecera
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