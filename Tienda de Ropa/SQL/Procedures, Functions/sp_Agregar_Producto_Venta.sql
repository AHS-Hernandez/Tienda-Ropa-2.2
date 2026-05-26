-- ----------------------------------------------------------------
-- sp_Agregar_Producto_Venta
-- Snapshot histórico con motor de marketing integrado
-- ----------------------------------------------------------------
CREATE PROCEDURE Ventas.sp_Agregar_Producto_Venta
    @id_venta   INT,
    @id_producto INT,
    @cantidad    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        DECLARE @estado               NVARCHAR(50);
        DECLARE @stock_actual         INT;
        DECLARE @precio_original      DECIMAL(10,2);
        DECLARE @nombre               NVARCHAR(100);
        DECLARE @color                NVARCHAR(50);
        DECLARE @talla                NVARCHAR(50);
        DECLARE @id_promo_aplicada    INT;
        DECLARE @descuento_unitario   DECIMAL(10,2);
        DECLARE @precio_final         DECIMAL(10,2);
        DECLARE @subtotal_neto        DECIMAL(10,2);
 
        IF @cantidad <= 0
            RAISERROR('La cantidad debe ser mayor a cero.', 16, 1);
 
        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC WITH (UPDLOCK)
        WHERE VC.id_venta = @id_venta;
 
        IF @estado IS NULL
            RAISERROR('La venta especificada no existe.', 16, 1);
 
        IF @estado <> 'Borrador'
            RAISERROR('Solo se pueden agregar productos a ventas en estado Borrador.', 16, 1);
 
        SELECT @stock_actual = SA.Cantidad
        FROM Inventario.Stock_Actual SA
        WHERE SA.id_producto = @id_producto;
 
        IF ISNULL(@stock_actual, 0) < @cantidad
            RAISERROR('Stock insuficiente para este producto.', 16, 1);
 
        SELECT
            @precio_original = P.Precio_venta,
            @nombre          = P.Nombre,
            @color           = P.Color,
            @talla           = P.Talla
        FROM Producto.Producto P
        WHERE P.id_producto = @id_producto;
 
        IF @precio_original IS NULL
            RAISERROR('El producto especificado no existe.', 16, 1);
 
        SELECT
            @id_promo_aplicada  = id_promocion,
            @descuento_unitario = Descuento_Unitario
        FROM Marketing.fn_Calcular_Descuento_Producto(@id_producto, @precio_original);
 
        SET @descuento_unitario = ISNULL(@descuento_unitario, 0);
        SET @precio_final       = @precio_original - @descuento_unitario;
        SET @subtotal_neto      = @precio_final * @cantidad;
 
        INSERT INTO Ventas.Venta_Detalle (
            id_venta, id_producto, id_promocion_aplicada,
            Nombre, Color, Talla,
            Cantidad, Precio_unitario, Subtotal)
        VALUES (
            @id_venta, @id_producto, @id_promo_aplicada,
            @nombre, @color, @talla,
            @cantidad, @precio_final, @subtotal_neto);
 
        UPDATE Ventas.Venta_Cabecera
        SET Total_bruto     = Total_bruto     + (@precio_original * @cantidad),
            Total_descuento = Total_descuento + (@descuento_unitario * @cantidad),
            Total_neto      = Total_neto      + @subtotal_neto
        WHERE id_venta = @id_venta;
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;