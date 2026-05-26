-- ----------------------------------------------------------------
-- sp_Auto_Registro_Web
-- Registra usuario web con nivel básico (1)
-- ----------------------------------------------------------------
CREATE PROCEDURE Seguridad.sp_Auto_Registro_Web
    @id_persona INT,
    @Username   NVARCHAR(50),
    @Password   NVARCHAR(255),
    @id_sede    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
 
        IF @Username NOT LIKE '%@%.%'
            RAISERROR('El username debe ser un correo electrónico válido.', 16, 1);
 
        IF LEN(@Password) < 6
            RAISERROR('La contraseña debe tener al menos 6 caracteres.', 16, 1);
 
        INSERT INTO Seguridad.Usuario
            (id_persona, id_sede, Username, Password, Nivel_acceso)
        VALUES
            (@id_persona, @id_sede, @Username, @Password, 1);
 
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;