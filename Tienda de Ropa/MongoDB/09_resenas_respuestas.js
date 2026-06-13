// =============================================================================
// 09_resenas_respuestas.js  —  Ampliar el sistema de respuestas a resenas
// Ejecutar:
//   mongosh "mongodb://localhost:27017" 09_resenas_respuestas.js
// =============================================================================
// Cambios:
//   1. Validador $jsonSchema permite los nuevos campos por respuesta:
//        _id, id_usuario, id_sede, autor, autor_rol, texto, fecha,
//        estado ('publicada' | 'oculta'), editada (bool)
//   2. Migra respuestas viejas (solo { autor, texto, fecha }) agregando
//      _id, estado='publicada', editada=false. id_usuario e id_sede quedan
//      como 0 / 0 porque no se puede inferir.
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
              editada:    { bsonType: "bool" }
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
print("Validador actualizado para respuestas extendidas.");

// --- 2. Migrar respuestas viejas ----------------------------------------------
const resenas = db.resenas.find({ "respuestas.0": { $exists: true } }).toArray();
let migradas = 0;
for (const r of resenas) {
  const nuevasResp = (r.respuestas || []).map((resp) => ({
    _id:        resp._id || new ObjectId(),
    id_usuario: resp.id_usuario ?? 0,
    id_sede:    resp.id_sede ?? r.id_sede,
    autor:      resp.autor ?? "Tienda",
    autor_rol:  resp.autor_rol ?? "admin-sede",
    texto:      resp.texto,
    fecha:      resp.fecha,
    estado:     resp.estado ?? "publicada",
    editada:    resp.editada ?? false
  }));
  db.resenas.updateOne({ _id: r._id }, { $set: { respuestas: nuevasResp } });
  migradas++;
}
print(`Respuestas migradas en ${migradas} resenas.`);

print("\nListo. Las reseñas ya aceptan respuestas con autor, estado y edicion.");
