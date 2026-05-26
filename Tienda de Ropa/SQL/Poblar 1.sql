-- ================================================================
-- 6. PERSONA.PERSONA — EMPLEADOS CENTRAL (id_sede=1)
-- ================================================================
INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion) VALUES
(1,'Ana','Gutierrez','1000001','71100001','ana.gutierrez@tienda.com','Av. Arce 100, SCZ'),
(1,'Luis','Mamani','1000002','71100002','luis.mamani@tienda.com','Calle Loayza 200, SCZ'),
(1,'Carmen','Quispe','1000003','71100003','carmen.quispe@tienda.com','Av. Montes 300, SCZ'),
(1,'Jorge','Flores','1000004','71100004','jorge.flores@tienda.com','Calle Comercio 400, SCZ'),
(1,'Rosa','Chura','1000005','71100005','rosa.chura@tienda.com','Av. 6 Agosto 500, SCZ');
GO

-- ================================================================
-- 7. PERSONA.EMPLEADO — CENTRAL
-- ================================================================
INSERT INTO Persona.Empleado (id_persona, Fecha_contratacion, Salario_base) VALUES
(17,'2023-01-15',5000.00),
(18,'2023-03-01',3500.00),
(19,'2023-03-01',3500.00),
(20,'2023-06-15',3500.00),
(21,'2024-01-10',4500.00);
GO

-- ================================================================
-- 8. SEGURIDAD.USUARIO — EMPLEADOS CENTRAL
-- ================================================================
INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado) VALUES
(17,1,'ana.gutierrez@tienda.com','Admin2026!',4,1),
(18,1,'luis.mamani@tienda.com','Vend2026!',2,1),
(19,1,'carmen.quispe@tienda.com','Vend2026!',2,1),
(20,1,'jorge.flores@tienda.com','Vend2026!',2,1),
(21,1,'rosa.chura@tienda.com','Admin2026!',3,1);
GO

-- ================================================================
-- 9. PERSONA.PERSONA — 1000 CLIENTES CENTRAL (id_sede=1)
-- Generados con patron sistematico
-- ================================================================
DECLARE @i INT = 1;
DECLARE @nombres TABLE (n NVARCHAR(50));
DECLARE @apellidos TABLE (a NVARCHAR(50));

INSERT INTO @nombres VALUES
('Maria'),('Juan'),('Carlos'),('Ana'),('Luis'),('Sofia'),('Pedro'),('Rosa'),
('Diego'),('Carmen'),('Roberto'),('Patricia'),('Miguel'),('Lucia'),('Fernando'),
('Claudia'),('Ricardo'),('Valeria'),('Andres'),('Monica'),('Gabriel'),('Silvia'),
('Hector'),('Natalia'),('Alejandro'),('Isabel'),('Marco'),('Daniela'),('Victor'),
('Paola'),('Eduardo'),('Veronica'),('Oscar'),('Gabriela'),('Rodrigo'),('Sandra'),
('Felipe'),('Adriana'),('Mauricio'),('Cristina'),('Sergio'),('Lorena'),('Pablo'),
('Marcela'),('Hernan'),('Fabiola'),('Gustavo'),('Beatriz'),('Nicolas'),('Laura');

INSERT INTO @apellidos VALUES
('Mamani'),('Quispe'),('Gutierrez'),('Flores'),('Chura'),('Lima'),('Condori'),
('Apaza'),('Huanca'),('Mendoza'),('Salazar'),('Rojas'),('Castro'),('Vargas'),
('Morales'),('Jimenez'),('Reyes'),('Cruz'),('Ortiz'),('Ramos'),('Herrera'),
('Torres'),('Ramirez'),('Gonzalez'),('Lopez'),('Martinez'),('Sanchez'),('Perez'),
('Garcia'),('Rodriguez'),('Fernandez'),('Alvarez'),('Romero'),('Soto'),('Rios'),
('Medina'),('Aguilar'),('Vega'),('Castillo'),('Navarro'),('Delgado'),('Mora'),
('Muñoz'),('Ruiz'),('Diaz'),('Fuentes'),('Pena'),('Suarez'),('Calderon'),('Ibarra');

DECLARE @nom NVARCHAR(50), @ape NVARCHAR(50);
DECLARE @nom_count INT = (SELECT COUNT(*) FROM @nombres);
DECLARE @ape_count INT = (SELECT COUNT(*) FROM @apellidos);

WHILE @i <= 1000
BEGIN
    SELECT @nom = n FROM (SELECT n, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) rn FROM @nombres) x WHERE rn = ((@i - 1) % @nom_count) + 1;
    SELECT @ape = a FROM (SELECT a, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) rn FROM @apellidos) x WHERE rn = ((@i - 1) % @ape_count) + 1;

    INSERT INTO Persona.Persona (id_sede, Nombre, Apellido, CI, Telefono, Email, Direccion)
    VALUES (
        1,
        @nom,
        @ape,
        CAST(2000000 + @i AS NVARCHAR(20)),
        CAST(70000000 + @i AS NVARCHAR(20)),
        LOWER(@nom) + '.' + LOWER(@ape) + CAST(@i AS NVARCHAR(10)) + '@gmail.com',
        'Calle ' + CAST(@i AS NVARCHAR(10)) + ' No.' + CAST(@i * 2 AS NVARCHAR(10)) + ', La Paz'
    );
    SET @i = @i + 1;
END;
GO

-- ================================================================
-- 10. PERSONA.CLIENTE — todos los 1000 clientes central
-- Los primeros 5 personas son empleados (id 1-5)
-- Los clientes son personas 6 a 1005
-- ================================================================
DECLARE @p INT = 22;
WHILE @p <= 1021
BEGIN
    INSERT INTO Persona.Cliente (id_persona, Nit_ci_facturacion)
    VALUES (@p, CAST(2000000 + (@p - 5) AS NVARCHAR(20)));
    SET @p = @p + 1;
END;
GO

-- ================================================================
-- 11. SEGURIDAD.USUARIO — clientes central (nivel 1)
-- Solo 200 de los 1000 tienen cuenta web
-- ================================================================
DECLARE @p2 INT = 22;
WHILE @p2 <= 221
BEGIN
    DECLARE @email2 NVARCHAR(100);
    SELECT @email2 = Email FROM Persona.Persona WHERE id_persona = @p2;

    INSERT INTO Seguridad.Usuario (id_persona, id_sede, Username, Password, Nivel_acceso, Estado)
    VALUES (@p2, 1, @email2, 'Cliente2026!', 1, 1);

    SET @p2 = @p2 + 1;
END;
GO
