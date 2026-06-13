-- =============================================================================
-- Diagnóstico linked server SEDE + timeout
-- Ejecutar en CENTRAL, base master, como sysadmin
-- =============================================================================

USE master;
GO

PRINT '=== Servidor SEDE en sys.servers ===';
SELECT
    server_id,
    name,
    product,
    provider,
    is_linked,
    is_remote_login_enabled
FROM sys.servers
WHERE name = N'SEDE';
GO

IF NOT EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE' AND is_linked = 1)
BEGIN
    RAISERROR('No existe linked server SEDE. Ejecute SQL-Fix-LinkedServer-SSL.sql primero.', 16, 1);
END
GO

PRINT '=== sp_helpserver (opciones actuales) ===';
EXEC sp_helpserver @server = N'SEDE';
GO

PRINT '=== Prueba connect timeout (suele funcionar) ===';
BEGIN TRY
    EXEC sp_serveroption @server = N'SEDE', @optname = N'connect timeout', @optvalue = N'60';
    PRINT 'OK: connect timeout = 60';
END TRY
BEGIN CATCH
    PRINT 'connect timeout no disponible: ' + ERROR_MESSAGE();
END CATCH
GO

PRINT '=== Prueba query timeout (puede dar Msg 15600 en su edición) ===';
BEGIN TRY
    EXEC sp_serveroption @server = N'SEDE', @optname = N'query timeout', @optvalue = N'false';
    PRINT 'OK: query timeout = false';
END TRY
BEGIN CATCH
    PRINT 'query timeout NO soportado en este SQL Server (Msg 15600). Use SQL-Replicacion-Triggers-Guia.sql Opción B.';
END CATCH
GO

PRINT '=== Prueba de conexión ===';
BEGIN TRY
    EXEC sp_testlinkedserver N'SEDE';
    PRINT 'sp_testlinkedserver: OK';
END TRY
BEGIN CATCH
    PRINT 'sp_testlinkedserver FALLO: ' + ERROR_MESSAGE();
END CATCH
GO
