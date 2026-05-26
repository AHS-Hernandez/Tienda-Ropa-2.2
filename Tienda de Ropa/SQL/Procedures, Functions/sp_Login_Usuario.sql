-- ----------------------------------------------------------------
-- sp_Login_Usuario
-- Autentica usuario activo y devuelve identidad de aplicación
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Login_Usuario
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
 
    SELECT TOP (1)
        u.id_usuario,
        u.id_persona,
        u.Username,
        CONCAT(p.Nombre, ' ', p.Apellido) AS NombreCompleto,
        u.Nivel_acceso
    FROM Seguridad.Usuario u
    INNER JOIN Persona.Persona p ON p.id_persona = u.id_persona
    WHERE u.Username    = @Username
      AND u.Password    = @Password
      AND u.Estado      = 1
      AND u.Nivel_acceso BETWEEN 1 AND 4;
END;