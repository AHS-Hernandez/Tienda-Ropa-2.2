USE TiendaRopa;
GO

CREATE OR ALTER PROCEDURE Configuracion.sp_Procesar_Cola_Replicacion
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @id      INT,
            @tabla   VARCHAR(100),
            @op      CHAR(1),
            @payload NVARCHAR(MAX);

    SELECT TOP 1
        @id = id_cola, @tabla = tabla,
        @op = operacion, @payload = payload
    FROM Configuracion.Cola_Replicacion
    WHERE procesado = 0
    ORDER BY id_cola;

    WHILE @id IS NOT NULL
    BEGIN
        BEGIN TRY

            -- ------------------------------------------------
            -- Producto.Categoria
            -- ------------------------------------------------
            IF @tabla = 'Producto.Categoria' AND @op = 'I'
                INSERT INTO SEDE.TiendaRopa.Producto.Categoria (id_categoria, Nombre)
                SELECT id_categoria, Nombre FROM OPENJSON(@payload) WITH (
                    id_categoria INT, Nombre NVARCHAR(200));

            IF @tabla = 'Producto.Categoria' AND @op = 'U'
                UPDATE s SET s.Nombre = j.Nombre
                FROM SEDE.TiendaRopa.Producto.Categoria s
                JOIN (SELECT id_categoria, Nombre FROM OPENJSON(@payload) WITH (
                    id_categoria INT, Nombre NVARCHAR(200))) j ON s.id_categoria = j.id_categoria;

            IF @tabla = 'Producto.Categoria' AND @op = 'D'
                DELETE FROM SEDE.TiendaRopa.Producto.Categoria
                WHERE id_categoria IN (SELECT id_categoria FROM OPENJSON(@payload) WITH (id_categoria INT));

            -- ------------------------------------------------
            -- Producto.Subcategoria
            -- ------------------------------------------------
            IF @tabla = 'Producto.Subcategoria' AND @op = 'I'
                INSERT INTO SEDE.TiendaRopa.Producto.Subcategoria (id_subcategoria, id_categoria, Nombre)
                SELECT id_subcategoria, id_categoria, Nombre FROM OPENJSON(@payload) WITH (
                    id_subcategoria INT, id_categoria INT, Nombre NVARCHAR(200));

            IF @tabla = 'Producto.Subcategoria' AND @op = 'U'
                UPDATE s SET s.Nombre = j.Nombre, s.id_categoria = j.id_categoria
                FROM SEDE.TiendaRopa.Producto.Subcategoria s
                JOIN (SELECT id_subcategoria, id_categoria, Nombre FROM OPENJSON(@payload) WITH (
                    id_subcategoria INT, id_categoria INT, Nombre NVARCHAR(200))) j ON s.id_subcategoria = j.id_subcategoria;

            IF @tabla = 'Producto.Subcategoria' AND @op = 'D'
                DELETE FROM SEDE.TiendaRopa.Producto.Subcategoria
                WHERE id_subcategoria IN (SELECT id_subcategoria FROM OPENJSON(@payload) WITH (id_subcategoria INT));

            -- ------------------------------------------------
            -- Producto.Producto
            -- ------------------------------------------------
            IF @tabla = 'Producto.Producto' AND @op = 'I'
                INSERT INTO SEDE.TiendaRopa.Producto.Producto
                    (id_producto, id_subcategoria, Nombre, Descripcion, Marca, Color, Talla, Precio_venta)
                SELECT id_producto, id_subcategoria, Nombre, Descripcion, Marca, Color, Talla, Precio_venta
                FROM OPENJSON(@payload) WITH (
                    id_producto INT, id_subcategoria INT, Nombre NVARCHAR(200),
                    Descripcion NVARCHAR(500), Marca NVARCHAR(100),
                    Color NVARCHAR(50), Talla NVARCHAR(20), Precio_venta DECIMAL(18,2));

            IF @tabla = 'Producto.Producto' AND @op = 'U'
                UPDATE s SET
                    s.id_subcategoria = j.id_subcategoria, s.Nombre = j.Nombre,
                    s.Descripcion = j.Descripcion, s.Marca = j.Marca,
                    s.Color = j.Color, s.Talla = j.Talla, s.Precio_venta = j.Precio_venta
                FROM SEDE.TiendaRopa.Producto.Producto s
                JOIN (SELECT id_producto, id_subcategoria, Nombre, Descripcion,
                             Marca, Color, Talla, Precio_venta
                      FROM OPENJSON(@payload) WITH (
                          id_producto INT, id_subcategoria INT, Nombre NVARCHAR(200),
                          Descripcion NVARCHAR(500), Marca NVARCHAR(100),
                          Color NVARCHAR(50), Talla NVARCHAR(20), Precio_venta DECIMAL(18,2))) j ON s.id_producto = j.id_producto;

            IF @tabla = 'Producto.Producto' AND @op = 'D'
                DELETE FROM SEDE.TiendaRopa.Producto.Producto
                WHERE id_producto IN (SELECT id_producto FROM OPENJSON(@payload) WITH (id_producto INT));

            -- ------------------------------------------------
            -- Marketing.Promocion
            -- ------------------------------------------------
            IF @tabla = 'Marketing.Promocion' AND @op = 'I'
                INSERT INTO SEDE.TiendaRopa.Marketing.Promocion
                    (id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin)
                SELECT id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin
                FROM OPENJSON(@payload) WITH (
                    id_promocion INT, Nombre NVARCHAR(200),
                    Porcentaje DECIMAL(5,2), Monto DECIMAL(18,2),
                    Fecha_inicio DATE, Fecha_fin DATE);

            IF @tabla = 'Marketing.Promocion' AND @op = 'U'
                UPDATE s SET
                    s.Nombre = j.Nombre, s.Porcentaje = j.Porcentaje,
                    s.Monto = j.Monto, s.Fecha_inicio = j.Fecha_inicio, s.Fecha_fin = j.Fecha_fin
                FROM SEDE.TiendaRopa.Marketing.Promocion s
                JOIN (SELECT id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin
                      FROM OPENJSON(@payload) WITH (
                          id_promocion INT, Nombre NVARCHAR(200),
                          Porcentaje DECIMAL(5,2), Monto DECIMAL(18,2),
                          Fecha_inicio DATE, Fecha_fin DATE)) j ON s.id_promocion = j.id_promocion;

            IF @tabla = 'Marketing.Promocion' AND @op = 'D'
                DELETE FROM SEDE.TiendaRopa.Marketing.Promocion
                WHERE id_promocion IN (SELECT id_promocion FROM OPENJSON(@payload) WITH (id_promocion INT));

            -- ------------------------------------------------
            -- Marketing.Promocion_Aplicacion
            -- ------------------------------------------------
            IF @tabla = 'Marketing.Promocion_Aplicacion' AND @op = 'I'
                INSERT INTO SEDE.TiendaRopa.Marketing.Promocion_Aplicacion
                    (id_promocion, id_producto, id_categoria, id_subcategoria, Monto_minimo_compra)
                SELECT id_promocion, id_producto, id_categoria, id_subcategoria, Monto_minimo_compra
                FROM OPENJSON(@payload) WITH (
                    id_promocion INT, id_producto INT,
                    id_categoria INT, id_subcategoria INT,
                    Monto_minimo_compra DECIMAL(18,2));

            IF @tabla = 'Marketing.Promocion_Aplicacion' AND @op = 'U'
                UPDATE s SET
                    s.id_promocion = j.id_promocion,
                    s.id_producto = j.id_producto,
                    s.id_categoria = j.id_categoria,
                    s.id_subcategoria = j.id_subcategoria,
                    s.Monto_minimo_compra = j.Monto_minimo_compra
                FROM SEDE.TiendaRopa.Marketing.Promocion_Aplicacion s
                JOIN (SELECT id_aplicacion, id_promocion, id_producto,
                             id_categoria, id_subcategoria, Monto_minimo_compra
                      FROM OPENJSON(@payload) WITH (
                          id_aplicacion INT, id_promocion INT, id_producto INT,
                          id_categoria INT, id_subcategoria INT,
                          Monto_minimo_compra DECIMAL(18,2))) j ON s.id_aplicacion = j.id_aplicacion;

            IF @tabla = 'Marketing.Promocion_Aplicacion' AND @op = 'D'
                DELETE FROM SEDE.TiendaRopa.Marketing.Promocion_Aplicacion
                WHERE id_aplicacion IN (SELECT id_aplicacion FROM OPENJSON(@payload) WITH (id_aplicacion INT));

            -- Marcar procesado
            UPDATE Configuracion.Cola_Replicacion
            SET procesado = 1, fecha_procesado = GETDATE()
            WHERE id_cola = @id;

        END TRY
        BEGIN CATCH
            UPDATE Configuracion.Cola_Replicacion
            SET error = LEFT(ERROR_MESSAGE(), 500)
            WHERE id_cola = @id;
        END CATCH

        SET @id = NULL;
        SELECT TOP 1
            @id = id_cola, @tabla = tabla,
            @op = operacion, @payload = payload
        FROM Configuracion.Cola_Replicacion
        WHERE procesado = 0
        ORDER BY id_cola;
    END
END;
GO