USE master;
GO
-- ─────────────────────────────────────────────────────
-- Paso 1: Limpiar linked server si ya existe (evita conflictos)
-- ─────────────────────────────────────────────────────
IF EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE')
BEGIN
    EXEC sp_dropserver
        @server     = N'SEDE',
        @droplogins = N'droplogins';
    PRINT 'Linked server SEDE anterior eliminado.';
END
GO
-- ─────────────────────────────────────────────────────
-- Paso 2: Crear el Linked Server con MSOLEDBSQL
-- ─────────────────────────────────────────────────────
-- @datasrc = host,port (sin espacios)
-- @provstr = opciones SSL (NO poner "Data Source=" aquí, eso causa
--            "Invalid connection string attribute")
EXEC sp_addlinkedserver
    @server     = N'SEDE',
    @srvproduct = N'',
    @provider   = N'MSOLEDBSQL',
    @datasrc    = N'10.224.111.77,1433',
    @provstr    = N'encrypt=optional;trustservercertificate=yes';
GO
PRINT 'Linked server SEDE creado.';
GO
-- ─────────────────────────────────────────────────────
-- Paso 3: Login mapping — ESTO ES LO QUE FALTABA
-- ─────────────────────────────────────────────────────
-- Mapea TODOS los logins locales (@locallogin = NULL)
-- al login remoto login_linkedserver en la Sede.
-- Sin esto → "Access to the remote server is denied
--             because no login-mapping exists."
EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = N'SEDE',
    @useself     = N'false',
    @locallogin  = NULL,
    @rmtuser     = N'login_linkedserver',
    @rmtpassword = N'L1nk3d#S3rv3r2026!';
GO
PRINT 'Login mapping configurado (todos los logins locales → login_linkedserver).';
GO
-- ─────────────────────────────────────────────────────
-- Paso 4: Opciones del linked server
-- ─────────────────────────────────────────────────────
EXEC sp_serveroption @server = N'SEDE', @optname = N'rpc',                  @optvalue = N'true';
EXEC sp_serveroption @server = N'SEDE', @optname = N'rpc out',              @optvalue = N'true';
EXEC sp_serveroption @server = N'SEDE', @optname = N'collation compatible', @optvalue = N'true';
GO
PRINT 'Opciones rpc, rpc out y collation compatible activadas.';
GO
-- ─────────────────────────────────────────────────────
-- Paso 5: Verificar conexión
-- ─────────────────────────────────────────────────────
BEGIN TRY
    EXEC sp_testlinkedserver N'SEDE';
    PRINT '✓ Linked server SEDE — conexión OK.';
END TRY
BEGIN CATCH
    PRINT '✗ Error al conectar con SEDE: ' + ERROR_MESSAGE();
    PRINT '  → Verifique que login_linkedserver existe en la Sede';
    PRINT '    (ejecutar SQL-Sede-Login-LinkedServer.sql en 10.224.111.77)';
END CATCH
GO

-- Verifica que el Linked Server responde
EXEC sp_testlinkedserver N'SEDE';
