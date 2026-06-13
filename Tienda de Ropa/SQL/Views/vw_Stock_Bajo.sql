CREATE VIEW Inventario.vw_Stock_Bajo AS
SELECT sa.id_sede, sa.id_producto, p.Nombre AS producto,
       sub.Nombre AS subcategoria, sa.Cantidad AS stock_actual,
       u.Stock_minimo AS umbral
FROM Inventario.Stock_Actual sa
JOIN Producto.Producto      p   ON sa.id_producto    = p.id_producto
JOIN Producto.Subcategoria  sub ON p.id_subcategoria = sub.id_subcategoria
JOIN Inventario.Stock_Umbral u  ON u.id_subcategoria = sub.id_subcategoria
                                AND u.id_sede        = sa.id_sede
WHERE sa.Cantidad <= u.Stock_minimo;