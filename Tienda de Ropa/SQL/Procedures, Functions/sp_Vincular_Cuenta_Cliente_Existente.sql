-- ----------------------------------------------------------------
-- sp_Vincular_Cuenta_Cliente_Existente
-- Crea credenciales web para persona ya registrada en tienda física
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Vincular_Cuenta_Cliente_Existente
    @Email    NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        IF @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo electrónico no es válido.', 16, 1);
 
        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);
 
        DECLARE @v_id_persona INT;
 
        SELECT @v_id_persona = id_persona
        FROM Persona.Persona
        WHERE Email = @Email;
 
        IF @v_id_persona IS NULL
            RAISERROR('No se encontró ningún cliente registrado con ese correo. Por favor regístrese como nuevo usuario.', 16, 1);
 
        IF EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_persona = @v_id_persona)
            RAISERROR('Este correo ya tiene una cuenta activa. Intente recuperar su contraseña.', 16, 1);
 
        INSERT INTO Seguridad.Usuario
            (id_persona, Username, Password, Nivel_acceso, Estado)
        VALUES
            (@v_id_persona, @Email, @Password, 1, 1);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;