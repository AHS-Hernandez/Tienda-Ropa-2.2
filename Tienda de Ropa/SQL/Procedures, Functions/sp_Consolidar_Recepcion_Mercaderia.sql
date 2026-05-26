-- ----------------------------------------------------------------
-- sp_Consolidar_Recepcion_Mercaderia
-- Pasa la orden a Recibida e inyecta mercadería al Kardex de Central
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Consolidar_Recepcion_Mercaderia
    @id_compra INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        DECLARE @estado_actual   NVARCHAR(50);
        DECLARE @id_sede_central INT;
 
        SELECT @id_sede_central = id_sede
        FROM Configuracion.Sede
        WHERE Es_Central = 1;
 
        SELECT @estado_actual = OC.Estado
        FROM Compras.Orden_Compra OC WITH (UPDLOCK)
        WHERE OC.id_compra = @id_compra;
 
        IF @estado_actual IS NULL
            RAISERROR('La orden de compra no existe.', 16, 1);
        IF @estado_actual = 'Recibida'
            RAISERROR('Esta orden ya fue recibida anteriormente.', 16, 1);
        IF @estado_actual = 'Anulada'
            RAISERROR('No se puede recibir mercadería de una orden anulada.', 16, 1);
 
        UPDATE Compras.Orden_Compra
        SET Estado = 'Recibida'
        WHERE id_compra = @id_compra;
 
        INSERT INTO Inventario.Kardex
            (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
        SELECT
            DC.id_producto,
            @id_sede_central,
            DC.Cantidad,
            GETDATE(), NULL, @id_compra, NULL
        FROM Compras.Detalle_Compra DC
        WHERE DC.id_compra = @id_compra;
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;