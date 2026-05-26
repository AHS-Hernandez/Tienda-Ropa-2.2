-- ----------------------------------------------------------------
-- sp_Contratar_Personal_Completo
-- Registra persona + empleado. Solo existe en Central.
-- ----------------------------------------------------------------
CREATE PROCEDURE Persona.sp_Contratar_Personal_Completo
    @Nombre             NVARCHAR(100),
    @Apellido           NVARCHAR(100),
    @CI                 NVARCHAR(50),
    @Telefono           NVARCHAR(50),
    @Email              NVARCHAR(100),
    @Direccion          NVARCHAR(MAX),
    @Fecha_contratacion DATE,
    @Salario            DECIMAL(10,2),
    @id_sede            INT
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
 
        IF @Salario < 0
            RAISERROR('El salario no puede ser negativo.', 16, 1);
 
        -- Duplicados
        IF EXISTS (SELECT 1 FROM Persona.Persona WHERE CI = @CI)
            RAISERROR('El CI ya está registrado en el sistema.', 16, 1);
 
        DECLARE @id_persona INT;
 
        INSERT INTO Persona.Persona
            (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
        VALUES
            (@id_sede, @Nombre, @Apellido, @CI, @Telefono, @Email, @Direccion);
 
        SET @id_persona = SCOPE_IDENTITY();
 
        INSERT INTO Persona.Empleado
            (id_persona, Fecha_contratacion, Salario_base)
        VALUES
            (@id_persona, @Fecha_contratacion, @Salario);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;