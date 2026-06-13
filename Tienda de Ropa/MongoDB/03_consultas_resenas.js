// =============================================================================
// 03_consultas_resenas.js  —  Consultas del Módulo B (reseñas)
// Ejecutar:  mongosh "mongodb://localhost:27017" 03_consultas_resenas.js
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// -----------------------------------------------------------------------------
// 1) Reseñas publicadas de un producto, más recientes primero.
//    Es la lectura más común (ficha de producto). Usa ix_resena_producto.
// -----------------------------------------------------------------------------
print("\n--- 1) Reseñas publicadas del producto 1001 ---");
printjson(
  db.resenas.find(
    { id_producto: 1001, estado: "publicada" },
    { _id: 0, id_cliente: 1, rating: 1, titulo: 1, texto: 1, fecha: 1 }
  ).sort({ fecha: -1 }).toArray()
);

// -----------------------------------------------------------------------------
// 2) Resumen de valoración por producto: promedio y cantidad.
//    Alimenta el campo rating_promedio que el front muestra junto al producto.
// -----------------------------------------------------------------------------
print("\n--- 2) Promedio y total de reseñas por producto ---");
printjson(
  db.resenas.aggregate([
    { $match: { estado: "publicada" } },
    { $group: {
        _id: "$id_producto",
        rating_promedio: { $avg: "$rating" },
        total: { $sum: 1 }
    }},
    { $project: {
        _id: 0, id_producto: "$_id",
        rating_promedio: { $round: ["$rating_promedio", 2] },
        total: 1
    }},
    { $sort: { rating_promedio: -1, total: -1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 3) Distribución de estrellas de un producto (cuántas de 5, de 4, ...).
//    Es el típico histograma de reseñas. Demuestra $group por valor de rating.
// -----------------------------------------------------------------------------
print("\n--- 3) Distribución de estrellas del producto 1001 ---");
printjson(
  db.resenas.aggregate([
    { $match: { id_producto: 1001, estado: "publicada" } },
    { $group: { _id: "$rating", cantidad: { $sum: 1 } } },
    { $project: { _id: 0, estrellas: "$_id", cantidad: 1 } },
    { $sort: { estrellas: -1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 4) Top productos mejor valorados con un mínimo de reseñas.
//    El filtro de mínimo evita que un producto con 1 reseña de 5 domine.
// -----------------------------------------------------------------------------
print("\n--- 4) Top productos (>= 2 reseñas) ---");
printjson(
  db.resenas.aggregate([
    { $match: { estado: "publicada" } },
    { $group: { _id: "$id_producto", prom: { $avg: "$rating" }, n: { $sum: 1 } } },
    { $match: { n: { $gte: 2 } } },
    { $sort: { prom: -1, n: -1 } },
    { $project: { _id: 0, id_producto: "$_id", prom: { $round: ["$prom", 2] }, reseñas: "$n" } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 5) Reseñas con foto y rating bajo (gestión de reputación).
//    Caso de negocio: detectar quejas con evidencia visual para responder.
// -----------------------------------------------------------------------------
print("\n--- 5) Reseñas con foto y rating <= 3 ---");
printjson(
  db.resenas.find(
    { rating: { $lte: 3 }, fotos: { $exists: true, $ne: [] } },
    { _id: 0, id_producto: 1, id_cliente: 1, rating: 1, titulo: 1, fotos: 1 }
  ).toArray()
);
