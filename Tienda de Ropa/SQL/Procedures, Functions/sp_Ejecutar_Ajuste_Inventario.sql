-- ----------------------------------------------------------------
-- sp_Ejecutar_Ajuste_Inventario
-- Registra ajuste físico y mueve el Kardex
-- ----------------------------------------------------------------
CREATE PROCEDURE Inventario.sp_Ejecutar_Ajuste_Inventario
    @id_usuario  INT,
    @id_producto INT,
    @tipo_ajuste NVARCHAR(50),
    @motivo      NVARCHAR(255),
    @cantidad    INT,
    @id_sede     INT
AS
BEGIN
    SET NOCOUNT ON;
 
    IF @cantidad = 0
        RAISERROR('La cantidad del ajuste no puede ser cero.', 16, 1);
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        DECLARE @id_ajuste INT;
 
        INSERT INTO Inventario.Ajuste_Inventario
            (id_usuario, id_sede, Tipo_ajuste, Motivo, Fecha)
        VALUES
            (@id_usuario, @id_sede, @tipo_ajuste, @motivo, GETDATE());
 
        SET @id_ajuste = SCOPE_IDENTITY();
 
        INSERT INTO Inventario.Kardex
            (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
        VALUES
            (@id_producto, @id_sede, @cantidad, GETDATE(), NULL, NULL, @id_ajuste);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage  NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT            = ERROR_SEVERITY();
        DECLARE @ErrorState    INT            = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;