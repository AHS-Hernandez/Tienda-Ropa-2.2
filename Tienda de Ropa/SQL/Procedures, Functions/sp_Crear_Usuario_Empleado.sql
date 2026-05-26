-- ================================================================
-- sp_Crear_Usuario_Empleado
-- Crea las credenciales de acceso para un empleado que ya existe
-- en Persona.Empleado. El administrador define el nivel (1, 2 o 3)
-- ================================================================
CREATE PROCEDURE Seguridad.sp_Crear_Usuario_Empleado
    @id_empleado  INT,
    @Username     NVARCHAR(50),
    @Password     NVARCHAR(255),
    @Nivel_acceso INT,
    @id_sede      INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        IF @Username NOT LIKE '%@%.%'
            RAISERROR('El username debe ser un correo electrónico válido.', 16, 1);
 
        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);
 
        -- Nivel válido para empleados: 1 (vendedor), 2 (supervisor), 3 (administrador)
        -- Nivel 4 (dueña) nunca se asigna por SP
        IF @Nivel_acceso NOT IN (1, 2, 3)
            RAISERROR('El nivel de acceso para empleados debe ser 1, 2 o 3.', 16, 1);
 
        -- Verificar que el empleado existe
        DECLARE @id_persona INT;
 
        SELECT @id_persona = E.id_persona
        FROM Persona.Empleado E
        WHERE E.id_empleado = @id_empleado;
 
        IF @id_persona IS NULL
            RAISERROR('El empleado especificado no existe.', 16, 1);
 
        IF EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_persona = @id_persona)
            RAISERROR('Este empleado ya tiene credenciales de acceso registradas.', 16, 1);
 
        IF EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE Username = @Username)
            RAISERROR('El username especificado ya está en uso.', 16, 1);
 
        DECLARE @id_actor    INT = CAST(SESSION_CONTEXT(N'id_usuario') AS INT);
        DECLARE @nivel_actor INT;
 
        SELECT @nivel_actor = Nivel_acceso
        FROM Seguridad.Usuario
        WHERE id_usuario = @id_actor;
 
        IF @nivel_actor < 3 OR @nivel_actor IS NULL
            RAISERROR('Privilegios insuficientes. Solo Administradores o la Dueña pueden crear usuarios de empleados.', 16, 1);
 
        IF @nivel_actor < 4 AND @Nivel_acceso >= @nivel_actor
            RAISERROR('No puedes otorgar un nivel de acceso igual o superior al tuyo.', 16, 1);
 
        INSERT INTO Seguridad.Usuario
            (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
        VALUES
            (@id_persona, @id_sede, @Username, @Password, @Nivel_acceso, 1);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;