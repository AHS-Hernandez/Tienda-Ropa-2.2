-- ----------------------------------------------------------------
-- sp_Inactivar_Usuario
-- Inactiva un usuario del sistema
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Inactivar_Usuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        UPDATE Seguridad.Usuario
        SET Estado = 0
        WHERE id_usuario = @id_usuario;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el usuario especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;