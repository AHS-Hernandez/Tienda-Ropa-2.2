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

EXEC sp_testlinkedserver N'SEDE';