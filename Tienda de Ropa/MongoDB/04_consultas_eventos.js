// =============================================================================
// 04_consultas_eventos.js  —  Consultas del Módulo C, capa 1 (eventos)
// Ejecutar:  mongosh "mongodb://localhost:27017" 04_consultas_eventos.js
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

const hace7dias = new Date(Date.now() - 7 * 86400000);

// -----------------------------------------------------------------------------
// 1) Productos más vistos por sede (últimos 7 días).
//    Alimenta la señal "tendencia en tu sede" del feed. Filtra por ventana de
//    tiempo + meta.id_sede: exactamente para lo que sirve una time-series.
// -----------------------------------------------------------------------------
print("\n--- 1) Más vistos por sede (7 días) ---");
printjson(
  db.eventos.aggregate([
    { $match: { "meta.tipo": "vista_producto", ts: { $gte: hace7dias } } },
    { $group: {
        _id: { sede: "$meta.id_sede", producto: "$meta.id_producto" },
        vistas: { $sum: 1 }
    }},
    { $sort: { "_id.sede": 1, vistas: -1 } },
    { $project: { _id: 0, sede: "$_id.sede", producto: "$_id.producto", vistas: 1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 2) Búsquedas sin resultados (resultados = 0).
//    Insumo de negocio puro: qué busca la gente que no tenemos en catálogo.
// -----------------------------------------------------------------------------
print("\n--- 2) Búsquedas fallidas (sin resultados) ---");
printjson(
  db.eventos.aggregate([
    { $match: { "meta.tipo": "busqueda", "payload.resultados": 0 } },
    { $group: { _id: "$payload.termino_busqueda", veces: { $sum: 1 } } },
    { $project: { _id: 0, termino: "$_id", veces: 1 } },
    { $sort: { veces: -1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 3) Embudo de conversión por tipo de evento (vista -> carrito -> abandono).
//    Mide salud del POS web. (La compra real vive en SQL; aquí medimos intención.)
// -----------------------------------------------------------------------------
print("\n--- 3) Embudo por tipo de evento (7 días) ---");
printjson(
  db.eventos.aggregate([
    { $match: { ts: { $gte: hace7dias } } },
    { $group: { _id: "$meta.tipo", eventos: { $sum: 1 } } },
    { $project: { _id: 0, etapa: "$_id", eventos: 1 } },
    { $sort: { eventos: -1 } }
  ]).toArray()
);

// -----------------------------------------------------------------------------
// 4) Carritos abandonados por producto: candidatos a recuperación.
//    Cruza con la señal "vistos no comprados" del feed.
// -----------------------------------------------------------------------------
print("\n--- 4) Abandonos de carrito por producto ---");
printjson(
  db.eventos.aggregate([
    { $match: { "meta.tipo": "abandono" } },
    { $group: { _id: "$meta.id_producto", abandonos: { $sum: 1 } } },
    { $project: { _id: 0, producto: "$_id", abandonos: 1 } },
    { $sort: { abandonos: -1 } }
  ]).toArray()
);
