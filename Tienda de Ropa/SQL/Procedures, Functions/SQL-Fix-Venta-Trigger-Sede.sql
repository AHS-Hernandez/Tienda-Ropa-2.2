-- Trigger: solo rechazar ventas de OTRA sede en ESTE servidor físico
-- Antes usaba "Activa=1" y en Central hay 2 sedes activas → elegía la sede equivocada.
USE TiendaRopa;
GO

CREATE OR ALTER TRIGGER Ventas.trg_Venta_Solo_Sede_Propia
ON Ventas.Venta_Cabecera
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_sede_local INT;

    -- En Central: fila Es_Central=1. En servidor Sede: la sucursal (sin fila central).
    SELECT @id_sede_local = id_sede
    FROM Configuracion.Sede
    WHERE Es_Central = 1;

    IF @id_sede_local IS NULL
        SELECT TOP 1 @id_sede_local = id_sede
        FROM Configuracion.Sede
        WHERE Activa = 1
        ORDER BY id_sede;

    IF @id_sede_local IS NULL
        RETURN;

    IF EXISTS (
        SELECT 1 FROM inserted
        WHERE id_sede <> @id_sede_local
    )
    BEGIN
        RAISERROR('No puedes registrar ventas de otra sede en este servidor.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

PRINT 'trg_Venta_Solo_Sede_Propia corregido (Es_Central en Central).';
GO
