-- Alertas: productos sin fila en Stock_Actual cuentan como agotado (0)
USE TiendaRopa;
GO

CREATE OR ALTER VIEW Inventario.vw_Alertas_Stock_Bajo AS
SELECT
    s.Nombre        AS Sede,
    p.id_producto,
    p.Nombre        AS Producto,
    p.Talla,
    p.Color,
    ISNULL(sa.Cantidad, 0) AS Cantidad,
    CASE
        WHEN ISNULL(sa.Cantidad, 0) = 0 THEN 'Agotado'
        WHEN sa.Cantidad <= 5       THEN 'Crítico'
        ELSE 'Bajo'
    END             AS Nivel_Alerta
FROM Producto.Producto p
CROSS JOIN Configuracion.Sede s
LEFT JOIN Inventario.Stock_Actual sa
    ON sa.id_producto = p.id_producto AND sa.id_sede = s.id_sede
WHERE ISNULL(sa.Cantidad, 0) <= 10;
GO

PRINT 'vw_Alertas_Stock_Bajo actualizada (incluye stock 0 sin fila).';
GO
