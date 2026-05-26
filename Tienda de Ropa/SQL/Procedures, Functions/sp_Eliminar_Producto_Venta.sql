-- ================================================================
-- sp_Eliminar_Producto_Venta
-- Quita una línea de detalle de una venta en estado Borrador
-- y revierte los totales de la cabecera.
-- ================================================================
CREATE PROCEDURE Ventas.sp_Eliminar_Producto_Venta
    @id_detalle INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @id_venta           INT;
        DECLARE @estado             NVARCHAR(50);
        DECLARE @precio_unitario    DECIMAL(10,2);
        DECLARE @cantidad           INT;
        DECLARE @subtotal           DECIMAL(10,2);
        DECLARE @precio_original    DECIMAL(10,2);
        DECLARE @descuento_linea    DECIMAL(10,2);
 
        SELECT
            @id_venta        = VD.id_venta,
            @precio_unitario = VD.Precio_unitario,
            @cantidad        = VD.Cantidad,
            @subtotal        = VD.Subtotal
        FROM Ventas.Venta_Detalle VD
        WHERE VD.id_detalle = @id_detalle;
 
        IF @id_venta IS NULL
            RAISERROR('El detalle de venta especificado no existe.', 16, 1);
 
        SELECT @estado = VC.Estado
        FROM Ventas.Venta_Cabecera VC WITH (UPDLOCK)
        WHERE VC.id_venta = @id_venta;
 
        IF @estado <> 'Borrador'
            RAISERROR('Solo se pueden eliminar productos de ventas en estado Borrador.', 16, 1);
 
        
        SELECT @precio_original = P.Precio_venta
        FROM Ventas.Venta_Detalle VD
        INNER JOIN Producto.Producto P ON P.id_producto = VD.id_producto
        WHERE VD.id_detalle = @id_detalle;
 
        SET @descuento_linea = (@precio_original - @precio_unitario) * @cantidad;
 
        DELETE FROM Ventas.Venta_Detalle
        WHERE id_detalle = @id_detalle;
 
        -- Revertir totales en la cabecera
        UPDATE Ventas.Venta_Cabecera
        SET Total_bruto     = Total_bruto     - (@precio_original * @cantidad),
            Total_descuento = Total_descuento - @descuento_linea,
            Total_neto      = Total_neto      - @subtotal
        WHERE id_venta = @id_venta;
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;