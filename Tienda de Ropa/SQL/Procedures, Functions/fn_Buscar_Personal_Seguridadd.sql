-- ----------------------------------------------------------------
-- fn_Buscar_Personal_Seguridad
-- Busca usuarios del sistema por username o nombre
-- ----------------------------------------------------------------
CREATE FUNCTION Seguridad.fn_Buscar_Personal_Seguridad (@texto NVARCHAR(100))
RETURNS TABLE
AS
RETURN
(
    SELECT
        u.id_usuario,
        u.Username,
        p.Nombre,
        p.Apellido
    FROM Seguridad.Usuario u
    INNER JOIN Persona.Persona p ON u.id_persona = p.id_persona
    WHERE u.Username  LIKE '%' + @texto + '%'
       OR p.Nombre    LIKE '%' + @texto + '%'
       OR p.Apellido  LIKE '%' + @texto + '%'
);