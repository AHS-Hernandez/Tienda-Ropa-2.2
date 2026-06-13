-- =============================================================================
-- Ejecutar en la SEDE (10.224.111.77) — NO en tu Central (.230)
--
-- ¿Por qué aparece "USE master"?
--   CREATE LOGIN es del SERVIDOR (no de una base). En SQL Server eso solo
--   se hace en master. Luego el script pasa a TiendaRopa para el USER.
-- =============================================================================
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'login_linkedserver')
BEGIN
    CREATE LOGIN login_linkedserver
    WITH PASSWORD = N'L1nk3d#S3rv3r2026!',
         CHECK_POLICY = OFF,
         CHECK_EXPIRATION = OFF;
    PRINT 'Login login_linkedserver creado en la sede.';
END
ELSE
    PRINT 'Login login_linkedserver ya existe en la sede.';
GO

USE TiendaRopa;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'login_linkedserver')
BEGIN
    CREATE USER login_linkedserver FOR LOGIN login_linkedserver;
    PRINT 'Usuario login_linkedserver creado en TiendaRopa (sede).';
END
GO

IF IS_ROLEMEMBER('db_datareader', 'login_linkedserver') = 0
BEGIN
    ALTER ROLE db_datareader ADD MEMBER login_linkedserver;
    PRINT 'db_datareader asignado (lectura para vistas del linked server).';
END
GO

PRINT 'Listo. Vuelva a Central y ejecute SQL-Fix-LinkedServer-SSL.sql';
GO
