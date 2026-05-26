-- ----------------------------------------------------------------
-- sp_Registrar_Campana
-- Crea cabecera de promoción y devuelve ID generado
-- ----------------------------------------------------------------
CREATE PROCEDURE Marketing.sp_Registrar_Campana
    @nombre                  NVARCHAR(100),
    @porcentaje              DECIMAL(5,2) = NULL,
    @monto                   DECIMAL(10,2) = NULL,
    @fecha_inicio            DATE,
    @fecha_fin               DATE,
    @id_promocion_generado   INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @porcentaje IS NOT NULL AND @monto IS NOT NULL
            RAISERROR('Una promoción no puede tener porcentaje y monto fijo al mismo tiempo.', 16, 1);
 
        IF @porcentaje IS NULL AND @monto IS NULL
            RAISERROR('Debe especificar un tipo de descuento (porcentaje o monto fijo).', 16, 1);
 
        IF @fecha_inicio > @fecha_fin
            RAISERROR('La fecha de inicio no puede ser mayor a la fecha de fin.', 16, 1);
 
        IF @porcentaje IS NOT NULL AND (@porcentaje <= 0 OR @porcentaje > 100)
            RAISERROR('El porcentaje debe ser mayor a 0 y menor o igual a 100.', 16, 1);
 
        IF @monto IS NOT NULL AND @monto <= 0
            RAISERROR('El monto del descuento debe ser mayor a 0.', 16, 1);
 
        INSERT INTO Marketing.Promocion
            (Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin)
        VALUES
            (@nombre, @porcentaje, @monto, @fecha_inicio, @fecha_fin);
 
        SET @id_promocion_generado = SCOPE_IDENTITY();
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;