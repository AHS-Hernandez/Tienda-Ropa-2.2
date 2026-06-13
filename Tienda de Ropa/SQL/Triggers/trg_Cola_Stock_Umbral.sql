CREATE OR ALTER TRIGGER Inventario.trg_Cola_Stock_Umbral
ON Inventario.Stock_Umbral
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Solo encolar filas que pertenecen a sedes NO centrales.
    -- Los umbrales de Central (Es_Central=1) se guardan localmente
    -- y no necesitan replicarse a Sede.

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
        INSERT INTO Configuracion.Cola_Replicacion (tabla, operacion, payload)
        SELECT 'Inventario.Stock_Umbral', 'U',
               (SELECT i.* FROM inserted i FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN Configuracion.Sede s ON s.id_sede = i.id_sede
        WHERE s.Es_Central = 0;

    ELSE IF EXISTS (SELECT 1 FROM inserted)
        INSERT INTO Configuracion.Cola_Replicacion (tabla, operacion, payload)
        SELECT 'Inventario.Stock_Umbral', 'I',
               (SELECT i.* FROM inserted i FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN Configuracion.Sede s ON s.id_sede = i.id_sede
        WHERE s.Es_Central = 0;

    ELSE
        INSERT INTO Configuracion.Cola_Replicacion (tabla, operacion, payload)
        SELECT 'Inventario.Stock_Umbral', 'D',
               (SELECT d.* FROM deleted d FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM deleted d
        JOIN Configuracion.Sede s ON s.id_sede = d.id_sede
        WHERE s.Es_Central = 0;
END;
