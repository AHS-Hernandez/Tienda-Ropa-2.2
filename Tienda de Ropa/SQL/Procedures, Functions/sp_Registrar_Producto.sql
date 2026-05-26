-- ----------------------------------------------------------------
-- sp_Registrar_Producto
-- Registra producto con precio de costo (solo Central lo conoce)
-- ----------------------------------------------------------------
CREATE PROCEDURE Producto.sp_Registrar_Producto
    @id_subcategoria INT,
    @Nombre          NVARCHAR(100),
    @Descripcion     NVARCHAR(MAX),
    @Marca           NVARCHAR(100),
    @Color           NVARCHAR(50),
    @Talla           NVARCHAR(50),
    @Precio_costo    DECIMAL(10,2),
    @Precio_venta    DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @Precio_costo < 0
            RAISERROR('El precio de costo no puede ser negativo.', 16, 1);
 
        IF @Precio_venta < 0
            RAISERROR('El precio de venta no puede ser negativo.', 16, 1);
 
        IF @Precio_venta < @Precio_costo
            RAISERROR('El precio de venta no puede ser menor al precio de costo.', 16, 1);
 
        IF NOT EXISTS (SELECT 1 FROM Producto.Subcategoria WHERE id_subcategoria = @id_subcategoria)
            RAISERROR('La subcategoría especificada no existe.', 16, 1);
 
        INSERT INTO Producto.Producto
            (id_subcategoria, Nombre, Descripcion, Marca, Color, Talla, Precio_costo, Precio_venta)
        VALUES
            (@id_subcategoria, @Nombre, @Descripcion, @Marca, @Color, @Talla, @Precio_costo, @Precio_venta);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;