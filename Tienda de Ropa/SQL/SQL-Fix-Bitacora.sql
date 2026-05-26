-- Corrección rápida: FK_Bitacora_Usuario al insertar Persona sin sesión válida
USE TiendaRopa;
GO

CREATE OR ALTER TRIGGER Persona.trg_Bitacora_Persona
ON Persona.Persona
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_usuario INT = TRY_CAST(SESSION_CONTEXT(N'id_usuario') AS INT);

    IF @id_usuario IS NULL
       OR NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_usuario = @id_usuario)
        SELECT @id_usuario = MIN(id_usuario) FROM Seguridad.Usuario;

    IF @id_usuario IS NULL
        RETURN;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT @id_usuario, i.id_sede, 'INSERT', 'Persona.Persona', NULL,
           CONCAT('ID:', i.id_persona, '|Nombre:', i.Nombre, '|Apellido:', i.Apellido)
    FROM inserted i
    LEFT JOIN deleted d ON i.id_persona = d.id_persona
    WHERE d.id_persona IS NULL;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT @id_usuario, d.id_sede, 'DELETE', 'Persona.Persona',
           CONCAT('ID:', d.id_persona, '|Nombre:', d.Nombre, '|Apellido:', d.Apellido), NULL
    FROM deleted d
    LEFT JOIN inserted i ON d.id_persona = i.id_persona
    WHERE i.id_persona IS NULL;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT @id_usuario, i.id_sede, 'UPDATE', 'Persona.Persona',
           CONCAT('ID:', d.id_persona, '|Nombre:', d.Nombre, '|Apellido:', d.Apellido),
           CONCAT('ID:', i.id_persona, '|Nombre:', i.Nombre, '|Apellido:', i.Apellido)
    FROM inserted i
    INNER JOIN deleted d ON i.id_persona = d.id_persona;
END;
GO

PRINT 'Trigger Persona.trg_Bitacora_Persona actualizado.';
GO
