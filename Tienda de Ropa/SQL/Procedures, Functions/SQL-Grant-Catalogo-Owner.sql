-- Owner (login_nivel4) puede leer catálogo por vista si la app lo usa
USE TiendaRopa;
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_nivel4')
BEGIN
    GRANT SELECT ON Producto.vw_Catalogo_Maestro TO usr_nivel4;
    GRANT SELECT ON Producto.vw_Listado_Categorias TO usr_nivel4;
    GRANT SELECT ON Producto.vw_Listado_Subcategorias TO usr_nivel4;
END
GO

PRINT 'GRANT catálogo para usr_nivel4 (opcional; la app también busca en Producto.Producto).';
GO
