-- =============================================================================
-- Linked Server SEDE — script original de referencia
-- IMPORTANTE: usar SQL-Fix-LinkedServer-SSL.sql en su lugar
--             (es la versión actualizada con SSL y login mapping correcto)
-- =============================================================================
-- Paso 1: Si quedó a medias el intento anterior, limpiarlo
IF EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE')
BEGIN
    EXEC sp_dropserver 
        @server  = N'SEDE', 
        @droplogins = N'droplogins';
END
GO

-- Paso 2: Crear el Linked Server (MSOLEDBSQL 19)
-- En la SEDE primero: SQL/SQL-Sede-Login-LinkedServer.sql
-- @datasrc = host; @provstr sin "Data Source=" (evita Invalid connection string attribute)
EXEC sp_addlinkedserver
    @server     = N'SEDE',
    @srvproduct = N'',
    @provider   = N'MSOLEDBSQL',
    @datasrc    = N'10.224.111.77,1433',
    @provstr    = N'encrypt=optional;trustservercertificate=yes';
GO

-- Paso 3: Credenciales (login mapping)
-- Sin esto → "Access to the remote server is denied because no login-mapping exists."
EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = N'SEDE',
    @useself     = N'false',
    @locallogin  = NULL,
    @rmtuser     = N'login_linkedserver',
    @rmtpassword = N'L1nk3d#S3rv3r2026!';
GO

-- Paso 4: Opciones
EXEC sp_serveroption @server = N'SEDE', @optname = N'rpc',                @optvalue = N'true';
EXEC sp_serveroption @server = N'SEDE', @optname = N'rpc out',            @optvalue = N'true';
EXEC sp_serveroption @server = N'SEDE', @optname = N'collation compatible', @optvalue = N'true';
GO

-- Paso 5: Verificar (si falla login, ejecute SQL-Sede-Login-LinkedServer.sql en la sede)
BEGIN TRY
    EXEC sp_testlinkedserver N'SEDE';
    PRINT 'Linked server SEDE OK.';
END TRY
BEGIN CATCH
    PRINT ERROR_MESSAGE();
END CATCH
GO

-- Ver qué providers OLE DB tienes instalados
EXEC sp_enum_oledb_providers;
GO