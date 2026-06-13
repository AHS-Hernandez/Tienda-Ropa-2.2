-- ----------------------------------------------------------------
-- sp_Activar_Usuario_Cliente_Existente
-- Persona/Cliente ya existe (p. ej. alta en tienda) → solo credenciales web
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE Seguridad.sp_Activar_Usuario_Cliente_Existente
    @Email     NVARCHAR(100),
    @Password  NVARCHAR(255),
    @id_sede   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo electrónico no es válido.', 16, 1);

        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);

        DECLARE @id_persona INT;
        DECLARE @id_sede_persona INT;

        SELECT TOP 1
            @id_persona = p.id_persona,
            @id_sede_persona = p.id_sede
        FROM Persona.Persona p
        WHERE LOWER(LTRIM(RTRIM(p.Email))) = LOWER(LTRIM(RTRIM(@Email)));

        IF @id_persona IS NULL
            RAISERROR('No hay ningún cliente registrado con ese correo. Use registro completo o pida al vendedor que lo dé de alta.', 16, 1);

        IF @id_sede IS NOT NULL AND @id_sede_persona <> @id_sede
            RAISERROR('El cliente pertenece a otra sede. Solo puede activarlo el personal de su sede.', 16, 1);

        IF EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_persona = @id_persona)
            RAISERROR('Este correo ya tiene cuenta de acceso. Use iniciar sesión o recuperar contraseña.', 16, 1);

        IF EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE Username = @Email)
            RAISERROR('El username (correo) ya está en uso.', 16, 1);

        IF NOT EXISTS (SELECT 1 FROM Persona.Cliente WHERE id_persona = @id_persona)
        BEGIN
            DECLARE @nit NVARCHAR(50);
            SELECT @nit = CI FROM Persona.Persona WHERE id_persona = @id_persona;
            INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
            VALUES (@id_persona, @nit);
        END

        INSERT INTO Seguridad.Usuario
            (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
        VALUES
            (@id_persona, @id_sede_persona, @Email, @Password, 1, 1);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
