// =============================================================================
// 10_votos_respuestas.js  —  Likes/dislikes para las respuestas a resenas
// Ejecutar:
//   mongosh "mongodb://localhost:27017" 10_votos_respuestas.js
// =============================================================================
// Cambios:
//   1. Validador $jsonSchema permite likes, dislikes y votos por respuesta.
//   2. Inicializa likes=0, dislikes=0, votos=[] en respuestas existentes.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// --- 1. Actualizar validador --------------------------------------------------
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
        respuestas: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["_id", "id_usuario", "autor", "texto", "fecha", "estado"],
            properties: {
              _id:        { bsonType: "objectId" },
              id_usuario: { bsonType: "number" },
              id_sede:    { bsonType: "number" },
              autor:      { bsonType: "string" },
              autor_rol:  { enum: ["cliente", "vendedor", "admin-sede", "admin-global"] },
              texto:      { bsonType: "string", maxLength: 1000 },
              fecha:      { bsonType: "date" },
              estado:     { enum: ["publicada", "oculta"] },
              editada:    { bsonType: "bool" },
              // NUEVO ----------------------------------------------------------
              likes:      { bsonType: "number", minimum: 0 },
              dislikes:   { bsonType: "number", minimum: 0 },
              votos: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["id_usuario", "voto", "fecha"],
                  properties: {
                    id_usuario: { bsonType: "number" },
                    id_sede:    { bsonType: "number" },
                    voto:       { enum: ["like", "dislike"] },
                    fecha:      { bsonType: "date" }
                  }
                }
              }
              // ---------------------------------------------------------------
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
print("Validador actualizado: respuestas ahora aceptan votos.");

// --- 2. Inicializar campos en respuestas existentes ---------------------------
const cur = db.resenas.find({ "respuestas.0": { $exists: true } });
let migradas = 0;
cur.forEach((r) => {
  let cambio = false;
  const nuevas = (r.respuestas || []).map((resp) => {
    if (resp.likes === undefined || resp.votos === undefined) {
      cambio = true;
      return { ...resp, likes: resp.likes ?? 0, dislikes: resp.dislikes ?? 0, votos: resp.votos ?? [] };
    }
    return resp;
  });
  if (cambio) {
    db.resenas.updateOne({ _id: r._id }, { $set: { respuestas: nuevas } });
    migradas++;
  }
});
print(`Reseñas con respuestas migradas: ${migradas}`);

print("\nListo. Las respuestas ya aceptan votos.");
