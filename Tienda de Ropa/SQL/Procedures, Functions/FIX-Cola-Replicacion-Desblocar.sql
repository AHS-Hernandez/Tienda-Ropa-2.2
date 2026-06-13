USE TiendaRopa;
GO

DELETE FROM Inventario.Stock_Umbral;
DBCC CHECKIDENT ('Inventario.Stock_Umbral', RESEED, 0);
GO
