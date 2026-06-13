-- =============================================================================
-- CENTRAL — master + TiendaRopa — ejecutar como sysadmin (Windows o sa)
--
-- Corrige: "login-mapping exists" con login_nivel4 cuando es miembro de sysadmin
-- (sysadmin no usa mapping; intenta entrar a SEDE como login_nivel4 y falla).
-- =============================================================================
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.servers WHERE name = N'SEDE')
BEGIN
    RAISERROR('Ejecute SQL-Fix-LinkedServer-SSL.sql primero.', 16, 1);
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.server_principals
    WHERE name = N'login_nivel4' AND type IN ('S', 'U')
)
BEGIN
    RAISERROR('Falta CREATE LOGIN login_nivel4 (Seguridad.sql).', 16, 1);
    RETURN;
END
GO

-- ── CAUSA FRECUENTE: login_nivel4 en rol sysadmin ──
IF IS_SRVROLEMEMBER('sysadmin', 'login_nivel4') = 1
BEGIN
    PRINT 'login_nivel4 ERA sysadmin → se quita del rol (el mapping no se usaba).';
    ALTER SERVER ROLE sysadmin DROP MEMBER [login_nivel4];
    PRINT 'Quitado de sysadmin. Sigue siendo db_owner en TiendaRopa.';
END
ELSE
    PRINT 'login_nivel4 no es sysadmin (correcto para mapping).';
GO

-- Limpiar mappings SEDE
DECLARE @loc SYSNAME;
DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT sp.name
    FROM sys.linked_logins ll
    INNER JOIN sys.servers s ON ll.server_id = s.server_id
    LEFT JOIN sys.server_principals sp ON ll.local_principal_id = sp.principal_id
    WHERE s.name = N'SEDE';

OPEN cur;
FETCH NEXT FROM cur INTO @loc;
WHILE @@FETCH_STATUS = 0
BEGIN
    EXEC sp_droplinkedsrvlogin @rmtsrvname = N'SEDE', @locallogin = @loc;
    FETCH NEXT FROM cur INTO @loc;
END
CLOSE cur;
DEALLOCATE cur;

EXEC sp_droplinkedsrvlogin @rmtsrvname = N'SEDE', @locallogin = NULL;
GO

-- Mapping para todos + explícito login_nivel4
EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = N'SEDE',
    @useself     = N'false',
    @locallogin  = NULL,
    @rmtuser     = N'login_linkedserver',
    @rmtpassword = N'L1nk3d#S3rv3r2026!';

EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = N'SEDE',
    @useself     = N'false',
    @locallogin  = N'login_nivel4',
    @rmtuser     = N'login_linkedserver',
    @rmtpassword = N'L1nk3d#S3rv3r2026!';
GO

PRINT '=== Mappings ===';
EXEC sp_helplinkedsrvlogin @rmtsrvname = N'SEDE';
GO

-- Prueba login_nivel4 (todo en un solo lote, sin GO entre EXECUTE AS y SELECT)
USE TiendaRopa;
GO

EXECUTE AS LOGIN = N'login_nivel4';

BEGIN TRY
    SELECT TOP 3 Sede, Nombre_completo
    FROM Persona.vw_Clientes_Global_TiempoReal;
    PRINT 'OK: login_nivel4 + vista global (mapping correcto).';
END TRY
BEGIN CATCH
    PRINT 'FALLO vista directa: ' + ERROR_MESSAGE();
    PRINT 'Use SP proxy (siguiente archivo).';
END TRY

IF OBJECT_ID(N'Configuracion.sp_Red_Clientes_Global', N'P') IS NOT NULL
BEGIN
    BEGIN TRY
        EXEC Configuracion.sp_Red_Clientes_Global;
        PRINT 'OK: sp_Red_Clientes_Global (la app usa estos SP).';
    END TRY
    BEGIN CATCH
        PRINT 'FALLO SP proxy: ' + ERROR_MESSAGE();
    END CATCH
END
ELSE
    PRINT 'Ejecute SQL-SP-Red-Global-Proxy.sql en TiendaRopa (obligatorio para la app).';

REVERT;
GO
