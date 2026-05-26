-- ----------------------------------------------------------------
-- sp_Modificar_Cliente
-- Actualiza datos de Persona y Cliente (campos opcionales)
-- ----------------------------------------------------------------
CREATE PROCEDURE Persona.sp_Modificar_Cliente
    @id_cliente INT,
    @Telefono   NVARCHAR(50)   = NULL,
    @Email      NVARCHAR(100)  = NULL,
    @Direccion  NVARCHAR(MAX)  = NULL,
    @Nit        NVARCHAR(50)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        -- Validar email si se está modificando
        IF @Email IS NOT NULL AND @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo electrónico no es válido.', 16, 1);
 
        -- Validar teléfono si se está modificando
        IF @Telefono IS NOT NULL AND LEN(@Telefono) > 0
            AND @Telefono NOT LIKE '%[0-9]%'
            RAISERROR('El teléfono debe contener al menos un número.', 16, 1);
 
        UPDATE p
        SET
            Telefono  = ISNULL(@Telefono,  p.Telefono),
            Email     = ISNULL(@Email,     p.Email),
            Direccion = ISNULL(@Direccion, p.Direccion)
        FROM Persona.Persona p
        INNER JOIN Persona.Cliente c ON p.id_persona = c.id_persona
        WHERE c.id_cliente = @id_cliente;
 
        UPDATE Persona.Cliente
        SET Nit_ci_facturacion = ISNULL(@Nit, Nit_ci_facturacion)
        WHERE id_cliente = @id_cliente;
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO