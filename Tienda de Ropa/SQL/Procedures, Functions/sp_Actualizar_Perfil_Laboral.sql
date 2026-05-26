-- ----------------------------------------------------------------
-- sp_Actualizar_Perfil_Laboral
-- Actualiza el salario de un empleado
-- ----------------------------------------------------------------
CREATE PROCEDURE Persona.sp_Actualizar_Perfil_Laboral
    @id_empleado INT,
    @Salario     DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @Salario < 0
            RAISERROR('El salario no puede ser negativo.', 16, 1);
 
        UPDATE Persona.Empleado
        SET Salario_base = @Salario
        WHERE id_empleado = @id_empleado;
 
        IF @@ROWCOUNT = 0
            RAISERROR('No se encontró el empleado especificado.', 16, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;