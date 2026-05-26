ALTER DATABASE TiendaRopa SET TRUSTWORTHY ON;
EXECUTE AS USER = 'usr_nivel4';
SELECT TOP 1 * FROM Ventas.vw_Ventas_Hoy_Global;
REVERT;

-- Eliminar mapping global actual
EXEC sp_droplinkedsrvlogin @rmtsrvname = 'SEDE', @locallogin = NULL;

-- Recrear mapping global (NULL = cualquier login sin mapping específico)
EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = 'SEDE',
    @useself     = 'FALSE',
    @locallogin  = NULL,
    @rmtuser     = 'login_linkedserver',
    @rmtpassword = 'L1nk3d#S3rv3r2026!';