CREATE SCHEMA Configuracion;
GO
CREATE SCHEMA Persona;
GO
CREATE SCHEMA Seguridad;
GO
CREATE SCHEMA Producto;
GO
CREATE SCHEMA Marketing;
GO
CREATE SCHEMA Compras;  
GO
CREATE SCHEMA Ventas;
GO
CREATE SCHEMA Inventario;
GO

--permite identificar el origen de datos fragmentados
CREATE TABLE Configuracion.Sede (
    id_sede       INT IDENTITY(1,1) PRIMARY KEY,
    Nombre        NVARCHAR(100) NOT NULL,
    Descripcion   NVARCHAR(255),
    IP_Servidor   NVARCHAR(50),
    Es_Central    BIT DEFAULT 0,
    Activa        BIT DEFAULT 1,
    Fecha_registro DATETIME DEFAULT GETDATE()
);

--el DBA sabe qué se sincronizó, cuándo y si hay conflictos
CREATE TABLE Configuracion.Replica_Control (
    id_control       INT IDENTITY(1,1) PRIMARY KEY,
    id_sede          INT NOT NULL,
    Tabla_nombre     NVARCHAR(150) NOT NULL,
    Ultima_sync      DATETIME,
    Registros_sync   INT DEFAULT 0,
    Estado           NVARCHAR(50) DEFAULT 'Pendiente'
        CHECK (Estado IN ('Pendiente', 'Completado', 'Conflicto', 'Error')),
    Detalle_error    NVARCHAR(MAX),
    CONSTRAINT FK_Replica_Sede FOREIGN KEY (id_sede)
        REFERENCES Configuracion.Sede(id_sede)
);

-- SCHEMA Persona 

CREATE TABLE Persona.Persona (
    id_persona     INT IDENTITY(1,1) PRIMARY KEY,
    id_sede        INT NOT NULL,               
    Nombre         NVARCHAR(100) NOT NULL,
    Apellido       NVARCHAR(100) NOT NULL,
    CI             NVARCHAR(50) UNIQUE NOT NULL,
    Telefono       NVARCHAR(50),
    Email          NVARCHAR(100),
    Direccion      NVARCHAR(MAX),
    Fecha_registro DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Persona_Sede FOREIGN KEY (id_sede)
        REFERENCES Configuracion.Sede(id_sede)
);

CREATE TABLE Persona.Empleado (
    id_empleado        INT IDENTITY(1,1) PRIMARY KEY,
    id_persona         INT NOT NULL,
    Fecha_contratacion DATE NOT NULL,
    Salario_base       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Salario_base >= 0),
    CONSTRAINT FK_Empleado_Persona FOREIGN KEY (id_persona)
        REFERENCES Persona.Persona(id_persona)
);

CREATE TABLE Persona.Cliente (
    id_cliente           INT IDENTITY(1,1) PRIMARY KEY,
    id_persona           INT NOT NULL,
    Nit_ci_facturacion   NVARCHAR(50) NOT NULL,
    CONSTRAINT FK_Cliente_Persona FOREIGN KEY (id_persona)
        REFERENCES Persona.Persona(id_persona)
);

-- SCHEMA Seguridad

CREATE TABLE Seguridad.Usuario (
    id_usuario   INT IDENTITY(1,1) PRIMARY KEY,
    id_persona   INT NOT NULL,
    id_sede      INT NOT NULL,               
    Username     NVARCHAR(50) UNIQUE NOT NULL,
    Password     NVARCHAR(255) NOT NULL,
    Nivel_acceso INT NOT NULL CHECK (Nivel_acceso IN (1,2,3,4)),
    Estado       BIT DEFAULT 1,
    CONSTRAINT FK_Usuario_Persona FOREIGN KEY (id_persona)
        REFERENCES Persona.Persona(id_persona),
    CONSTRAINT FK_Usuario_Sede FOREIGN KEY (id_sede)
        REFERENCES Configuracion.Sede(id_sede)
);

CREATE TABLE Seguridad.Bitacora (
    id_log          INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario      INT NOT NULL,
    id_sede         INT NOT NULL,          
    Accion          NVARCHAR(50) NOT NULL
        CHECK (Accion IN ('INSERT','UPDATE','DELETE','LOGIN')),
    Tabla_afectada  NVARCHAR(100) NOT NULL,
    Valor_anterior  NVARCHAR(MAX),
    Valor_nuevo     NVARCHAR(MAX),
    Fecha_hora      DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Bitacora_Usuario FOREIGN KEY (id_usuario)
        REFERENCES Seguridad.Usuario(id_usuario),
    CONSTRAINT FK_Bitacora_Sede FOREIGN KEY (id_sede)
        REFERENCES Configuracion.Sede(id_sede)
);

-- SCHEMA Producto 

CREATE TABLE Producto.Categoria (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre       NVARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Producto.Subcategoria (
    id_subcategoria INT IDENTITY(1,1) PRIMARY KEY,
    id_categoria    INT NOT NULL,
    Nombre          NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_Subcategoria_Categoria FOREIGN KEY (id_categoria)
        REFERENCES Producto.Categoria(id_categoria)
);

CREATE TABLE Producto.Producto (
    id_producto    INT IDENTITY(1,1) PRIMARY KEY,
    id_subcategoria INT NOT NULL,
    Nombre         NVARCHAR(100) NOT NULL,
    Descripcion    NVARCHAR(MAX),
    Marca          NVARCHAR(100),
    Color          NVARCHAR(50),
    Talla          NVARCHAR(50),
    Precio_costo   DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Precio_costo >= 0),
    Precio_venta   DECIMAL(10,2) NOT NULL CHECK (Precio_venta >= 0),
    CONSTRAINT FK_Producto_Subcategoria FOREIGN KEY (id_subcategoria)
        REFERENCES Producto.Subcategoria(id_subcategoria),
    CONSTRAINT CHK_Margen_Ganancia CHECK (Precio_venta >= Precio_costo)
);

-- SCHEMA Marketing 

CREATE TABLE Marketing.Promocion (
    id_promocion INT IDENTITY(1,1) PRIMARY KEY,
    Nombre       NVARCHAR(100) NOT NULL,
    Porcentaje   DECIMAL(5,2) NULL CHECK (Porcentaje > 0 AND Porcentaje <= 100),
    Monto        DECIMAL(10,2) NULL CHECK (Monto > 0),
    Fecha_inicio DATE NOT NULL,
    Fecha_fin    DATE NOT NULL,
    CONSTRAINT CHK_Rango_Fechas CHECK (Fecha_fin >= Fecha_inicio),
    CONSTRAINT CHK_Tipo_Descuento CHECK (
        (Monto IS NOT NULL AND Porcentaje IS NULL) OR
        (Monto IS NULL AND Porcentaje IS NOT NULL))
);

CREATE TABLE Marketing.Promocion_Aplicacion (
    id_aplicacion        INT IDENTITY(1,1) PRIMARY KEY,
    id_promocion         INT NOT NULL,
    id_producto          INT NULL,
    id_categoria         INT NULL,
    id_subcategoria      INT NULL,
    Monto_minimo_compra  DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (Monto_minimo_compra >= 0),
    CONSTRAINT FK_PromoApp_Promocion    FOREIGN KEY (id_promocion)    REFERENCES Marketing.Promocion(id_promocion),
    CONSTRAINT FK_PromoApp_Producto     FOREIGN KEY (id_producto)     REFERENCES Producto.Producto(id_producto),
    CONSTRAINT FK_PromoApp_Categoria    FOREIGN KEY (id_categoria)    REFERENCES Producto.Categoria(id_categoria),
    CONSTRAINT FK_PromoApp_Subcategoria FOREIGN KEY (id_subcategoria) REFERENCES Producto.Subcategoria(id_subcategoria),
    CONSTRAINT CHK_Aplicacion_Exclusiva CHECK (
        (id_producto IS NOT NULL AND id_categoria IS NULL AND id_subcategoria IS NULL) OR
        (id_producto IS NULL AND id_categoria IS NOT NULL AND id_subcategoria IS NULL) OR
        (id_producto IS NULL AND id_categoria IS NULL AND id_subcategoria IS NOT NULL))
);

-- SCHEMA Compras — SOLO EXISTE EN CENTRAL

CREATE TABLE Compras.Proveedor (
    id_proveedor    INT IDENTITY(1,1) PRIMARY KEY,
    Razon_social    NVARCHAR(150) NOT NULL,
    Nit             NVARCHAR(50) UNIQUE NOT NULL,
    Contacto_nombre NVARCHAR(100),
    Telefono        NVARCHAR(50),
    Email           NVARCHAR(100),
    Direccion       NVARCHAR(MAX)
);

CREATE TABLE Compras.Orden_Compra (
    id_compra     INT IDENTITY(1,1) PRIMARY KEY,
    id_proveedor  INT NOT NULL,
    Fecha         DATETIME DEFAULT GETDATE(),
    Estado        NVARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    Total_compra  DECIMAL(10,2) DEFAULT 0 CHECK (Total_compra >= 0),
    CONSTRAINT FK_Compra_Proveedor FOREIGN KEY (id_proveedor)
        REFERENCES Compras.Proveedor(id_proveedor),
    CONSTRAINT CHK_Estado_Compra CHECK (Estado IN ('Pendiente','Recibida','Anulada'))
);

CREATE TABLE Compras.Detalle_Compra (
    id_detalle_compra INT IDENTITY(1,1) PRIMARY KEY,
    id_compra         INT NOT NULL,
    id_producto       INT NOT NULL,
    Cantidad          INT NOT NULL CHECK (Cantidad > 0),
    Costo_unitario    DECIMAL(10,2) NOT NULL CHECK (Costo_unitario >= 0),
    CONSTRAINT FK_DetalleC_Compra   FOREIGN KEY (id_compra)   REFERENCES Compras.Orden_Compra(id_compra),
    CONSTRAINT FK_DetalleC_Producto FOREIGN KEY (id_producto) REFERENCES Producto.Producto(id_producto)
);

-- SCHEMA Ventas e Inventario en Central

CREATE TABLE Ventas.Venta_Cabecera (
    id_venta         INT IDENTITY(1,1) PRIMARY KEY,
    id_sede          INT NOT NULL,           
    Nro_factura      NVARCHAR(50) UNIQUE,
    id_cliente       INT NOT NULL,
    id_usuario       INT NOT NULL,
    Fecha_emision    DATETIME DEFAULT GETDATE(),
    Estado           NVARCHAR(50) NOT NULL DEFAULT 'Borrador',
    Total_bruto      DECIMAL(10,2) DEFAULT 0,
    Total_descuento  DECIMAL(10,2) DEFAULT 0,
    Total_neto       DECIMAL(10,2) DEFAULT 0,
    Metodo_pago      NVARCHAR(50),
    CONSTRAINT FK_Venta_Sede    FOREIGN KEY (id_sede)    REFERENCES Configuracion.Sede(id_sede),
    CONSTRAINT FK_Venta_Cliente FOREIGN KEY (id_cliente) REFERENCES Persona.Cliente(id_cliente),
    CONSTRAINT FK_Venta_Usuario FOREIGN KEY (id_usuario) REFERENCES Seguridad.Usuario(id_usuario),
    CONSTRAINT CHK_Estado_Venta CHECK (Estado IN ('Borrador','Completada','Entregada')),
    CONSTRAINT CHK_Totales_Venta CHECK (Total_bruto >= 0 AND Total_descuento >= 0 AND Total_neto >= 0)
);

CREATE TABLE Ventas.Venta_Detalle (
    id_detalle           INT IDENTITY(1,1) PRIMARY KEY,
    id_venta             INT NOT NULL,
    id_producto          INT NOT NULL,
    id_promocion_aplicada INT NULL,
    Nombre               NVARCHAR(100) NOT NULL,
    Color                NVARCHAR(50),
    Talla                NVARCHAR(50),
    Cantidad             INT NOT NULL CHECK (Cantidad > 0),
    Precio_unitario      DECIMAL(10,2) NOT NULL,
    Subtotal             DECIMAL(10,2) NOT NULL CHECK (Subtotal >= 0),
    CONSTRAINT FK_DetalleV_Venta    FOREIGN KEY (id_venta)   REFERENCES Ventas.Venta_Cabecera(id_venta),
    CONSTRAINT FK_DetalleV_Producto FOREIGN KEY (id_producto) REFERENCES Producto.Producto(id_producto),
    CONSTRAINT FK_DetalleV_Promocion FOREIGN KEY (id_promocion_aplicada) REFERENCES Marketing.Promocion(id_promocion)
);

CREATE TABLE Inventario.Ajuste_Inventario (
    id_ajuste   INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario  INT NOT NULL,
    id_sede     INT NOT NULL,                 
    Tipo_ajuste NVARCHAR(50) NOT NULL
        CHECK (Tipo_ajuste IN ('Robo','Conteo Físico','Dañado','Entrada')),
    Motivo      NVARCHAR(255) NOT NULL,
    Fecha       DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Ajuste_Usuario FOREIGN KEY (id_usuario) REFERENCES Seguridad.Usuario(id_usuario),
    CONSTRAINT FK_Ajuste_Sede    FOREIGN KEY (id_sede)    REFERENCES Configuracion.Sede(id_sede)
);

CREATE TABLE Inventario.Kardex (
    id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_producto   INT NOT NULL,
    id_sede       INT NOT NULL,              
    Cantidad      INT NOT NULL,
    Fecha         DATETIME DEFAULT GETDATE(),
    id_venta      INT NULL,
    id_compra     INT NULL,
    id_ajuste     INT NULL,
    CONSTRAINT FK_Kardex_Producto FOREIGN KEY (id_producto) REFERENCES Producto.Producto(id_producto),
    CONSTRAINT FK_Kardex_Sede     FOREIGN KEY (id_sede)     REFERENCES Configuracion.Sede(id_sede),
    CONSTRAINT FK_Kardex_Venta    FOREIGN KEY (id_venta)    REFERENCES Ventas.Venta_Cabecera(id_venta),
    CONSTRAINT FK_Kardex_Compra   FOREIGN KEY (id_compra)   REFERENCES Compras.Orden_Compra(id_compra),
    CONSTRAINT FK_Kardex_Ajuste   FOREIGN KEY (id_ajuste)   REFERENCES Inventario.Ajuste_Inventario(id_ajuste),
    CONSTRAINT CHK_Cantidad_NoCero CHECK (Cantidad <> 0),
    CONSTRAINT CHK_Integridad_Origen CHECK (
        (id_venta IS NOT NULL AND id_compra IS NULL AND id_ajuste IS NULL) OR
        (id_venta IS NULL AND id_compra IS NOT NULL AND id_ajuste IS NULL) OR
        (id_venta IS NULL AND id_compra IS NULL AND id_ajuste IS NOT NULL))
);

CREATE TABLE Inventario.Stock_Actual (
    id_producto INT NOT NULL,
    id_sede     INT NOT NULL,               
    Cantidad    INT NOT NULL DEFAULT 0 CHECK (Cantidad >= 0),
    CONSTRAINT PK_Stock PRIMARY KEY (id_producto, id_sede),
    CONSTRAINT FK_Stock_Producto FOREIGN KEY (id_producto) REFERENCES Producto.Producto(id_producto),
    CONSTRAINT FK_Stock_Sede     FOREIGN KEY (id_sede)     REFERENCES Configuracion.Sede(id_sede)
);