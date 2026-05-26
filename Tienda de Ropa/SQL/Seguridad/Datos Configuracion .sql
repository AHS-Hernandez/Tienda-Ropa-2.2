INSERT INTO Configuracion.Sede
    (Nombre, Descripcion, IP_Servidor, Es_Central, Activa)
VALUES
    ('Central', 'Servidor principal', '10.224.111.230', 1, 1);

INSERT INTO Configuracion.Sede
    (Nombre, Descripcion, IP_Servidor, Es_Central, Activa)
VALUES
    ('Sede', 'Sucursal', '10.224.111.77', 0, 1);
GO

SELECT * FROM Configuracion.Sede;
GO