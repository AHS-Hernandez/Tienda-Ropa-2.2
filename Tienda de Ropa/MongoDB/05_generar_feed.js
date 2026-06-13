// =============================================================================
// 05_generar_feed.js  —  Módulo C, capa 2: generación del feed personalizado
// Ejecutar:  mongosh "mongodb://localhost:27017" 05_generar_feed.js
// -----------------------------------------------------------------------------
// Construye un documento materializado por cliente en feed_cliente combinando
// 4 señales, cada una con su justificación. Aplica dos reglas de negocio que en
// producción cruzan a SQL (aquí contra ref_* que lo simula):
//   - no recomendar lo ya comprado
//   - no recomendar lo agotado en la sede del cliente
//
// Patrón = vista materializada (como Stock_Actual): el "job" lee el log (eventos)
// y deja el resultado listo para lectura instantánea.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// Pesos por señal: a mayor intención de compra, mayor peso.
const PESO = {
  vistos_no_comprados: 1.0, // intención directa: lo miró y no lo compró
  co_visitacion:       0.8, // descubrimiento por comportamiento de pares
  categoria_afin:      0.6, // afinidad declarada por sus propias vistas
  trending_sede:       0.4  // contexto local
};

function generarFeed(idCliente) {
  const cli = db.ref_clientes.findOne({ id_cliente: idCliente });
  if (!cli) { print(`Cliente ${idCliente} no existe`); return; }
  const sede = cli.id_sede;

  // --- Comprados (simula SQL Venta_Detalle) ---
  const compraAgg = db.ref_ventas.aggregate([
    { $match: { id_cliente: idCliente } },
    { $unwind: "$items" },
    { $group: { _id: null, ids: { $addToSet: "$items" } } }
  ]).toArray();
  const comprados = compraAgg.length ? compraAgg[0].ids : [];

  // --- Vistos por el cliente ---
  const vistos = db.eventos
    .distinct("meta.id_producto", { id_cliente: idCliente, "meta.tipo": "vista_producto" })
    .filter(x => x != null);

  // Conjunto a excluir de TODAS las señales: lo que ya vio o ya compró.
  const excluir = Array.from(new Set([...vistos, ...comprados]));

  const candidatos = []; // { id_producto, score, fuente, motivo }

  // === SEÑAL 1: vistos no comprados (recencia / intención) ===================
  vistos.filter(id => !comprados.includes(id)).forEach(id => {
    candidatos.push({ id_producto: id, score: PESO.vistos_no_comprados,
      fuente: "vistos_no_comprados", motivo: "Porque lo viste y aún no lo compraste" });
  });

  // === SEÑAL 2: categoría afín (contenido) ===================================
  const topCat = db.eventos.aggregate([
    { $match: { id_cliente: idCliente, "meta.tipo": "vista_producto", "payload.categoria": { $ne: null } } },
    { $group: { _id: "$payload.categoria", n: { $sum: 1 } } },
    { $sort: { n: -1 } }, { $limit: 1 }
  ]).toArray();
  if (topCat.length) {
    const cat = topCat[0]._id;
    db.ref_productos.find({ categoria: cat, id_producto: { $nin: excluir } })
      .limit(5).forEach(p => {
        candidatos.push({ id_producto: p.id_producto, score: PESO.categoria_afin,
          fuente: "categoria_afin", motivo: `Porque te interesa la categoría ${cat}` });
      });
  }

  // === SEÑAL 3: co-visitación (colaborativa, en 2 pasos robustos) =============
  // Paso A: otros clientes que vieron alguno de los productos que vio el cliente.
  const otrosClientes = db.eventos.distinct("id_cliente", {
    "meta.tipo": "vista_producto",
    "meta.id_producto": { $in: vistos },
    id_cliente: { $nin: [null, idCliente] }
  });
  // Paso B: qué OTROS productos vieron esos clientes (excluyendo lo del cliente).
  if (otrosClientes.length) {
    db.eventos.aggregate([
      { $match: {
          id_cliente: { $in: otrosClientes },
          "meta.tipo": "vista_producto",
          "meta.id_producto": { $nin: excluir }
      }},
      { $group: { _id: "$meta.id_producto", co: { $sum: 1 } } },
      { $sort: { co: -1 } }, { $limit: 5 }
    ]).toArray().forEach(r => {
      candidatos.push({ id_producto: r._id, score: PESO.co_visitacion,
        fuente: "co_visitacion", motivo: "Quienes vieron lo mismo que tú también vieron esto" });
    });
  }

  // === SEÑAL 4: tendencia en su sede (contexto local, 7 días) ================
  db.eventos.aggregate([
    { $match: {
        "meta.id_sede": sede, "meta.tipo": "vista_producto",
        "meta.id_producto": { $nin: excluir },
        ts: { $gte: new Date(Date.now() - 7 * 86400000) }
    }},
    { $group: { _id: "$meta.id_producto", n: { $sum: 1 } } },
    { $sort: { n: -1 } }, { $limit: 5 }
  ]).toArray().forEach(r => {
    candidatos.push({ id_producto: r._id, score: PESO.trending_sede,
      fuente: "trending_sede", motivo: "Tendencia en tu sede" });
  });

  // --- Dedupe quedándose con el mayor score por producto ---
  const mejor = new Map();
  candidatos.forEach(c => {
    const prev = mejor.get(c.id_producto);
    if (!prev || c.score > prev.score) mejor.set(c.id_producto, c);
  });

  // --- Enriquecer + REGLA de stock local + armar recomendaciones ---
  const recomendaciones = [];
  mejor.forEach(c => {
    const p = db.ref_productos.findOne({ id_producto: c.id_producto });
    if (!p) return;
    const stockSede = (p.stock && p.stock[String(sede)]) || 0;
    if (stockSede <= 0) return; // no se recomienda lo agotado en su sede
    recomendaciones.push({
      id_producto: p.id_producto, nombre: p.nombre, precio: p.precio_venta,
      score: c.score, fuente: c.fuente, motivo: c.motivo
    });
  });
  recomendaciones.sort((a, b) => b.score - a.score);

  // --- Perfil resumen (categorías más vistas) ---
  const perfilCats = db.eventos.aggregate([
    { $match: { id_cliente: idCliente, "meta.tipo": "vista_producto", "payload.categoria": { $ne: null } } },
    { $group: { _id: "$payload.categoria", n: { $sum: 1 } } },
    { $sort: { n: -1 } }
  ]).toArray().map(x => ({ categoria: x._id, vistas: x.n }));

  // --- Materializar (upsert). vigencia controla el TTL/recálculo. ---
  db.feed_cliente.replaceOne(
    { id_cliente: idCliente },
    {
      id_cliente: idCliente,
      id_sede_contexto: sede,
      generado: new Date(),
      vigencia: new Date(Date.now() + 6 * 3600000), // 6 h
      perfil: { categorias_top: perfilCats },
      recomendaciones: recomendaciones.slice(0, 12)
    },
    { upsert: true }
  );
  print(`Feed generado: cliente ${idCliente} (sede ${sede}) -> ${recomendaciones.length} recomendaciones`);
}

// Genera el feed de todos los clientes con historial.
db.ref_clientes.find().forEach(c => generarFeed(c.id_cliente));

print("\n== Feeds materializados ==");
print("documentos en feed_cliente: " + db.feed_cliente.countDocuments());
