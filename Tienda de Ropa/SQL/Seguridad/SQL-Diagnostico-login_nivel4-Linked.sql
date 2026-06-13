-- =============================================================================
-- CENTRAL — ejecutar en SSMS (como Windows/sa = sysadmin)
-- Explica por qué login_nivel4 falla aunque usted en SSMS vea las vistas bien.
-- =============================================================================
USE master;
GO

PRINT '=== 1) Quién es usted en SSMS ===';
SELECT
    SUSER_SNAME() AS su_login,
    IS_SRVROLEMEMBER('sysadmin') AS usted_es_sysadmin;
GO

PRINT '=== 2) login_nivel4 (cuenta de la app) ===';
SELECT
    sp.name,
    sp.type_desc,
    sp.is_disabled,
    IS_SRVROLEMEMBER('sysadmin', 'login_nivel4') AS es_sysadmin,
    CASE
        WHEN IS_SRVROLEMEMBER('sysadmin', 'login_nivel4') = 1
        THEN 'PROBLEMA: sysadmin IGNORA el login-mapping y usa "self" en SEDE (login_nivel4 no existe allí)'
        ELSE 'OK: no es sysadmin; el mapping deberia aplicarse'
    END AS diagnostico
FROM sys.server_principals sp
WHERE sp.name = N'login_nivel4';
GO

PRINT '=== 3) Mappings del linked server SEDE ===';
EXEC sp_helplinkedsrvlogin @rmtsrvname = N'SEDE';
GO

PRINT '=== 3b) ¿Existe fila para login_nivel4? ===';
SELECT
    s.name AS linked_server,
    ISNULL(sp_loc.name, N'(todos / NULL)') AS local_login,
    ll.remote_name,
    ll.uses_self_credential
FROM sys.linked_logins ll
INNER JOIN sys.servers s ON ll.server_id = s.server_id
LEFT JOIN sys.server_principals sp_loc ON ll.local_principal_id = sp_loc.principal_id
WHERE s.name = N'SEDE';
GO

PRINT '=== 4) Dueño de la base TiendaRopa ===';
USE TiendaRopa;
SELECT
    SUSER_SNAME() AS dbo_login
FROM sys.database_principals
WHERE name = N'dbo';
GO

PRINT 'Si es_sysadmin=1 en paso 2: ejecute SQL-Grant-LinkedServer-login_nivel4.sql (quita sysadmin a login_nivel4).';
PRINT 'Luego SQL-SP-Red-Global-Proxy.sql para la app.';
GO
