USE TiendaRopa;
GO

-- =====================================================
-- TRIGGER: Replicar Categoria a Sede
-- =====================================================
CREATE TRIGGER Producto.trg_Replicar_Categoria
ON Producto.Categoria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- DELETE
    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        DELETE FROM SEDE.TiendaRopa.Producto.Categoria
        WHERE id_categoria IN (SELECT id_categoria FROM deleted);
    END

    -- INSERT
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SEDE.TiendaRopa.Producto.Categoria (id_categoria, Nombre)
        SELECT id_categoria, Nombre FROM inserted;
    END

    -- UPDATE
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        UPDATE s
        SET s.Nombre = i.Nombre
        FROM SEDE.TiendaRopa.Producto.Categoria s
        INNER JOIN inserted i ON s.id_categoria = i.id_categoria;
    END
END;
GO

-- =====================================================
-- TRIGGER: Replicar Subcategoria a Sede
-- =====================================================
CREATE TRIGGER Producto.trg_Replicar_Subcategoria
ON Producto.Subcategoria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        DELETE FROM SEDE.TiendaRopa.Producto.Subcategoria
        WHERE id_subcategoria IN (SELECT id_subcategoria FROM deleted);
    END

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SEDE.TiendaRopa.Producto.Subcategoria
            (id_subcategoria, id_categoria, Nombre)
        SELECT id_subcategoria, id_categoria, Nombre FROM inserted;
    END

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        UPDATE s
        SET s.Nombre     = i.Nombre,
            s.id_categoria = i.id_categoria
        FROM SEDE.TiendaRopa.Producto.Subcategoria s
        INNER JOIN inserted i ON s.id_subcategoria = i.id_subcategoria;
    END
END;
GO

-- =====================================================
-- TRIGGER: Replicar Producto a Sede (sin Precio_costo)
-- =====================================================
CREATE TRIGGER Producto.trg_Replicar_Producto
ON Producto.Producto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        DELETE FROM SEDE.TiendaRopa.Producto.Producto
        WHERE id_producto IN (SELECT id_producto FROM deleted);
    END

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SEDE.TiendaRopa.Producto.Producto
            (id_producto, id_subcategoria, Nombre, Descripcion, 
             Marca, Color, Talla, Precio_venta)
        SELECT 
            id_producto, id_subcategoria, Nombre, Descripcion,
            Marca, Color, Talla, Precio_venta
        FROM inserted;
    END

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        UPDATE s
        SET s.id_subcategoria = i.id_subcategoria,
            s.Nombre          = i.Nombre,
            s.Descripcion     = i.Descripcion,
            s.Marca           = i.Marca,
            s.Color           = i.Color,
            s.Talla           = i.Talla,
            s.Precio_venta    = i.Precio_venta
        FROM SEDE.TiendaRopa.Producto.Producto s
        INNER JOIN inserted i ON s.id_producto = i.id_producto;
    END
END;
GO

-- =====================================================
-- TRIGGER: Replicar Promocion a Sede
-- =====================================================
CREATE TRIGGER Marketing.trg_Replicar_Promocion
ON Marketing.Promocion
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        DELETE FROM SEDE.TiendaRopa.Marketing.Promocion
        WHERE id_promocion IN (SELECT id_promocion FROM deleted);
    END

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO SEDE.TiendaRopa.Marketing.Promocion
            (id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin)
        SELECT 
            id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin
        FROM inserted;
    END

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        UPDATE s
        SET s.Nombre      = i.Nombre,
            s.Porcentaje  = i.Porcentaje,
            s.Monto       = i.Monto,
            s.Fecha_inicio = i.Fecha_inicio,
            s.Fecha_fin   = i.Fecha_fin
        FROM SEDE.TiendaRopa.Marketing.Promocion s
        INNER JOIN inserted i ON s.id_promocion = i.id_promocion;
    END
END;
GO