-- ----------------------------------------------------------------
-- sp_Modificar_Datos_Proveedor
-- Actualiza datos de un proveedor existente
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Modificar_Datos_Proveedor
    @id_proveedor    INT,
    @Razon_social    NVARCHAR(150) = NULL,
    @Contacto_nombre NVARCHAR(100) = NULL,
    @Telefono        NVARCHAR(50)  = NULL,
    @Email           NVARCHAR(100) = NULL,
    @Direccion       NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @Email IS NOT NULL AND LEN(@Email) > 0
            AND @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo del proveedor no es válido.', 16, 1);
 
        IF @Telefono IS NOT NULL AND LEN(@Telefono) > 0
            AND @Telefono NOT LIKE '%[0-9]%'
            RAISERROR('El teléfono debe contener al menos un número.', 16, 1);
 
        UPDATE Compras.Proveedor
        SET
            Razon_social     = ISNULL(@Razon_social,    Razon_social),
            Contacto_nombre  = ISNULL(@Contacto_nombre, Contacto_nombre),
            Telefono         = ISNULL(@Telefono,         Telefono),
            Email            = ISNULL(@Email,            Email),
            Direccion        = ISNULL(@Direccion,        Direccion)
        WHERE id_proveedor = @id_proveedor;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el proveedor especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;