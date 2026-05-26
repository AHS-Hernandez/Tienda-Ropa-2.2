-- Búsqueda de clientes más flexible (nombre, apellido, CI, NIT, email)
USE TiendaRopa;
GO

CREATE OR ALTER FUNCTION Persona.fn_Buscar_Cliente (@texto NVARCHAR(100))
RETURNS TABLE
AS
RETURN
(
    SELECT
        c.id_cliente,
        CONCAT(p.Nombre, ' ', p.Apellido) AS Nombre_completo,
        p.CI,
        c.Nit_ci_facturacion
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p
        ON c.id_persona = p.id_persona
    WHERE
        @texto IS NOT NULL
        AND LEN(LTRIM(RTRIM(@texto))) > 0
        AND (
            p.Nombre LIKE '%' + @texto + '%'
            OR p.Apellido LIKE '%' + @texto + '%'
            OR CONCAT(p.Nombre, ' ', p.Apellido) LIKE '%' + @texto + '%'
            OR p.CI LIKE '%' + @texto + '%'
            OR c.Nit_ci_facturacion LIKE '%' + @texto + '%'
            OR p.Email LIKE '%' + @texto + '%'
        )
);
GO

PRINT 'fn_Buscar_Cliente actualizada.';
GO
