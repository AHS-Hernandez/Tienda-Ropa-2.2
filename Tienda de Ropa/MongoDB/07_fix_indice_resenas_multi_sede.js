// =============================================================================
// 07_fix_indice_resenas_multi_sede.js
// Ejecutar en Central:
//   mongosh "mongodb://localhost:27017" 07_fix_indice_resenas_multi_sede.js
// -----------------------------------------------------------------------------
// Contexto:
//   Central y Sede comparten un solo MongoDB pero mantienen su propio SQL
//   Server con sus propios clientes. Los id_cliente colisionan entre nodos
//   (id 4 en Central = Adriana, id 4 en Sede = Pedro).
//
//   El indice unico original (id_cliente, id_producto, id_venta) podria
//   rechazar reseñas validas que casualmente coinciden en los tres campos.
//
// Fix:
//   Agregar id_sede al indice unico. La regla pasa a ser "una opinion por
//   compra, identificada por (cliente + producto + venta + sede)".
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// Borrar el indice viejo si existe
try {
  db.resenas.dropIndex("ux_resena_por_compra");
  print("Indice viejo eliminado: ux_resena_por_compra");
} catch (e) {
  print("Indice viejo no existia (o ya estaba en el formato nuevo)");
}

// Crear el indice nuevo con id_sede
db.resenas.createIndex(
  { id_cliente: 1, id_producto: 1, id_venta: 1, id_sede: 1 },
  { unique: true, name: "ux_resena_por_compra" }
);

print("Indice nuevo creado: { id_cliente, id_producto, id_venta, id_sede } UNIQUE");
print("\nIndices actuales:");
printjson(db.resenas.getIndexes().map(i => ({ name: i.name, key: i.key, unique: i.unique || false })));
