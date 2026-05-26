-- ----------------------------------------------------------------
-- sp_Convertir_Persona_En_Cliente
-- Convierte persona existente en cliente sin duplicar registros
-- ----------------------------------------------------------------
CREATE PROCEDURE Persona.sp_Convertir_Persona_En_Cliente
    @id_persona INT,
    @Nit        NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Persona.Cliente WHERE id_persona = @id_persona)
    BEGIN
        INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
        VALUES (@id_persona, @Nit);
    END;
END;