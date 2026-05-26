-- ----------------------------------------------------------------
-- sp_Emitir_Orden_Compra
-- Genera orden en estado Pendiente con detalles en JSON
-- ----------------------------------------------------------------
CREATE PROCEDURE Compras.sp_Emitir_Orden_Compra
    @id_proveedor  INT,
    @total_compra  DECIMAL(10,2),
    @detalles_json NVARCHAR(MAX)
    -- Ejemplo: '[{"id_producto":1,"cantidad":50,"costo":25.50}]'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
 
        IF @total_compra < 0
            RAISERROR('El total de la compra no puede ser negativo.', 16, 1);
 
        IF NOT EXISTS (SELECT 1 FROM Compras.Proveedor WHERE id_proveedor = @id_proveedor)
            RAISERROR('El proveedor especificado no existe.', 16, 1);
 
        DECLARE @id_compra INT;
 
        INSERT INTO Compras.Orden_Compra
            (id_proveedor, Fecha, Estado, Total_compra)
        VALUES
            (@id_proveedor, GETDATE(), 'Pendiente', @total_compra);
 
        SET @id_compra = SCOPE_IDENTITY();
 
        INSERT INTO Compras.Detalle_Compra
            (id_compra, id_producto, Cantidad, Costo_unitario)
        SELECT
            @id_compra,
            JSON_VALUE(Detalle.value, '$.id_producto'),
            JSON_VALUE(Detalle.value, '$.cantidad'),
            JSON_VALUE(Detalle.value, '$.costo')
        FROM OPENJSON(@detalles_json) AS Detalle;
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;