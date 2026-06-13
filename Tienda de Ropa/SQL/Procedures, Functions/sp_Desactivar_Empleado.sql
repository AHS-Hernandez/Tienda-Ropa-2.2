ALTER TABLE Persona.Empleado
ADD Activo BIT NOT NULL DEFAULT 1;
GO

USE TiendaRopa;
GO

CREATE PROCEDURE Persona.sp_Desactivar_Empleado
    @id_empleado INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @id_persona INT;
        DECLARE @id_sede    INT;

        SELECT 
            @id_persona = E.id_persona,
            @id_sede    = P.id_sede
        FROM Persona.Empleado AS E
        INNER JOIN Persona.Persona AS P ON E.id_persona = P.id_persona
        WHERE E.id_empleado = @id_empleado;

        IF @id_persona IS NULL
            RAISERROR('No se encontró el empleado especificado.', 16, 1);

        IF EXISTS (SELECT 1 FROM Persona.Empleado WHERE id_empleado = @id_empleado AND Activo = 0)
            RAISERROR('El empleado ya está inactivo.', 16, 1);

        -- Desactivar empleado
        UPDATE Persona.Empleado
        SET Activo = 0
        WHERE id_empleado = @id_empleado;

        -- Bajar nivel de acceso a 1 si tiene usuario
        UPDATE Seguridad.Usuario
        SET Nivel_acceso = 1
        WHERE id_persona = @id_persona;

        -- Auditoría
        INSERT INTO Seguridad.Bitacora
            (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo, Fecha_hora)
        VALUES
            (
                CAST(SESSION_CONTEXT(N'id_usuario') AS INT),
                @id_sede,
                'UPDATE',
                'Persona.Empleado',
                CONCAT('Empleado=', @id_empleado, ', Activo=1'),
                'Activo=0, Nivel_acceso=1',
                GETDATE()
            );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

GRANT EXECUTE ON Persona.sp_Desactivar_Empleado TO usr_nivel3;
GRANT EXECUTE ON Persona.sp_Desactivar_Empleado TO  usr_nivel4;