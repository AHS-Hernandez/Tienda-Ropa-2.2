-- ----------------------------------------------------------------
-- sp_Agregar_Subcategoria
-- ----------------------------------------------------------------
CREATE PROCEDURE Producto.sp_Agregar_Subcategoria
    @id_categoria INT,
    @Nombre       NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF NOT EXISTS (SELECT 1 FROM Producto.Categoria WHERE id_categoria = @id_categoria)
            RAISERROR('La categoría especificada no existe.', 16, 1);
 
        INSERT INTO Producto.Subcategoria (id_categoria, Nombre)
        VALUES (@id_categoria, @Nombre);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;