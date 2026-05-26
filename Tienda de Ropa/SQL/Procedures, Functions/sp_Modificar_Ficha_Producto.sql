-- ----------------------------------------------------------------
-- sp_Modificar_Ficha_Producto
-- Actualiza datos descriptivos del producto (sin precios)
-- ----------------------------------------------------------------
CREATE PROCEDURE Producto.sp_Modificar_Ficha_Producto
    @id_producto INT,
    @Nombre      NVARCHAR(100) = NULL,
    @Descripcion NVARCHAR(MAX) = NULL,
    @Marca       NVARCHAR(100) = NULL,
    @Color       NVARCHAR(50)  = NULL,
    @Talla       NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        UPDATE Producto.Producto
        SET
            Nombre      = ISNULL(@Nombre,      Nombre),
            Descripcion = ISNULL(@Descripcion, Descripcion),
            Marca       = ISNULL(@Marca,       Marca),
            Color       = ISNULL(@Color,       Color),
            Talla       = ISNULL(@Talla,       Talla)
        WHERE id_producto = @id_producto;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el producto especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;