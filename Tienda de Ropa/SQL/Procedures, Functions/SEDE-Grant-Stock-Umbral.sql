-- ================================================================
-- EJECUTAR EN EL SQL SERVER DE SEDE (10.224.111.77)
-- ================================================================
-- El login_linkedserver solo tenía db_datareader (solo lectura).
-- Para que la replicación de umbrales funcione necesita escritura
-- en Stock_Umbral.
-- ================================================================

USE TiendaRopa;
GO

GRANT INSERT, UPDATE, DELETE ON Inventario.Stock_Umbral TO [login_linkedserver];
GO

PRINT 'Permisos de escritura en Stock_Umbral otorgados a login_linkedserver.';
