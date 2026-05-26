-- SCHEMA: Persona

CREATE OR ALTER TRIGGER Persona.trg_Bitacora_Persona
ON Persona.Persona
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_usuario INT = TRY_CAST(SESSION_CONTEXT(N'id_usuario') AS INT);

    IF @id_usuario IS NULL
       OR NOT EXISTS (SELECT 1 FROM Seguridad.Usuario WHERE id_usuario = @id_usuario)
        SELECT @id_usuario = MIN(id_usuario) FROM Seguridad.Usuario;

    IF @id_usuario IS NULL
        RETURN;

    -- INSERT
    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        i.id_sede,
        'INSERT',
        'Persona.Persona',
        NULL,
        CONCAT('ID:', i.id_persona, 
               '|Nombre:', i.Nombre, 
               '|Apellido:', i.Apellido)
    FROM inserted i
    LEFT JOIN deleted d ON i.id_persona = d.id_persona
    WHERE d.id_persona IS NULL;

    -- DELETE
    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        d.id_sede,
        'DELETE',
        'Persona.Persona',
        CONCAT('ID:', d.id_persona, 
               '|Nombre:', d.Nombre, 
               '|Apellido:', d.Apellido),
        NULL
    FROM deleted d
    LEFT JOIN inserted i ON d.id_persona = i.id_persona
    WHERE i.id_persona IS NULL;

    -- UPDATE
    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        i.id_sede,
        'UPDATE',
        'Persona.Persona',
        CONCAT('ID:', d.id_persona, 
               '|Nombre:', d.Nombre, 
               '|Apellido:', d.Apellido),
        CONCAT('ID:', i.id_persona, 
               '|Nombre:', i.Nombre, 
               '|Apellido:', i.Apellido)
    FROM inserted i
    INNER JOIN deleted d ON i.id_persona = d.id_persona;
END;
GO

CREATE TRIGGER Persona.trg_Evitar_Doble_Cliente
ON Persona.Cliente
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM Persona.Cliente c
        INNER JOIN inserted i ON c.id_persona = i.id_persona
    )
    BEGIN
        RAISERROR('La persona ya es cliente', 16, 1);
        RETURN;
    END;

    INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
    SELECT id_persona, Nit_ci_facturacion 
    FROM inserted;
END;
GO

-- -------------------------------------
-- SCHEMA: Seguridad
-- -------------------------------------

CREATE TRIGGER Seguridad.trg_Bitacora_Inmutable
ON Seguridad.Bitacora
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('La bitácora es inmutable', 16, 1);
END;
GO

-- SOLO CENTRAL: nivel 4 solo existe aquí
CREATE TRIGGER Seguridad.trg_Blindaje_Superusuario
ON Seguridad.Usuario
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM deleted WHERE Nivel_acceso = 4)
    BEGIN
        RAISERROR('No se puede modificar un superusuario', 16, 1);
        ROLLBACK;
    END;
END;
GO

CREATE TRIGGER Seguridad.trg_Username_Unico
ON Seguridad.Usuario
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM Seguridad.Usuario u
        INNER JOIN inserted i ON u.Username = i.Username
    )
    BEGIN
        RAISERROR('El username ya existe', 16, 1);
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN Persona.Persona p ON i.id_persona = p.id_persona
        WHERE i.Username <> p.Email
    )
    BEGIN
        RAISERROR('El username debe coincidir con el email', 16, 1);
        RETURN;
    END;

    INSERT INTO Seguridad.Usuario
        (id_persona, id_sede, Username, Password, Nivel_acceso)
    SELECT 
        id_persona, id_sede, Username, Password, Nivel_acceso
    FROM inserted;
END;
GO

-- -------------------------------------
-- SCHEMA: Producto
-- Sede no modifica catálogo
-- -------------------------------------

CREATE TRIGGER Producto.trg_Auditoria_Precios
ON Producto.Producto
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_usuario INT = ISNULL(
        CAST(SESSION_CONTEXT(N'id_usuario') AS INT), 1);
    DECLARE @id_sede_central INT;

    SELECT @id_sede_central = id_sede 
    FROM Configuracion.Sede 
    WHERE Es_Central = 1;

    INSERT INTO Seguridad.Bitacora
        (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo)
    SELECT 
        @id_usuario,
        @id_sede_central,
        'UPDATE',
        'Producto.Producto',
        CONCAT('Costo:', d.Precio_costo, '|Venta:', d.Precio_venta),
        CONCAT('Costo:', i.Precio_costo, '|Venta:', i.Precio_venta)
    FROM inserted i
    INNER JOIN deleted d ON i.id_producto = d.id_producto
    WHERE d.Precio_venta <> i.Precio_venta
       OR d.Precio_costo <> i.Precio_costo;
END;
GO

CREATE TRIGGER Producto.trg_Proteccion_Producto
ON Producto.Producto
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM deleted d
        INNER JOIN Inventario.Kardex k ON d.id_producto = k.id_producto
    )
    BEGIN
        RAISERROR('No se puede eliminar producto con historial', 16, 1);
        RETURN;
    END;

    DELETE FROM Producto.Producto
    WHERE id_producto IN (SELECT id_producto FROM deleted);
END;
GO

CREATE TRIGGER Producto.trg_Proteccion_Subcategoria
ON Producto.Subcategoria
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM Producto.Producto p
        INNER JOIN deleted d ON p.id_subcategoria = d.id_subcategoria
    )
    BEGIN
        RAISERROR('No se puede eliminar subcategoría con productos', 16, 1);
        RETURN;
    END;

    DELETE FROM Producto.Subcategoria
    WHERE id_subcategoria IN (SELECT id_subcategoria FROM deleted);
END;
GO

CREATE TRIGGER Producto.trg_Proteccion_Categoria
ON Producto.Categoria
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM Producto.Subcategoria sc
        INNER JOIN deleted d ON sc.id_categoria = d.id_categoria
    )
    BEGIN
        RAISERROR('No se puede eliminar categoría con subcategorías', 16, 1);
        RETURN;
    END;

    DELETE FROM Producto.Categoria
    WHERE id_categoria IN (SELECT id_categoria FROM deleted);
END;
GO

-- -------------------------------------
-- SCHEMA: Inventario
-- -------------------------------------

CREATE TRIGGER Inventario.trg_Ajuste_Inmutabilidad
ON Inventario.Ajuste_Inventario
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('No se puede modificar ni eliminar un ajuste ya procesado.', 16, 1);
END;
GO

CREATE TRIGGER Inventario.trg_Kardex_Inmutabilidad
ON Inventario.Kardex
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Los registros del Kardex son inmutables.', 16, 1);
END;
GO

CREATE TRIGGER Inventario.trg_Kardex_SincronizarStock
ON Inventario.Kardex
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    MERGE Inventario.Stock_Actual AS target
    USING (
        SELECT id_producto, id_sede, Cantidad 
        FROM inserted
    ) AS source
    ON (    target.id_producto = source.id_producto
        AND target.id_sede     = source.id_sede)
    WHEN MATCHED THEN
        UPDATE SET target.Cantidad = target.Cantidad + source.Cantidad
    WHEN NOT MATCHED THEN
        INSERT (id_producto, id_sede, Cantidad)
        VALUES (source.id_producto, source.id_sede, source.Cantidad);
END;
GO

-- -------------------------------------
-- SCHEMA: Compras (SOLO CENTRAL)
-- -------------------------------------

CREATE TRIGGER Compras.trg_DetalleCompra_Proteccion
ON Compras.Detalle_Compra
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 
        FROM Compras.Orden_Compra OC
        INNER JOIN deleted D ON OC.id_compra = D.id_compra
        WHERE OC.Estado IN ('Recibida', 'Anulada')
    )
    BEGIN
        RAISERROR('No se puede alterar detalle de una orden ya procesada.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        DELETE FROM Compras.Detalle_Compra
        WHERE id_detalle_compra IN (
            SELECT id_detalle_compra FROM deleted);
    END
    ELSE
    BEGIN
        UPDATE dc
        SET 
            dc.id_producto    = i.id_producto,
            dc.Cantidad       = i.Cantidad,
            dc.Costo_unitario = i.Costo_unitario
        FROM Compras.Detalle_Compra dc
        INNER JOIN inserted i 
            ON dc.id_detalle_compra = i.id_detalle_compra;
    END
END;
GO

-- -------------------------------------
-- SCHEMA: Ventas
-- -------------------------------------

CREATE TRIGGER Ventas.trg_Venta_Solo_Sede_Propia
ON Ventas.Venta_Cabecera
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id_sede_local INT;

    SELECT @id_sede_local = id_sede
    FROM Configuracion.Sede
    WHERE Es_Central = 1;

    IF @id_sede_local IS NULL
        SELECT TOP 1 @id_sede_local = id_sede
        FROM Configuracion.Sede
        WHERE Activa = 1
        ORDER BY id_sede;

    IF @id_sede_local IS NULL
        RETURN;

    IF EXISTS (
        SELECT 1 FROM inserted
        WHERE id_sede <> @id_sede_local
    )
    BEGIN
        RAISERROR('No puedes registrar ventas de otra sede en este servidor.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO