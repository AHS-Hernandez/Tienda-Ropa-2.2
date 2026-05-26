-- ----------------------------------------------------------------
-- sp_Registro_Maestro_Cliente
-- Sign Up completo: crea Persona + Cliente + Usuario web
-- Central también maneja clientes propios.
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Registro_Maestro_Cliente
    @Nombre    NVARCHAR(100),
    @Apellido  NVARCHAR(100),
    @CI        NVARCHAR(50),
    @Telefono  NVARCHAR(50),
    @Email     NVARCHAR(100),
    @Direccion NVARCHAR(MAX),
    @Password  NVARCHAR(255),
    @Nit       NVARCHAR(50) = NULL,
    @id_sede   INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        -- Validaciones de formato
        IF @CI NOT LIKE '[0-9]%'
            RAISERROR('El CI debe comenzar con dígitos.', 16, 1);
 
        IF @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo electrónico no es válido.', 16, 1);
 
        IF @Telefono IS NOT NULL AND LEN(@Telefono) > 0
            AND @Telefono NOT LIKE '%[0-9]%'
            RAISERROR('El teléfono debe contener al menos un número.', 16, 1);
 
        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);
 
        -- Duplicados
        IF EXISTS (SELECT 1 FROM Persona.Persona WHERE CI = @CI OR Email = @Email)
            RAISERROR('El CI o el correo ya están registrados en el sistema.', 16, 1);
 
        DECLARE @id_persona_nuevo INT;
 
        INSERT INTO Persona.Persona
            (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
        VALUES
            (@id_sede, @Nombre, @Apellido, @CI, @Telefono, @Email, @Direccion);
 
        SET @id_persona_nuevo = SCOPE_IDENTITY();
 
        INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
        VALUES (@id_persona_nuevo, ISNULL(@Nit, @CI));
 
        INSERT INTO Seguridad.Usuario
            (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
        VALUES
            (@id_persona_nuevo, @id_sede, @Email, @Password, 1, 1);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;