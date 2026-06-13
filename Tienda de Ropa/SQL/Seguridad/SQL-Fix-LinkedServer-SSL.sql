-- =============================================================================
-- SQL-Fix-LinkedServer-SSL.sql
-- Ejecutar en CENTRAL (10.224.111.230) — en la BD master
--
-- PRERREQUISITO: haber ejecutado SQL-Sede-Login-LinkedServer.sql
--                en el servidor SEDE (10.224.111.77)
--
-- Corrige el error:
--   "Access to the remote server is denied because no login-mapping exists."
--
-- Causa raíz: el linked server SEDE no tenía un login-mapping válido,
--   o fue creado sin sp_addlinkedsrvlogin, o el mapping se perdió.
-- =============================================================================

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

IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'login_nivel4')
BEGIN
    EXEC sp_addlinkedsrvlogin
        @rmtsrvname  = N'SEDE',
        @useself     = N'false',
        @locallogin  = N'login_nivel4',
        @rmtuser     = N'login_linkedserver',
        @rmtpassword = N'L1nk3d#S3rv3r2026!';
    PRINT 'Mapping explícito login_nivel4 → login_linkedserver.';
END
GO

PRINT 'Login mapping configurado (todos los logins + login_nivel4).';
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
    PRINT 'Linked server SEDE — conexion OK (como su usuario SSMS).';
END TRY
BEGIN CATCH
    PRINT 'Error al conectar con SEDE: ' + ERROR_MESSAGE();
    PRINT '  Verifique login_linkedserver en la Sede (SQL-Sede-Login-LinkedServer.sql).';
END CATCH
GO

USE TiendaRopa;
GO

-- Prueba real para la app (sin GO entre EXECUTE AS y SELECT)
EXECUTE AS LOGIN = N'login_nivel4';

BEGIN TRY
    SELECT TOP 1 Sede FROM Persona.vw_Clientes_Global_TiempoReal;
    PRINT 'OK: login_nivel4 puede usar vistas globales.';
END TRY
BEGIN CATCH
    PRINT 'FALLO login_nivel4 (vista directa): ' + ERROR_MESSAGE();
    PRINT '  Si login_nivel4 es sysadmin: SQL-Grant-LinkedServer-login_nivel4.sql lo corrige.';
    PRINT '  Para la app: SQL-SP-Red-Global-Proxy.sql (no requiere mapping).';
END CATCH

REVERT;
GO
