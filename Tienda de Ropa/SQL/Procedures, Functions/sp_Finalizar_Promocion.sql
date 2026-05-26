-- ----------------------------------------------------------------
-- sp_Finalizar_Promocion
-- Cierra una campaña activa poniendo Fecha_fin = hoy
-- ----------------------------------------------------------------
CREATE PROCEDURE Marketing.sp_Finalizar_Promocion
    @id_promocion INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        DECLARE @fecha_inicio    DATE;
        DECLARE @nueva_fecha_fin DATE = CAST(GETDATE() AS DATE);
 
        SELECT @fecha_inicio = Fecha_inicio
        FROM Marketing.Promocion
        WHERE id_promocion = @id_promocion;
 
        IF @fecha_inicio IS NULL
            RAISERROR('La promoción no existe.', 16, 1);
 
        -- Si hoy es antes del inicio, la cerramos en la misma fecha de inicio
        IF @nueva_fecha_fin < @fecha_inicio
            SET @nueva_fecha_fin = @fecha_inicio;
 
        UPDATE Marketing.Promocion
        SET Fecha_fin = @nueva_fecha_fin
        WHERE id_promocion = @id_promocion;
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;