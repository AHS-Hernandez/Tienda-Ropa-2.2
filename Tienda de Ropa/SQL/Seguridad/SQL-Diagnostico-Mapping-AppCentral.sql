-- ================================================================
-- DIAGNOSTICO: por que la app no ve ventas via linked server
-- ================================================================
-- Ejecutar en CENTRAL como sysadmin.
-- Compara lo que ve sysadmin (SSMS) vs lo que ve login_app_central (la app).
-- ================================================================

USE master;
GO

PRINT '=== 1. Logins relevantes ===';
SELECT name, type_desc, is_disabled
FROM sys.server_principals
WHERE name IN ('login_app_central', 'login_nivel4', 'login_linkedserver');
GO

PRINT '=== 2. Mappings configurados para SEDE ===';
EXEC sp_helplinkedsrvlogin @rmtsrvname = N'SEDE';
GO

PRINT '=== 3. Que mapping usa login_app_central ===';
SELECT
    sp.name AS local_login,
    ll.uses_self_credential,
    ll.remote_name
FROM sys.linked_logins ll
INNER JOIN sys.servers s ON ll.server_id = s.server_id
LEFT JOIN sys.server_principals sp ON ll.local_principal_id = sp.principal_id
WHERE s.name = N'SEDE'
  AND (sp.name = N'login_app_central' OR sp.name IS NULL);
GO

PRINT '=== 4. Probar la vista como login_app_central ===';
USE TiendaRopa;
GO
EXECUTE AS LOGIN = N'login_app_central';

BEGIN TRY
    SELECT TOP 3 Sede, Nro_factura, Cliente_Nombre
    FROM Ventas.vw_Ventas_Hoy_Global;
    PRINT 'OK: login_app_central puede leer vw_Ventas_Hoy_Global';
END TRY
BEGIN CATCH
    PRINT 'FALLO: ' + ERROR_MESSAGE();
END CATCH

REVERT;
GO
