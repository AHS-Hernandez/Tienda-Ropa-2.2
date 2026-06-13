// Importa el JSON de imagenes_producto al Mongo local.
// Ejecutar: node MongoDB/import_imagenes.js
// Requiere: el driver "mongodb" ya esta en shared-component-system/node_modules.

const fs   = require("fs");
const path = require("path");

// Reutilizamos el driver mongodb del proyecto
const { MongoClient } = require(
  path.join(__dirname, "..", "shared-component-system", "node_modules", "mongodb")
);

const URI  = "mongodb://localhost:27017";
const DB   = "tiendaropa_nosql";
const COL  = "imagenes_producto";
const FILE = "C:\\Users\\adria\\Downloads\\tiendaropa_nosql.imagenes_producto.json";

async function main() {
  console.log("Leyendo archivo...");
  const raw  = fs.readFileSync(FILE, "utf8");
  const docs = JSON.parse(raw);
  console.log(`Documentos en archivo: ${docs.length}`);

  // mongoexport agrega { "$oid": "..." } en _id. Lo quitamos para evitar conflicto
  // y dejar que Mongo genere uno nuevo en el insert.
  for (const d of docs) {
    if (d._id && typeof d._id === "object" && d._id.$oid) delete d._id;
  }

  const client = new MongoClient(URI);
  await client.connect();
  console.log("Conectado a", URI);

  const col = client.db(DB).collection(COL);

  // Indice por id_producto para que el endpoint sea rapido
  await col.createIndex({ id_producto: 1 }, { name: "ix_imagen_producto" });

  // Borrar duplicados existentes por id_producto (si re-ejecutas el script)
  const ids = docs.map((d) => d.id_producto).filter((x) => x != null);
  if (ids.length) {
    const del = await col.deleteMany({ id_producto: { $in: ids } });
    console.log(`Borrados previos con mismo id_producto: ${del.deletedCount}`);
  }

  const res = await col.insertMany(docs, { ordered: false });
  console.log(`Insertados: ${res.insertedCount}`);

  const total = await col.countDocuments();
  console.log(`Total en ${DB}.${COL}: ${total}`);

  await client.close();
  console.log("Listo.");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
