-- CATEGORIAS

INSERT INTO Producto.Categoria (Nombre)
VALUES
('Ropa'),
('Calzado'),
('Accesorios'),
('Ropa Deportiva'),
('Ropa Infantil');
GO

-- SUBCATEGORIAS

INSERT INTO Producto.Subcategoria
(
    id_categoria,
    Nombre
)
VALUES
(1,'Camisas'),
(1,'Pantalones'),
(1,'Vestidos'),
(1,'Chaquetas'),
(2,'Zapatillas'),
(2,'Botas'),
(2,'Sandalias'),
(3,'Cinturones'),
(3,'Gorras'),
(3,'Carteras'),
(4,'Shorts Deportivos'),
(4,'Poleras Deportivas'),
(5,'Ropa Bebe'),
(5,'Ropa Nino'),
(5,'Ropa Nina');
GO

-- PRODUCTOS

INSERT INTO Producto.Producto
(
    id_subcategoria,
    Nombre,
    Descripcion,
    Marca,
    Color,
    Talla,
    Precio_costo,
    Precio_venta
)
VALUES
(1,'Camisa Oxford','Camisa formal algodon','Zara','Blanco','M',120,220),
(1,'Camisa Casual','Camisa manga corta','H&M','Celeste','L',90,180),
(1,'Camisa Lino','Camisa de lino verano','Mango','Beige','S',110,200),
(2,'Jeans Slim','Jean corte slim','Levis','Azul','30',150,290),
(5,'Zapatilla Runner','Zapatilla para correr','Nike','Blanco','42',280,520),
(10,'Cartera Cuero','Cartera de cuero mujer','Coach','Marron','U',400,750);
GO

-- PROVEEDORES

INSERT INTO Compras.Proveedor
(
    Razon_social,
    Nit,
    Contacto_nombre,
    Telefono,
    Email,
    Direccion
)
VALUES
(
'Textiles Bolivia SRL',
'100200300',
'Jorge Quispe',
'22341122',
'ventas@textilbolivia.com',
'Av. Montes 123, La Paz'
),
(
'Importadora Sur SA',
'200300400',
'Sandra Lima',
'22451133',
'contacto@importsur.com',
'Calle Junin 45, Cochabamba'
);
GO

-- PROMOCIONES
INSERT INTO Marketing.Promocion
(
    Nombre,
    Porcentaje,
    Monto,
    Fecha_inicio,
    Fecha_fin
)
VALUES
('Descuento Verano',10,NULL,'2026-01-01','2026-03-31'),
('Liquidacion Invierno',15,NULL,'2026-06-01','2026-08-31');
GO

INSERT INTO Marketing.Promocion_Aplicacion
(
    id_promocion,
    id_producto,
    id_categoria,
    id_subcategoria,
    Monto_minimo_compra
)
VALUES
(1,NULL,1,NULL,0),
(2,NULL,NULL,4,0);
GO

-- USUARIOS DE PRUEBA (Username = Email; contraseña Abc123!)
DECLARE @p_owner INT, @p_admin INT, @p_cliente INT;
DECLARE @id_cliente INT, @id_usuario_admin INT;

INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
VALUES (1, 'Owner', 'La Santa Cruz', '7012345', '70000001', 'owner@test.com', 'La Paz');
SET @p_owner = SCOPE_IDENTITY();
INSERT INTO Persona.Empleado (id_persona, Fecha_contratacion, Salario_base)
VALUES (@p_owner, '2020-01-01', 12000);
INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
VALUES (@p_owner, 1, 'owner@test.com', 'Abc123!', 4, 1);
GO

DECLARE @p_admin INT;
INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
VALUES (1, 'Admin', 'Sede Central', '7123456', '70000002', 'admin@test.com', 'La Paz');
SET @p_admin = SCOPE_IDENTITY();
INSERT INTO Persona.Empleado (id_persona, Fecha_contratacion, Salario_base)
VALUES (@p_admin, '2021-06-01', 8000);
INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
VALUES (@p_admin, 1, 'admin@test.com', 'Abc123!', 3, 1);
GO

DECLARE @p_cliente INT;
INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
VALUES (1, 'Cliente', 'Web Demo', '9345678', '74567890', 'cliente@test.com', 'La Paz');
SET @p_cliente = SCOPE_IDENTITY();
INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
VALUES (@p_cliente, '987654321');
INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
VALUES (@p_cliente, 1, 'cliente@test.com', 'Abc123!', 1, 1);
GO

-- VENTA DE EJEMPLO (completada)
DECLARE @id_cliente_demo INT = (
    SELECT TOP 1 c.id_cliente
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p ON p.id_persona = c.id_persona
    WHERE p.Email = 'cliente@test.com'
);
DECLARE @id_usuario_admin_demo INT = (
    SELECT TOP 1 id_usuario FROM Seguridad.Usuario WHERE Username = 'admin@test.com'
);

IF @id_cliente_demo IS NOT NULL AND @id_usuario_admin_demo IS NOT NULL
BEGIN
    INSERT INTO Ventas.Venta_Cabecera
    (id_sede, Nro_factura, id_cliente, id_usuario, Fecha_emision, Estado, Total_bruto, Total_descuento, Total_neto, Metodo_pago)
    VALUES (1, 'C-FAC-00001', @id_cliente_demo, @id_usuario_admin_demo, GETDATE(), 'Completada', 520, 20, 500, 'QR');

    DECLARE @id_venta_demo INT = SCOPE_IDENTITY();

    INSERT INTO Ventas.Venta_Detalle
    (id_venta, id_producto, id_promocion_aplicada, Nombre, Color, Talla, Cantidad, Precio_unitario, Subtotal)
    VALUES (@id_venta_demo, 1, NULL, 'Camisa Oxford', 'Blanco', 'M', 2, 220, 440);
END
GO

-- STOCK sede 1 (producto 6 agotado = 0)
MERGE Inventario.Stock_Actual AS t
USING (
    SELECT 1 AS id_producto, 1 AS id_sede, 50 AS Cantidad UNION ALL
    SELECT 2, 1, 35 UNION ALL
    SELECT 3, 1, 20 UNION ALL
    SELECT 4, 1, 8 UNION ALL
    SELECT 5, 1, 3 UNION ALL
    SELECT 6, 1, 0
) AS s ON t.id_producto = s.id_producto AND t.id_sede = s.id_sede
WHEN MATCHED THEN
    UPDATE SET Cantidad = s.Cantidad
WHEN NOT MATCHED THEN
    INSERT (id_producto, id_sede, Cantidad) VALUES (s.id_producto, s.id_sede, s.Cantidad);
GO

-- BITACORA
DECLARE @id_u_owner INT = (SELECT id_usuario FROM Seguridad.Usuario WHERE Username = 'owner@test.com');

IF @id_u_owner IS NOT NULL
BEGIN
    INSERT INTO Seguridad.Bitacora (id_usuario, id_sede, Accion, Tabla_afectada, Valor_anterior, Valor_nuevo, Fecha_hora)
    VALUES (@id_u_owner, 1, 'LOGIN', 'Seguridad.Usuario', NULL, NULL, GETDATE());
END
GO