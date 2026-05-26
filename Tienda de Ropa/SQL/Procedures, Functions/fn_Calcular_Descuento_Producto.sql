-- ----------------------------------------------------------------
-- fn_Calcular_Descuento_Producto
-- Busca la mejor promoción vigente para un producto
-- Prioridad: Producto > Subcategoría > Categoría
-- ----------------------------------------------------------------
CREATE FUNCTION Marketing.fn_Calcular_Descuento_Producto (
    @p_id_producto  INT,
    @p_precio_venta DECIMAL(10,2)
)
RETURNS TABLE
AS
RETURN (
    SELECT TOP 1
        P.id_promocion,
        CASE
            WHEN P.Porcentaje IS NOT NULL THEN (@p_precio_venta * (P.Porcentaje / 100))
            WHEN P.Monto      IS NOT NULL THEN P.Monto
            ELSE 0
        END AS Descuento_Unitario
    FROM Marketing.Promocion P
    INNER JOIN Marketing.Promocion_Aplicacion PA ON P.id_promocion = PA.id_promocion
    INNER JOIN Producto.Producto PROD ON PROD.id_producto = @p_id_producto
    WHERE
        CAST(GETDATE() AS DATE) BETWEEN P.Fecha_inicio AND P.Fecha_fin
        AND (
            PA.id_producto      = @p_id_producto
            OR PA.id_subcategoria = PROD.id_subcategoria
            OR PA.id_categoria    = (
                SELECT id_categoria
                FROM Producto.Subcategoria
                WHERE id_subcategoria = PROD.id_subcategoria
            )
        )
    ORDER BY
        CASE
            WHEN PA.id_producto     IS NOT NULL THEN 1
            WHEN PA.id_subcategoria IS NOT NULL THEN 2
            ELSE 3
        END ASC
);