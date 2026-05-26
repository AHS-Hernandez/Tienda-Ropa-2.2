-- ----------------------------------------------------------------
-- sp_Inactivar_Proveedor
-- Elimina proveedor solo si no tiene historial de compras
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Inactivar_Proveedor
    @id_proveedor INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF EXISTS (
            SELECT 1 FROM Compras.Orden_Compra
            WHERE id_proveedor = @id_proveedor
        )
            RAISERROR('No se puede eliminar el proveedor porque tiene historial de compras.', 16, 1);
 
        DELETE FROM Compras.Proveedor
        WHERE id_proveedor = @id_proveedor;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el proveedor especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;