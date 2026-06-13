-- =============================================================================
-- CENTRAL (10.224.111.230) — ejecutar en SSMS como sysadmin
-- Orden: 1) SQL-Sede-Login-LinkedServer.sql en SEDE (.77)
--        2) Este script en CENTRAL (master)
-- =============================================================================
USE master;
GO

PRINT '=== Logins locales que usa la app ===';
SELECT name AS login_local FROM sys.server_principals
WHERE type IN ('S', 'U') AND name NOT LIKE '##%'
  AND name IN (N'login_nivel4', N'sa');
GO

PRINT '=== Linked server SEDE ===';
SELECT name, product, provider, data_source FROM sys.servers WHERE name = N'SEDE';
GO

PRINT '=== Mappings actuales ===';
EXEC sp_helplinkedsrvlogin @rmtsrvname = N'SEDE';
GO

-- Recrear mapping (corrige "no login-mapping exists")
IF EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE')
BEGIN
    EXEC sp_droplinkedsrvlogin @rmtsrvname = N'SEDE', @locallogin = NULL;

    EXEC sp_addlinkedsrvlogin
        @rmtsrvname  = N'SEDE',
        @useself     = N'false',
        @locallogin  = NULL,
        @rmtuser     = N'login_linkedserver',
        @rmtpassword = N'L1nk3d#S3rv3r2026!';

    IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'login_nivel4')
    BEGIN
        EXEC sp_addlinkedsrvlogin
            @rmtsrvname  = N'SEDE',
            @useself     = N'false',
            @locallogin  = N'login_nivel4',
            @rmtuser     = N'login_linkedserver',
            @rmtpassword = N'L1nk3d#S3rv3r2026!';
        PRINT 'Mapping explícito para login_nivel4 agregado.';
    END

    PRINT 'Mappings recreados (NULL + login_nivel4 si existe).';
END
ELSE
    PRINT 'ERROR: No existe linked server SEDE. Ejecute primero SQL-Fix-LinkedServer-SSL.sql';
GO

BEGIN TRY
    EXEC sp_testlinkedserver N'SEDE';
    PRINT 'sp_testlinkedserver: OK';
END TRY
BEGIN CATCH
    PRINT 'sp_testlinkedserver FALLÓ: ' + ERROR_MESSAGE();
END CATCH
GO

USE TiendaRopa;
GO

BEGIN TRY
    SELECT TOP 1 Sede, id_cliente FROM Persona.vw_Clientes_Global_TiempoReal;
    PRINT 'Vista vw_Clientes_Global_TiempoReal: OK';
END TRY
BEGIN CATCH
    PRINT 'Vista global FALLÓ: ' + ERROR_MESSAGE();
END CATCH
GO
