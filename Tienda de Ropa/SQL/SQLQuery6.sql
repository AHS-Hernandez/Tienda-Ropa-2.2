EXEC sp_droplinkedsrvlogin @rmtsrvname = 'SEDE', @locallogin = NULL;

EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = 'SEDE',
    @useself     = 'FALSE',
    @locallogin  = NULL,
    @rmtuser     = 'login_linkedserver',
    @rmtpassword = 'L1nk3d#S3rv3r2026!';

    EXECUTE AS USER = 'usr_nivel4';
SELECT TOP 1 * FROM Ventas.vw_Ventas_Hoy_Global;
REVERT;

SELECT s.name, sp.name AS local_login, ll.remote_name
FROM sys.linked_logins ll
JOIN sys.servers s ON ll.server_id = s.server_id
LEFT JOIN sys.server_principals sp ON ll.local_principal_id = sp.principal_id
WHERE s.name = 'SEDE'

SELECT s.name, sp.name AS local_login, ll.remote_name
FROM sys.linked_logins ll
JOIN sys.servers s ON ll.server_id = s.server_id
LEFT JOIN sys.server_principals sp ON ll.local_principal_id = sp.principal_id
WHERE s.name = 'SEDE'

SELECT name FROM sys.servers WHERE name = 'SEDE'
SELECT name, provider, data_source, provider_string
FROM sys.servers
WHERE name = 'SEDE'

EXEC sp_dropserver 'SEDE', 'droplogins';

EXEC sp_addlinkedserver
    @server     = 'SEDE',
    @srvproduct = '',
    @provider   = 'MSOLEDBSQL19',
    @datasrc    = '10.224.111.77,1433',
    @provstr    = 'Trust Server Certificate=Yes;Encrypt=Optional;';

EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = 'SEDE',
    @useself     = 'FALSE',
    @locallogin  = NULL,
    @rmtuser     = 'login_linkedserver',
    @rmtpassword = 'L1nk3d#S3rv3r2026!';

EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = 'SEDE',
    @useself     = 'FALSE',
    @locallogin  = 'login_nivel4',
    @rmtuser     = 'login_linkedserver',
    @rmtpassword = 'L1nk3d#S3rv3r2026!';

EXEC sp_testlinkedserver N'SEDE';