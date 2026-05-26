-- ----------------------------------------------------------------
-- sp_Asignar_Alcance_Promocion
-- Define a qué producto o categoría aplica la campaña (exclusivo)
-- ----------------------------------------------------------------
CREATE PROCEDURE Marketing.sp_Asignar_Alcance_Promocion
    @id_promocion    INT,
    @id_producto     INT           = NULL,
    @id_categoria    INT           = NULL,
    @id_subcategoria INT           = NULL,
    @monto_minimo    DECIMAL(10,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        DECLARE @contador_alcance INT = 0;
 
        IF @id_producto     IS NOT NULL SET @contador_alcance = @contador_alcance + 1;
        IF @id_categoria    IS NOT NULL SET @contador_alcance = @contador_alcance + 1;
        IF @id_subcategoria IS NOT NULL SET @contador_alcance = @contador_alcance + 1;
 
        IF @contador_alcance <> 1
            RAISERROR('El alcance debe apuntar a un Producto, una Categoría o una Subcategoría (solo una opción).', 16, 1);
 
        IF NOT EXISTS (SELECT 1 FROM Marketing.Promocion WHERE id_promocion = @id_promocion)
            RAISERROR('La promoción especificada no existe.', 16, 1);
 
        IF @monto_minimo < 0
            RAISERROR('El monto mínimo de compra no puede ser negativo.', 16, 1);
 
        INSERT INTO Marketing.Promocion_Aplicacion
            (id_promocion, id_producto, id_categoria, id_subcategoria, Monto_minimo_compra)
        VALUES
            (@id_promocion, @id_producto, @id_categoria, @id_subcategoria, @monto_minimo);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;