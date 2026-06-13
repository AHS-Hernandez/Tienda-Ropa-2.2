// =============================================================================
// 02_datos_mongo.js  —  Datos que SON propiedad del módulo Mongo
// Ejecutar:  mongosh "mongodb://localhost:27017" 02_datos_mongo.js
// -----------------------------------------------------------------------------
// Inserta reseñas (Módulo B) y eventos (Módulo C).
//
// RESEÑAS: solo puede reseñar quien compró. Antes de cada insert se verifica
// contra ref_ventas que exista la combinación (id_cliente, id_venta, id_producto).
// Si no existe → la reseña se rechaza y se imprime el motivo.
// Esto simula la validación que en producción hace la capa Next.js contra SQL.
//
// EVENTOS: simulan comportamiento web (vistas, búsquedas, carrito, abandono).
// Los clientes y productos son los reales cargados en el 01.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

db.resenas.deleteMany({});
db.eventos.deleteMany({});

// -----------------------------------------------------------------------------
// Helper: inserta reseña solo si el cliente compró el producto en esa venta.
// -----------------------------------------------------------------------------
function insertarResena(r) {
  const compra = db.ref_ventas.findOne({
    id_venta:   r.id_venta,
    id_cliente: r.id_cliente,
    items:      r.id_producto
  });
  if (!compra) {
    print("RECHAZADA: cliente " + r.id_cliente +
          " no compró producto " + r.id_producto +
          " en venta " + r.id_venta);
    return;
  }
  r.id_sede    = compra.id_sede;
  r.estado     = r.estado     || "publicada";
  r.votos_util = r.votos_util || 0;
  r.fecha      = r.fecha      || new Date();
  db.resenas.insertOne(r);
}

// --- Reseñas válidas (respaldadas por ventas reales) -------------------------

// Luis (id_cliente 4) compró venta 37: productos 1, 3, 2
insertarResena({
  id_producto: 1, id_cliente: 4, id_venta: 37,
  rating: 5,
  titulo: "Excelente calidad",
  texto: "La tela es muy buena, el corte formal perfecto para la oficina.",
  votos_util: 3
});

insertarResena({
  id_producto: 2, id_cliente: 4, id_venta: 37,
  rating: 4,
  titulo: "Cómoda y fresca",
  texto: "Muy agradable para el calor. El color celeste es exacto a la foto."
});

insertarResena({
  id_producto: 3, id_cliente: 4, id_venta: 37,
  rating: 4,
  titulo: "Material suave",
  texto: "El lino es de buena calidad, ideal para verano."
});

// Adriana (id_cliente 3) compró venta 38: productos 2, 3
insertarResena({
  id_producto: 2, id_cliente: 3, id_venta: 38,
  rating: 3,
  titulo: "Regular",
  texto: "El color está bien pero la tela se arruga fácil."
});

insertarResena({
  id_producto: 3, id_cliente: 3, id_venta: 38,
  rating: 5,
  titulo: "La mejor camisa",
  texto: "Ya la compré dos veces, no defrauda.",
  votos_util: 5
});

// Adriana (id_cliente 3) compró venta 39: productos 4, 6
insertarResena({
  id_producto: 4, id_cliente: 3, id_venta: 39,
  rating: 5,
  titulo: "Calce perfecto",
  texto: "El slim queda justo, la tela no se estira de más.",
  votos_util: 2
});

insertarResena({
  id_producto: 6, id_cliente: 3, id_venta: 39,
  rating: 4,
  titulo: "Cuero genuino",
  texto: "La cartera es sólida, los cierres funcionan bien."
});

// Intento RECHAZADO: Luis intenta reseñar Jeans Slim (4) que nunca compró.
insertarResena({
  id_producto: 4, id_cliente: 4, id_venta: 37,
  rating: 1, titulo: "No debería entrar", texto: "Reseña inválida."
});

// -----------------------------------------------------------------------------
// Eventos de comportamiento web (time-series)
// Clientes reales: 4=Luis, 3=Adriana, 5=Maria, 6=Juan, 7=Carlos, 8=Ana
// Productos reales: 1=Camisa Oxford, 2=Camisa Casual, 3=Camisa Lino,
//                   4=Jeans Slim, 5=Zapatilla Runner, 6=Cartera Cuero,
//                   46=Cartera LV, 47=Gorra S
// hace(h) = hace h horas, para que las consultas "últimos 7 días" respondan.
// -----------------------------------------------------------------------------
const ahora = Date.now();
const hace  = (h) => new Date(ahora - h * 3600000);

function ev(ts, id_sede, tipo, id_producto, id_cliente, session_id, payload) {
  return {
    ts,
    meta: { id_sede, tipo, id_producto: id_producto },
    id_cliente,
    session_id,
    payload: payload || {}
  };
}

db.eventos.insertMany([

  // Luis (4, sede 1) — navega camisas y mira jeans
  ev(hace(72), 1, "vista_producto",  1, 4, "s-luis", { categoria: "Ropa", subcategoria: "Camisas" }),
  ev(hace(71), 1, "vista_producto",  2, 4, "s-luis", { categoria: "Ropa", subcategoria: "Camisas" }),
  ev(hace(70), 1, "vista_producto",  4, 4, "s-luis", { categoria: "Ropa", subcategoria: "Pantalones" }),
  ev(hace(69), 1, "vista_producto",  5, 4, "s-luis", { categoria: "Calzado", subcategoria: "Zapatillas" }),
  ev(hace(68), 1, "agregar_carrito", 5, 4, "s-luis", { categoria: "Calzado" }),
  ev(hace(67), 1, "abandono",        5, 4, "s-luis", { categoria: "Calzado" }),
  ev(hace(66), 1, "busqueda",     null, 4, "s-luis", { termino_busqueda: "jean azul", resultados: 2, categoria: "Ropa" }),

  // Adriana (3, sede 1) — mira carteras y accesorios
  ev(hace(50), 1, "vista_producto", 46, 3, "s-adri", { categoria: "Accesorios", subcategoria: "Carteras" }),
  ev(hace(49), 1, "vista_producto", 47, 3, "s-adri", { categoria: "Accesorios", subcategoria: "Gorras" }),
  ev(hace(48), 1, "vista_producto",  5, 3, "s-adri", { categoria: "Calzado",    subcategoria: "Zapatillas" }),
  ev(hace(47), 1, "agregar_carrito",46, 3, "s-adri", { categoria: "Accesorios" }),
  ev(hace(46), 1, "abandono",       46, 3, "s-adri", { categoria: "Accesorios" }),

  // Maria (5, sede 1)
  ev(hace(40), 1, "vista_producto",  1, 5, "s-mari", { categoria: "Ropa",      subcategoria: "Camisas" }),
  ev(hace(39), 1, "vista_producto",  3, 5, "s-mari", { categoria: "Ropa",      subcategoria: "Camisas" }),
  ev(hace(38), 1, "vista_producto", 46, 5, "s-mari", { categoria: "Accesorios", subcategoria: "Carteras" }),
  ev(hace(37), 1, "busqueda",     null, 5, "s-mari", { termino_busqueda: "cartera negra", resultados: 0 }),

  // Juan (6, sede 1)
  ev(hace(30), 1, "vista_producto",  4, 6, "s-juan", { categoria: "Ropa",    subcategoria: "Pantalones" }),
  ev(hace(29), 1, "vista_producto",  5, 6, "s-juan", { categoria: "Calzado", subcategoria: "Zapatillas" }),
  ev(hace(28), 1, "agregar_carrito", 4, 6, "s-juan", { categoria: "Ropa" }),

  // Carlos (7, sede 1)
  ev(hace(20), 1, "vista_producto", 47, 7, "s-carl", { categoria: "Accesorios", subcategoria: "Gorras" }),
  ev(hace(19), 1, "vista_producto",  2, 7, "s-carl", { categoria: "Ropa",       subcategoria: "Camisas" }),
  ev(hace(18), 1, "vista_producto",  4, 7, "s-carl", { categoria: "Ropa",       subcategoria: "Pantalones" }),

  // Ana (8, sede 1)
  ev(hace(10), 1, "vista_producto",  6, 8, "s-ana2", { categoria: "Accesorios", subcategoria: "Carteras" }),
  ev(hace(9),  1, "vista_producto", 46, 8, "s-ana2", { categoria: "Accesorios", subcategoria: "Carteras" }),
  ev(hace(8),  1, "busqueda",     null, 8, "s-ana2", { termino_busqueda: "bolso cuero", resultados: 0 }),

  // Anónimo (sede 1) — sin id_cliente
  ev(hace(5),  1, "vista_producto",  1, null, "s-anon1", { categoria: "Ropa", subcategoria: "Camisas" }),
  ev(hace(4),  1, "vista_producto",  4, null, "s-anon1", { categoria: "Ropa", subcategoria: "Pantalones" }),
  ev(hace(3),  1, "busqueda",     null, null, "s-anon1", { termino_busqueda: "vestido verano", resultados: 0 })
]);

print("== Datos Mongo cargados ==");
print("resenas: " + db.resenas.countDocuments());
print("eventos: " + db.eventos.countDocuments());
