-- ================================================================
-- sp_Transferir_Stock
-- Mueve stock desde Central hacia una Sede (o entre sedes).
-- Inserta dos movimientos en Kardex: uno negativo en origen
-- y uno positivo en destino, usando un Ajuste_Inventario5
-- ================================================================
CREATE PROCEDURE Inventario.sp_Transferir_Stock
    @id_usuario      INT,
    @id_producto     INT,
    @id_sede_origen  INT,
    @id_sede_destino INT,
    @cantidad        INT
AS
BEGIN
    SET NOCOUNT ON;
 
    IF @cantidad <= 0
        RAISERROR('La cantidad a transferir debe ser mayor a cero.', 16, 1);
 
    IF @id_sede_origen = @id_sede_destino
        RAISERROR('La sede de origen y destino no pueden ser la misma.', 16, 1);
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        -- Verificar stock disponible en origen
        DECLARE @stock_origen INT;
 
        SELECT @stock_origen = SA.Cantidad
        FROM Inventario.Stock_Actual SA
        WHERE SA.id_producto = @id_producto
          AND SA.id_sede     = @id_sede_origen;
 
        IF ISNULL(@stock_origen, 0) < @cantidad
            RAISERROR('Stock insuficiente en la sede de origen para realizar la transferencia.', 16, 1);
 
        -- Ajuste de salida en origen
        DECLARE @id_ajuste_salida INT;
 
        INSERT INTO Inventario.Ajuste_Inventario
            (id_usuario, id_sede, Tipo_ajuste, Motivo, Fecha)
        VALUES
            (@id_usuario, @id_sede_origen, 'Entrada',
             'Transferencia salida hacia sede ' + CAST(@id_sede_destino AS NVARCHAR),
             GETDATE());
 
        SET @id_ajuste_salida = SCOPE_IDENTITY();
 
        INSERT INTO Inventario.Kardex
            (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
        VALUES
            (@id_producto, @id_sede_origen, (@cantidad * -1), GETDATE(), NULL, NULL, @id_ajuste_salida);
 
        -- Ajuste de entrada en destino
        DECLARE @id_ajuste_entrada INT;
 
        INSERT INTO Inventario.Ajuste_Inventario
            (id_usuario, id_sede, Tipo_ajuste, Motivo, Fecha)
        VALUES
            (@id_usuario, @id_sede_destino, 'Entrada',
             'Transferencia entrada desde sede ' + CAST(@id_sede_origen AS NVARCHAR),
             GETDATE());
 
        SET @id_ajuste_entrada = SCOPE_IDENTITY();
 
        INSERT INTO Inventario.Kardex
            (id_producto, id_sede, Cantidad, Fecha, id_venta, id_compra, id_ajuste)
        VALUES
            (@id_producto, @id_sede_destino, @cantidad, GETDATE(), NULL, NULL, @id_ajuste_entrada);
 
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;