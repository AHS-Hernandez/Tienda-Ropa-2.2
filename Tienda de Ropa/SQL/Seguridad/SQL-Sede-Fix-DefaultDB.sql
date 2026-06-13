-- ================================================================
-- EJECUTAR EN EL SQL SERVER DE SEDE (10.224.111.77)
-- ================================================================
-- Sintoma: OPENQUERY desde Central falla con
--   "The SELECT permission was denied on the object 'Usuario',
--    database 'master', schema 'Seguridad'."
--
-- Causa: el default database del login_linkedserver es master.
-- Cuando Central abre la conexion via linked server, arranca en master
-- y la query falla aunque tiene db_datareader en TiendaRopa.
-- ================================================================

USE master;
GO

ALTER LOGIN login_linkedserver
    WITH DEFAULT_DATABASE = TiendaRopa;
GO

PRINT 'Default database de login_linkedserver cambiado a TiendaRopa.';
GO
