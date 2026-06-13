// =============================================================================
// 01_datos_referencia_sql.js  —  Fixtures que SIMULAN lo que vive en SQL Server
// Ejecutar:  mongosh "mongodb://localhost:27017" 01_datos_referencia_sql.js
// -----------------------------------------------------------------------------
// IMPORTANTE: estas colecciones ref_* NO son parte del módulo Mongo productivo.
// En producción estos datos se consultan a SQL Server (Producto, Cliente,
// Venta_Detalle, Stock_Actual). Aquí existen solo para que el módulo sea
// autocontenido y demostrable SIN tener SQL levantado. La conexión real a SQL
// ocurre en la capa de aplicación (Next.js), no en MongoDB.
//
// Datos tomados directamente de la base SQL del proyecto:
//   Producto.Producto  JOIN  Producto.Subcategoria  JOIN  Producto.Categoria
//   Persona.Cliente    JOIN  Persona.Persona
//   Ventas.Venta_Cabecera  JOIN  Ventas.Venta_Detalle
//
// Sedes:  1 = Central,  2 = Sede
// Sin campo imagen: el sistema no gestiona imágenes de catálogo.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

db.ref_productos.drop();
db.ref_clientes.drop();
db.ref_ventas.drop();

// -----------------------------------------------------------------------------
// Productos — fuente: Producto.Producto JOIN Subcategoria JOIN Categoria
// categoria  = Producto.Categoria.Nombre
// subcategoria = Producto.Subcategoria.Nombre
// stock por sede: tomado de Inventario.Stock_Actual.
// Si no tenés el stock exacto disponible, se pone un valor representativo
// positivo para Central (sede 1); ajustá con un SELECT real cuando conectes.
// -----------------------------------------------------------------------------
db.ref_productos.insertMany([
  {
    id_producto: 1,
    nombre: "Camisa Oxford",
    descripcion: "Camisa formal algodon",
    marca: "Zara",
    color: "Blanco",
    talla: "M",
    precio_venta: 220.00,
    subcategoria: "Camisas",
    categoria: "Ropa",
    stock: { "1": 59, "2": 0 }   // Stock_Actual Central: 59 | Sede: sin fila
  },
  {
    id_producto: 2,
    nombre: "Camisa Casual",
    descripcion: "Camisa manga corta",
    marca: "H&M",
    color: "Celeste",
    talla: "L",
    precio_venta: 180.00,
    subcategoria: "Camisas",
    categoria: "Ropa",
    stock: { "1": 24, "2": 0 }   // Stock_Actual Central: 24
  },
  {
    id_producto: 3,
    nombre: "Camisa Lino",
    descripcion: "Camisa de lino verano",
    marca: "Mango",
    color: "Beige",
    talla: "S",
    precio_venta: 200.00,
    subcategoria: "Camisas",
    categoria: "Ropa",
    stock: { "1": 17, "2": 0 }   // Stock_Actual Central: 17
  },
  {
    id_producto: 4,
    nombre: "Jeans Slim",
    descripcion: "Jean corte slim",
    marca: "Levis",
    color: "Azul",
    talla: "30",
    precio_venta: 290.00,
    subcategoria: "Pantalones",
    categoria: "Ropa",
    stock: { "1": 9, "2": 0 }    // Stock_Actual Central: 9
  },
  {
    id_producto: 5,
    nombre: "Zapatilla Runner",
    descripcion: "Zapatilla para correr",
    marca: "Nike",
    color: "Blanco",
    talla: "42",
    precio_venta: 520.00,
    subcategoria: "Zapatillas",
    categoria: "Calzado",
    stock: { "1": 25, "2": 0 }   // Stock_Actual Central: 25
  },
  {
    id_producto: 6,
    nombre: "Cartera Cuero",
    descripcion: "Cartera de cuero mujer",
    marca: "Coach",
    color: "Marron",
    talla: "U",
    precio_venta: 750.00,
    subcategoria: "Carteras",
    categoria: "Accesorios",
    stock: { "1": 19, "2": 0 }   // Stock_Actual Central: 19
  },
  {
    id_producto: 46,
    nombre: "Cartera LV",
    descripcion: "Elegante",
    marca: "Louis Vuitton",
    color: "Cafe",
    talla: "G",
    precio_venta: 1500.00,
    subcategoria: "Carteras",
    categoria: "Accesorios",
    stock: { "1": 25, "2": 0 }   // Stock_Actual Central: 25
  },
  {
    id_producto: 47,
    nombre: "Gorra S",
    descripcion: "Sintetica",
    marca: "El Camba",
    color: "Azul",
    talla: "P",
    precio_venta: 75.00,
    subcategoria: "Gorras",
    categoria: "Accesorios",
    stock: { "1": 0, "2": 0 }    // Sin fila en Stock_Actual: agotado
  }
]);

// -----------------------------------------------------------------------------
// Clientes — fuente: Persona.Cliente JOIN Persona.Persona
// id_sede = 1 para todos porque los datos que tenés son del nodo Central.
// nombre completo = Nombre + " " + Apellido de Persona.Persona.
// -----------------------------------------------------------------------------
db.ref_clientes.insertMany([
  { id_cliente: 4,  nombre: "Luis Choque Vargas",  id_sede: 1 },
  { id_cliente: 3,  nombre: "Adriana Hernandez",   id_sede: 1 },
  { id_cliente: 5,  nombre: "Maria Mamani",         id_sede: 1 },
  { id_cliente: 6,  nombre: "Juan Quispe",          id_sede: 1 },
  { id_cliente: 7,  nombre: "Carlos Gutierrez",     id_sede: 1 },
  { id_cliente: 8,  nombre: "Ana Flores",           id_sede: 1 },
  { id_cliente: 9,  nombre: "Luis Chura",           id_sede: 1 },
  { id_cliente: 10, nombre: "Sofia Lima",           id_sede: 1 },
  { id_cliente: 11, nombre: "Pedro Condori",        id_sede: 1 },
  { id_cliente: 12, nombre: "Rosa Apaza",           id_sede: 1 }
]);

// -----------------------------------------------------------------------------
// Ventas — fuente: Venta_Cabecera JOIN Venta_Detalle
// items = array de id_producto que aparecen en las líneas de esa venta.
// id_cliente viene de Venta_Cabecera.id_cliente.
// Datos reales de las ventas 37, 38 y 39 del nodo Central.
// -----------------------------------------------------------------------------
db.ref_ventas.insertMany([
  {
    id_venta: 37,
    id_cliente: 4,   // Luis Choque Vargas
    id_sede: 1,
    estado: "Completada",
    items: [1, 3, 2] // Camisa Oxford, Camisa Lino, Camisa Casual
  },
  {
    id_venta: 38,
    id_cliente: 3,   // Adriana Hernandez
    id_sede: 1,
    estado: "Completada",
    items: [2, 3]    // Camisa Casual, Camisa Lino
  },
  {
    id_venta: 39,
    id_cliente: 3,   // Adriana Hernandez (segunda compra)
    id_sede: 1,
    estado: "Completada",
    items: [4, 6]    // Jeans Slim, Cartera Cuero
  }
]);

print("== Fixtures de referencia (SQL real) cargados ==");
print("productos: " + db.ref_productos.countDocuments());
print("clientes:  " + db.ref_clientes.countDocuments());
print("ventas:    " + db.ref_ventas.countDocuments());
