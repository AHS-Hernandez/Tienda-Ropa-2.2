-- ----------------------------------------------------------------
-- sp_Marcar_Venta_Entregada
-- Cambia estado a Entregada solo si ya está Completada (pagada)
-- ----------------------------------------------------------------
CREATE PROCEDURE Ventas.sp_Marcar_Venta_Entregada
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