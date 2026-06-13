CREATE TABLE Inventario.Stock_Umbral (
    id_umbral       INT IDENTITY(1,1) PRIMARY KEY,
    id_subcategoria INT NOT NULL,
    id_sede         INT NOT NULL,
    Stock_minimo    INT NOT NULL DEFAULT 0 CHECK (Stock_minimo >= 0),
    Fecha_registro  DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Umbral_Subcategoria FOREIGN KEY (id_subcategoria)
        REFERENCES Producto.Subcategoria(id_subcategoria),
    CONSTRAINT FK_Umbral_Sede FOREIGN KEY (id_sede)
        REFERENCES Configuracion.Sede(id_sede),
    CONSTRAINT UQ_Umbral_Subcat_Sede UNIQUE (id_subcategoria, id_sede)
)