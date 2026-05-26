-- ----------------------------------------------------------------
-- sp_Recuperacion_Perfil_Web
-- Actualiza contraseña mediante recuperación
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Recuperacion_Perfil_Web
    @Username NVARCHAR(50),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);
 
        UPDATE Seguridad.Usuario
        SET Password = @Password
        WHERE Username = @Username;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el usuario especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;