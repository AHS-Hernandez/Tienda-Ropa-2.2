-- ----------------------------------------------------------------
-- sp_Crear_Venta_Borrador
-- Inserta cabecera y devuelve ID generado por OUTPUT
--
-- IMPORTANTE: SET QUOTED_IDENTIFIER ON / ANSI_NULLS ON deben ir ANTES
-- del CREATE, porque SQL Server graba estos settings DENTRO del SP y los
-- usa al ejecutar. La tabla Ventas.Venta_Cabecera tiene un índice filtrado
-- (UIX_VentaCabecera_NroFactura WHERE Nro_factura IS NOT NULL) y cualquier
-- INSERT/UPDATE sobre ella REQUIERE QUOTED_IDENTIFIER ON, o falla con:
--   "UPDATE failed because the following SET options have incorrect
--    settings: 'QUOTED_IDENTIFIER'"
-- ----------------------------------------------------------------
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE Ventas.sp_Crear_Venta_Borrador
    @id_cliente         INT,
    @id_usuario         INT,
    @id_sede            INT,
    @id_venta_generado  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY

        IF NOT EXISTS (SELECT 1 FROM Persona.Cliente WHERE id_cliente = @id_cliente)
            RAISERROR('El cliente especificado no existe.', 16, 1);

        IF NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_usuario = @id_usuario AND Estado = 1)
            RAISERROR('El usuario especificado no existe o está inactivo.', 16, 1);

        INSERT INTO Ventas.Venta_Cabecera
            (id_sede, id_cliente, id_usuario, Fecha_emision, Estado)
        VALUES
            (@id_sede, @id_cliente, @id_usuario, GETDATE(), 'Borrador');

        SET @id_venta_generado = SCOPE_IDENTITY();

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
