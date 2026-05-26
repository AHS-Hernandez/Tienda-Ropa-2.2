-- ----------------------------------------------------------------
-- sp_Obtener_Cliente_Por_Usuario
-- Devuelve el id_cliente asociado a un usuario activo
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Obtener_Cliente_Por_Usuario
    @IdUsuario INT
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
 
    SELECT TOP (1)
        c.id_cliente
    FROM Seguridad.Usuario u
    INNER JOIN Persona.Cliente c ON c.id_persona = u.id_persona
    WHERE u.id_usuario = @IdUsuario
      AND u.Estado     = 1
    ORDER BY c.id_cliente DESC;
END;