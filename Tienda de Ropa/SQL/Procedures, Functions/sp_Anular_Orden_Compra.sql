-- ----------------------------------------------------------------
-- sp_Anular_Orden_Compra
-- Anula la orden. Si ya estaba Recibida, revierte el stock en Kardex.
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Anular_Orden_Compra
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
 
        IF @estado_actual = 'Anulada'
            RAISERROR('La orden de compra ya se encuentra anulada.', 16, 1);
 
        IF @estado_actual = 'Recibida'
        BEGIN
            INSERT INTO Inventario.Kardex
                (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
            SELECT
                DC.id_producto,
                @id_sede_central,
                (DC.Cantidad * -1),
                GETDATE(), NULL, @id_compra, NULL
            FROM Compras.Detalle_Compra DC
            WHERE DC.id_compra = @id_compra;
        END
 
        UPDATE Compras.Orden_Compra
        SET Estado = 'Anulada'
        WHERE id_compra = @id_compra;
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;