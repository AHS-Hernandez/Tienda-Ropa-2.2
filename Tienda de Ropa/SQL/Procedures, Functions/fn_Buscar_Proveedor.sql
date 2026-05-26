-- ----------------------------------------------------------------
-- fn_Buscar_Proveedor
-- Busca proveedores por NIT o texto libre
-- ----------------------------------------------------------------
CREATE FUNCTION Compras.fn_Buscar_Proveedor (@texto NVARCHAR(100))
RETURNS TABLE
AS
RETURN
(
    SELECT
        id_proveedor,
        Razon_social,
        Nit,
        Contacto_nombre
    FROM Compras.Proveedor
    WHERE
        (ISNUMERIC(@texto) = 1 AND Nit = @texto)
        OR
        (ISNUMERIC(@texto) = 0 AND (
            Razon_social    LIKE '%' + @texto + '%'
            OR Contacto_nombre LIKE '%' + @texto + '%'
        ))
);