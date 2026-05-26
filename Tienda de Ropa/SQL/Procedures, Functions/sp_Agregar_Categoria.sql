-- ----------------------------------------------------------------
-- sp_Agregar_Categoria
-- ----------------------------------------------------------------
CREATE PROCEDURE Producto.sp_Agregar_Categoria
    @Nombre NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF EXISTS (SELECT 1 FROM Producto.Categoria WHERE Nombre = @Nombre)
            RAISERROR('Ya existe una categoría con ese nombre.', 16, 1);
 
        INSERT INTO Producto.Categoria (Nombre)
        VALUES (@Nombre);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;