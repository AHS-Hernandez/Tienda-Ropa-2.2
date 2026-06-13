// =============================================================================
// 06_consultas_feed.js  —  Lectura y verificación del feed personalizado
// Ejecutar:  mongosh "mongodb://localhost:27017" 06_consultas_feed.js
// -----------------------------------------------------------------------------
// El front solo hace la consulta 1 (lectura instantánea de un documento). Las
// demás verifican que las reglas de negocio se cumplieron.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// -----------------------------------------------------------------------------
// 1) Lo que el front pide: el feed de un cliente, ya listo para renderizar.
//    Una sola lectura por _id lógico (id_cliente). Sin agregaciones en caliente.
// -----------------------------------------------------------------------------
print("\n--- 1) Feed de Ana (301) ---");
const feedAna = db.feed_cliente.findOne({ id_cliente: 301 });
print("Sede contexto: " + feedAna.id_sede_contexto);
print("Perfil: " + JSON.stringify(feedAna.perfil.categorias_top));
print("Recomendaciones:");
feedAna.recomendaciones.forEach(r =>
  print(`  [${r.fuente}] ${r.nombre} ($${r.precio}) — ${r.motivo} (score ${r.score})`)
);

// -----------------------------------------------------------------------------
// 2) VERIFICA regla de stock: ninguna recomendación está agotada en su sede.
// -----------------------------------------------------------------------------
print("\n--- 2) Verificación: nada agotado en la sede del cliente ---");
db.feed_cliente.find().forEach(feed => {
  const sede = String(feed.id_sede_contexto);
  feed.recomendaciones.forEach(r => {
    const p = db.ref_productos.findOne({ id_producto: r.id_producto });
    const stock = (p.stock && p.stock[sede]) || 0;
    if (stock <= 0) print(`  FALLA: cliente ${feed.id_cliente} -> ${r.nombre} agotado en sede ${sede}`);
  });
});
print("  (sin líneas FALLA = regla cumplida)");

// -----------------------------------------------------------------------------
// 3) VERIFICA regla de "ya comprado": el feed no repite compras del cliente.
// -----------------------------------------------------------------------------
print("\n--- 3) Verificación: no se recomienda lo ya comprado ---");
db.feed_cliente.find().forEach(feed => {
  const comprados = db.ref_ventas.aggregate([
    { $match: { id_cliente: feed.id_cliente } },
    { $unwind: "$items" },
    { $group: { _id: null, ids: { $addToSet: "$items" } } }
  ]).toArray();
  const ids = comprados.length ? comprados[0].ids : [];
  feed.recomendaciones.forEach(r => {
    if (ids.includes(r.id_producto))
      print(`  FALLA: cliente ${feed.id_cliente} -> ${r.nombre} ya estaba comprado`);
  });
});
print("  (sin líneas FALLA = regla cumplida)");

// -----------------------------------------------------------------------------
// 4) Distribución de recomendaciones por fuente (qué señal aporta más).
// -----------------------------------------------------------------------------
print("\n--- 4) Recomendaciones por señal (todos los clientes) ---");
printjson(
  db.feed_cliente.aggregate([
    { $unwind: "$recomendaciones" },
    { $group: { _id: "$recomendaciones.fuente", total: { $sum: 1 } } },
    { $project: { _id: 0, fuente: "$_id", total: 1 } },
    { $sort: { total: -1 } }
  ]).toArray()
);
