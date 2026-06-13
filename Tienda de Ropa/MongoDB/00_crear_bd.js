// =============================================================================
// 00_crear_bd.js  —  Creación del esquema del módulo NoSQL de TiendaRopa
// Ejecutar:  mongosh "mongodb://localhost:27017" 00_crear_bd.js
// -----------------------------------------------------------------------------
// Crea SOLO las colecciones que son propiedad del módulo Mongo:
//   - resenas       (Módulo B): documento con embebido + referencia
//   - eventos       (Módulo C, capa 1): colección time-series
//   - feed_cliente  (Módulo C, capa 2): modelo materializado de lectura con TTL
// Las colecciones ref_* (datos que pertenecen a SQL) se crean al insertarlas
// en 01_datos_referencia_sql.js, porque NO forman parte del esquema productivo.
// =============================================================================

db = db.getSiblingDB('tiendaropa_nosql');

// Reinicio idempotente para poder re-ejecutar el script de cero en la demo.
db.resenas.drop();
db.eventos.drop();
db.feed_cliente.drop();

// -----------------------------------------------------------------------------
// COLECCIÓN: resenas  (Módulo B)
// -----------------------------------------------------------------------------
// POR QUÉ validador $jsonSchema: una reseña tiene partes opcionales (fotos,
// respuestas) pero también invariantes que NO pueden romperse (rating 1..5,
// claves de referencia presentes). El validador hace cumplir las invariantes a
// nivel de motor, sin depender de que la aplicación se acuerde de validar.
//
// NOTA mongosh: los literales numéricos en mongosh son 'double' por defecto, por
// eso usamos bsonType "number" (acepta int/long/double) en vez de "int": así el
// validador no rechaza datos correctos sembrados desde el shell. En el driver de
// Node se controlan los tipos explícitamente.
db.createCollection("resenas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_producto", "id_cliente", "id_venta", "id_sede", "rating", "fecha", "estado"],
      properties: {
        id_producto: { bsonType: "number", description: "REFERENCIA a SQL (Producto)" },
        id_cliente:  { bsonType: "number", description: "REFERENCIA a SQL (Cliente)" },
        id_venta:    { bsonType: "number", description: "REFERENCIA a SQL (Venta) — prueba de compra" },
        id_sede:     { bsonType: "number", description: "Sede donde ocurrió la venta (partición)" },
        rating:      { bsonType: "number", minimum: 1, maximum: 5, description: "1 a 5 estrellas" },
        titulo:      { bsonType: "string", maxLength: 120 },
        texto:       { bsonType: "string", maxLength: 2000 },
        fotos:       { bsonType: "array", items: { bsonType: "string" } },
        votos_util:  { bsonType: "number", minimum: 0 },
        respuestas:  {
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

// Índice único: una reseña por (cliente, producto, venta).
// POR QUÉ: hace cumplir la regla "una opinión por compra" a nivel de motor.
db.resenas.createIndex(
  { id_cliente: 1, id_producto: 1, id_venta: 1 },
  { unique: true, name: "ux_resena_por_compra" }
);

// Índice de lectura: reseñas publicadas de un producto (la consulta más común).
db.resenas.createIndex(
  { id_producto: 1, estado: 1, fecha: -1 },
  { name: "ix_resena_producto" }
);

// Índice de apoyo para las agregaciones de rating por producto.
db.resenas.createIndex(
  { id_producto: 1, rating: 1 },
  { name: "ix_resena_rating" }
);

// -----------------------------------------------------------------------------
// COLECCIÓN: eventos  (Módulo C, capa 1) — TIME-SERIES
// -----------------------------------------------------------------------------
// POR QUÉ time-series: las consultas son siempre "qué pasó en tal ventana de
// tiempo para tal sede / producto / tipo". timeField = ts, metaField = meta.
// Mongo agrupa y comprime por meta+tiempo, abaratando justo ese patrón.
// expireAfterSeconds: retención automática del log crudo (90 días).
// NOTA: las colecciones time-series no usan validador $jsonSchema; la forma del
// documento se documenta aquí y se garantiza en la capa de ingesta (aplicación).
db.createCollection("eventos", {
  timeseries: {
    timeField: "ts",        // momento del evento
    metaField: "meta",      // { id_sede, tipo, id_producto } — dimensión de agrupación
    granularity: "seconds"
  },
  expireAfterSeconds: 7776000 // 90 días de retención del dato crudo
});

// Índice secundario por producto + tiempo, para "más vistos por producto".
// (Las time-series ya indexan meta+tiempo automáticamente; este es de apoyo.)
db.eventos.createIndex(
  { "meta.id_producto": 1, ts: -1 },
  { name: "ix_eventos_producto" }
);

// -----------------------------------------------------------------------------
// COLECCIÓN: feed_cliente  (Módulo C, capa 2) — MODELO MATERIALIZADO
// -----------------------------------------------------------------------------
// POR QUÉ materializado: es el "Stock_Actual" del feed. Un proceso lo recalcula
// desde el log (eventos) y lo deja listo para lectura instantánea del front.
db.createCollection("feed_cliente", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_cliente", "id_sede_contexto", "generado", "vigencia", "recomendaciones"],
      properties: {
        id_cliente:       { bsonType: "number" },
        id_sede_contexto: { bsonType: "number", description: "Sede usada para disponibilidad (stock local)" },
        generado:         { bsonType: "date" },
        vigencia:         { bsonType: "date", description: "Caducidad — controlada por índice TTL" },
        perfil:           { bsonType: "object" },
        recomendaciones:  {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id_producto", "score", "fuente", "motivo"],
            properties: {
              id_producto: { bsonType: "number" },
              nombre:      { bsonType: "string" },
              precio:      { bsonType: "number" },
              score:       { bsonType: "number" },
              fuente:      { bsonType: "string", description: "señal que generó la recomendación" },
              motivo:      { bsonType: "string", description: "explicación legible al cliente" }
            }
          }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// Un feed por cliente.
db.feed_cliente.createIndex({ id_cliente: 1 }, { unique: true, name: "ux_feed_cliente" });

// Índice TTL: cuando vigencia < ahora, Mongo borra el feed → fuerza recálculo.
// POR QUÉ: evita servir recomendaciones obsoletas y libera el recálculo bajo demanda.
db.feed_cliente.createIndex({ vigencia: 1 }, { expireAfterSeconds: 0, name: "ttl_feed" });

print("== Esquema creado ==");
printjson(db.getCollectionNames());
