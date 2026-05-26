-- ----------------------------------------------------------------
-- sp_Registrar_Sincronizacion
-- Registra o actualiza el control de réplica entre nodos
-- ----------------------------------------------------------------
CREATE PROCEDURE Configuracion.sp_Registrar_Sincronizacion
    @id_sede        INT,
    @tabla          NVARCHAR(150),
    @registros_sync INT,
    @estado         NVARCHAR(50),
    @detalle_error  NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @estado NOT IN ('Pendiente', 'Completado', 'Conflicto', 'Error')
            RAISERROR('Estado de sincronización no válido.', 16, 1);
 
        IF EXISTS (
            SELECT 1 FROM Configuracion.Replica_Control
            WHERE id_sede = @id_sede AND Tabla_nombre = @tabla
        )
        BEGIN
            UPDATE Configuracion.Replica_Control
            SET Ultima_sync    = GETDATE(),
                Registros_sync = @registros_sync,
                Estado         = @estado,
                Detalle_error  = @detalle_error
            WHERE id_sede = @id_sede AND Tabla_nombre = @tabla;
        END
        ELSE
        BEGIN
            INSERT INTO Configuracion.Replica_Control
                (id_sede, Tabla_nombre, Ultima_sync, Registros_sync, Estado, Detalle_error)
            VALUES
                (@id_sede, @tabla, GETDATE(), @registros_sync, @estado, @detalle_error);
        END
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;