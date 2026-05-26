-- ----------------------------------------------------------------
-- sp_Actualizar_Precios_Producto
-- Actualiza precios de costo y venta (solo Central)
-- ----------------------------------------------------------------
CREATE PROCEDURE Producto.sp_Actualizar_Precios_Producto
    @id_producto  INT,
    @Precio_costo DECIMAL(10,2),
    @Precio_venta DECIMAL(10,2)
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
 
        UPDATE Producto.Producto
        SET
            Precio_costo = @Precio_costo,
            Precio_venta = @Precio_venta
        WHERE id_producto = @id_producto;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el producto especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;