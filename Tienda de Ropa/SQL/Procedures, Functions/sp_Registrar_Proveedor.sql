-- ----------------------------------------------------------------
-- sp_Registrar_Proveedor
-- Registra un nuevo proveedor validando NIT único
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Registrar_Proveedor
    @Razon_social    NVARCHAR(150),
    @Nit             NVARCHAR(50),
    @Contacto_nombre NVARCHAR(100),
    @Telefono        NVARCHAR(50),
    @Email           NVARCHAR(100),
    @Direccion       NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        IF @Email IS NOT NULL AND LEN(@Email) > 0
            AND @Email NOT LIKE '%@%.%'
            RAISERROR('El formato del correo del proveedor no es válido.', 16, 1);
 
        IF @Telefono IS NOT NULL AND LEN(@Telefono) > 0
            AND @Telefono NOT LIKE '%[0-9]%'
            RAISERROR('El teléfono debe contener al menos un número.', 16, 1);
 
        IF EXISTS (SELECT 1 FROM Compras.Proveedor WHERE Nit = @Nit)
            RAISERROR('El NIT ya está registrado.', 16, 1);
 
        INSERT INTO Compras.Proveedor
            (Razon_social, Nit, Contacto_nombre, Telefono, Email, Direccion)
        VALUES
            (@Razon_social, @Nit, @Contacto_nombre, @Telefono, @Email, @Direccion);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;