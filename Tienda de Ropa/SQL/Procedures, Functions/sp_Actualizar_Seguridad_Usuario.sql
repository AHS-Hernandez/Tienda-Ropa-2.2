-- ----------------------------------------------------------------
-- sp_Actualizar_Seguridad_Usuario  (CENTRAL)
-- Central puede asignar niveles 1, 2 y 3.
-- Nivel 4 (dueña) no se asigna desde ningún SP.
-- ----------------------------------------------------------------
CREATE OR ALTER PROCEDURE Seguridad.sp_Actualizar_Seguridad_Usuario
    @id_usuario_destino INT,
    @nuevo_nivel        INT,
    @estado             BIT
AS
BEGIN
    SET NOCOUNT ON;
 
    DECLARE @id_actor            INT = CAST(SESSION_CONTEXT(N'id_usuario') AS INT);
    DECLARE @nivel_actor         INT;
    DECLARE @nivel_destino_actual INT;
 
    SELECT @nivel_actor = Nivel_acceso
    FROM Seguridad.Usuario
    WHERE id_usuario = @id_actor;
 
    SELECT @nivel_destino_actual = Nivel_acceso
    FROM Seguridad.Usuario
    WHERE id_usuario = @id_usuario_destino;
 
    -- Debe ser al menos nivel 3 para operar
    IF @nivel_actor < 3 OR @nivel_actor IS NULL
    BEGIN
        RAISERROR('Privilegios insuficientes. Solo Administradores o la Dueña pueden modificar accesos.', 16, 1);
        RETURN;
    END
 
    -- Nivel 4 no se asigna desde este SP
    IF @nuevo_nivel = 4
    BEGIN
        RAISERROR('No se puede asignar el nivel 4 desde este procedimiento.', 16, 1);
        RETURN;
    END
 
    -- No puede modificar su propio nivel
    IF @id_actor = @id_usuario_destino AND @nuevo_nivel <> @nivel_destino_actual
    BEGIN
        RAISERROR('No puedes alterar tu propio nivel de acceso.', 16, 1);
        RETURN;
    END
 
    -- No puede otorgar un nivel igual o superior al suyo
    IF @nivel_actor < 4 AND @nuevo_nivel >= @nivel_actor
    BEGIN
        RAISERROR('No puedes otorgar un nivel igual o superior al tuyo.', 16, 1);
        RETURN;
    END
 
    -- Administrador (3) no puede modificar otro nivel 3 ni al nivel 4
    IF @nivel_actor = 3 AND @nivel_destino_actual >= 3 AND @id_actor <> @id_usuario_destino
    BEGIN
        RAISERROR('Un Administrador no puede modificar la cuenta de otro Administrador ni de la Dueña.', 16, 1);
        RETURN;
    END
 
    BEGIN TRY
        UPDATE Seguridad.Usuario
        SET Nivel_acceso = @nuevo_nivel,
            Estado       = @estado
        WHERE id_usuario = @id_usuario_destino;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el usuario destino.', 16, 1);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;