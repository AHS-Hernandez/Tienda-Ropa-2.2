// =============================================================================
// 08_resenas_votos.js  —  Agrega soporte de likes/dislikes a la coleccion resenas
// Ejecutar:
//   mongosh "mongodb://localhost:27017" 08_resenas_votos.js
// =============================================================================
// Cambios:
//   1. Actualiza el validador $jsonSchema para aceptar:
//        likes:    int (default 0)
//        dislikes: int (default 0)
//        votos:    array de { id_cliente, id_sede, voto: 'like'|'dislike', fecha }
//
//   2. Inicializa los campos en las reseñas existentes con 0 y array vacio.
//
//   3. Crea indice por (id_producto, likes desc) para "mas votadas primero".
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// --- 1. Patchear el validador --------------------------------------------------
db.runCommand({
  collMod: "resenas",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_producto", "id_cliente", "id_venta", "id_sede", "rating", "fecha", "estado"],
      properties: {
        id_producto: { bsonType: "number" },
        id_cliente:  { bsonType: "number" },
        id_venta:    { bsonType: "number" },
        id_sede:     { bsonType: "number" },
        rating:      { bsonType: "number", minimum: 1, maximum: 5 },
        titulo:      { bsonType: "string", maxLength: 120 },
        texto:       { bsonType: "string", maxLength: 2000 },
        fotos:       { bsonType: "array", items: { bsonType: "string" } },
        votos_util:  { bsonType: "number", minimum: 0 },
        // NUEVO ------------------------------------------------------------
        likes:       { bsonType: "number", minimum: 0 },
        dislikes:    { bsonType: "number", minimum: 0 },
        votos: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id_cliente", "voto", "fecha"],
            properties: {
              id_cliente: { bsonType: "number" },
              id_sede:    { bsonType: "number" },
              voto:       { enum: ["like", "dislike"] },
              fecha:      { bsonType: "date" }
            }
          }
        },
        // ------------------------------------------------------------------
        respuestas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["autor", "texto", "fecha"],
            properties: {
              autor: { bsonType: "string" },
              texto: { bsonType: "string" },
              fecha: { bsonType: "date" }
            }
          }
        },
        estado: { enum: ["publicada", "oculta"] },
        fecha:  { bsonType: "date" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
print("Validador actualizado con campos de votos.");

// --- 2. Inicializar campos en reseñas existentes -------------------------------
const upd = db.resenas.updateMany(
  { likes: { $exists: false } },
  { $set: { likes: 0, dislikes: 0, votos: [] } }
);
print(`Reseñas migradas: ${upd.modifiedCount}`);

// --- 3. Indice para ordenar por mas votadas ------------------------------------
db.resenas.createIndex(
  { id_producto: 1, likes: -1 },
  { name: "ix_resena_mas_votadas" }
);
print("Indice ix_resena_mas_votadas creado.");

print("\nListo. La coleccion resenas ya acepta votos.");
