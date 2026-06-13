-- ================================================================
-- CENTRAL — master + TiendaRopa — ejecutar como sysadmin
-- ================================================================
-- Da a login_app_central (el login que usa la aplicacion Next.js)
-- el mapping al linked server SEDE, igual que el de login_nivel4.
--
-- Sintoma que arregla: SSMS lee vw_Ventas_Hoy_Global y vw_Ventas_Global
-- correctamente, pero la app muestra "Solo Central (fallback)" o timeout.
-- Causa: login_app_central no tiene mapping explicito al linked server.
-- ================================================================

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE')
BEGIN
    RAISERROR('Linked server SEDE no existe. Ejecute SQL-Fix-LinkedServer-SSL.sql primero.', 16, 1);
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.server_principals
    WHERE name = N'login_app_central' AND type IN ('S', 'U')
)
BEGIN
    RAISERROR('Login login_app_central no existe. Revise variables de entorno DB_USER.', 16, 1);
    RETURN;
END
GO

-- Si login_app_central es sysadmin se ignora el mapping → quitar
IF IS_SRVROLEMEMBER('sysadmin', 'login_app_central') = 1
BEGIN
    PRINT 'login_app_central ERA sysadmin → se quita del rol (sysadmin ignora mappings).';
    ALTER SERVER ROLE sysadmin DROP MEMBER [login_app_central];
END
ELSE
    PRINT 'login_app_central no es sysadmin (correcto para mapping).';
GO

-- Borrar mapping previo de login_app_central (si existiera)
EXEC sp_droplinkedsrvlogin @rmtsrvname = N'SEDE', @locallogin = N'login_app_central';
GO

-- Crear mapping explicito: login_app_central → login_linkedserver en SEDE
EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = N'SEDE',
    @useself     = N'false',
    @locallogin  = N'login_app_central',
    @rmtuser     = N'login_linkedserver',
    @rmtpassword = N'L1nk3d#S3rv3r2026!';
GO

PRINT '=== Mappings actualizados ===';
EXEC sp_helplinkedsrvlogin @rmtsrvname = N'SEDE';
GO

-- Probar como login_app_central
USE TiendaRopa;
GO

EXECUTE AS LOGIN = N'login_app_central';

BEGIN TRY
    SELECT TOP 3 Sede, Nro_factura, Cliente_Nombre, Fecha_emision
    FROM Ventas.vw_Ventas_Hoy_Global;
    PRINT 'OK: login_app_central ya lee vw_Ventas_Hoy_Global via linked server.';
END TRY
BEGIN CATCH
    PRINT 'FALLO: ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    SELECT TOP 3 Sede, Nro_factura, Total_neto
    FROM Ventas.vw_Ventas_Global
    ORDER BY Fecha_emision DESC;
    PRINT 'OK: login_app_central ya lee vw_Ventas_Global via linked server.';
END TRY
BEGIN CATCH
    PRINT 'FALLO: ' + ERROR_MESSAGE();
END CATCH

REVERT;
GO

PRINT 'Listo. Reinicie el servidor Next.js (npm run dev) para que la pool tome el cambio.';
GO
