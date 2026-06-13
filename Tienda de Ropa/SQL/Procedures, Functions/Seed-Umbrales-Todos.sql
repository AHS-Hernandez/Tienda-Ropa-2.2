USE TiendaRopa;
GO

-- ================================================================
-- Sembrar umbrales para TODAS las subcategorias con productos
-- en TODAS las sedes activas (UPSERT por id_subcategoria, id_sede).
-- ================================================================
-- Cambia este valor para ajustar el minimo por defecto:
DECLARE @Stock_minimo INT = 5;
-- ================================================================

-- Subcategorias que tienen al menos un producto
DECLARE @subs TABLE (id_subcategoria INT PRIMARY KEY);
INSERT INTO @subs (id_subcategoria)
SELECT DISTINCT id_subcategoria
FROM Producto.Producto;

-- Sedes activas
DECLARE @sedes TABLE (id_sede INT PRIMARY KEY);
INSERT INTO @sedes (id_sede)
SELECT id_sede FROM Configuracion.Sede WHERE Activa = 1;

-- UPSERT: actualiza si existe, inserta si no
MERGE Inventario.Stock_Umbral AS dst
USING (
    SELECT s.id_subcategoria, se.id_sede
    FROM @subs s
    CROSS JOIN @sedes se
) AS src
    ON dst.id_subcategoria = src.id_subcategoria
   AND dst.id_sede         = src.id_sede
WHEN MATCHED THEN
    UPDATE SET Stock_minimo   = @Stock_minimo,
               Fecha_registro = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (id_subcategoria, id_sede, Stock_minimo, Fecha_registro)
    VALUES (src.id_subcategoria, src.id_sede, @Stock_minimo, GETDATE());

-- Verificar
SELECT u.id_subcategoria, sc.Nombre AS subcategoria, c.Nombre AS categoria,
       u.id_sede, se.Nombre AS sede, u.Stock_minimo, u.Fecha_registro
FROM Inventario.Stock_Umbral u
JOIN Producto.Subcategoria sc ON sc.id_subcategoria = u.id_subcategoria
JOIN Producto.Categoria    c  ON c.id_categoria      = sc.id_categoria
JOIN Configuracion.Sede    se ON se.id_sede          = u.id_sede
ORDER BY se.Nombre, c.Nombre, sc.Nombre;
GO
