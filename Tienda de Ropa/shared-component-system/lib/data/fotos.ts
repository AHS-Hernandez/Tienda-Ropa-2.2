import path from "path"
import fs from "fs/promises"
import { getMongoDB } from "@/lib/db/mongo"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "productos")

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

export async function getFotosProducto(idProducto: number): Promise<string[]> {
  const db = await getMongoDB()

  // 1) Coleccion nueva: imagenes_producto (base64 inline). Compartida entre Central y Sede.
  const imgDoc = await db
    .collection("imagenes_producto")
    .findOne({ id_producto: idProducto }, { projection: { _id: 1 } })
  if (imgDoc) {
    return [`/api/foto/producto/${idProducto}/binary`]
  }

  // 2) Sistema viejo (Central): fotos en disco, ruta en ref_productos.fotos[]
  const doc = await db
    .collection("ref_productos")
    .findOne({ id_producto: idProducto }, { projection: { fotos: 1 } })
  return Array.isArray(doc?.fotos) ? (doc.fotos as string[]) : []
}

export async function getFotosProductosBatch(
  ids: number[]
): Promise<Record<number, string[]>> {
  if (!ids.length) return {}
  const db = await getMongoDB()

  // 1) Cuales tienen imagen en imagenes_producto (compartida Central+Sede)
  const conImagen = await db
    .collection("imagenes_producto")
    .find({ id_producto: { $in: ids } }, { projection: { id_producto: 1 } })
    .toArray()
  const setConImagen = new Set(conImagen.map((d) => d.id_producto as number))

  // 2) Para los que no tienen, fallback al sistema viejo de disco
  const idsViejos = ids.filter((id) => !setConImagen.has(id))
  const docsViejos = idsViejos.length
    ? await db
        .collection("ref_productos")
        .find(
          { id_producto: { $in: idsViejos } },
          { projection: { id_producto: 1, fotos: 1 } }
        )
        .toArray()
    : []

  const map: Record<number, string[]> = {}
  for (const id of setConImagen) {
    map[id] = [`/api/foto/producto/${id}/binary`]
  }
  for (const d of docsViejos) {
    map[d.id_producto as number] = Array.isArray(d.fotos) ? (d.fotos as string[]) : []
  }
  return map
}

export async function agregarFoto(
  idProducto: number,
  buffer: Buffer,
  extension: string
): Promise<string> {
  await ensureDir()
  const nombre = `${idProducto}_${Date.now()}.${extension}`
  const rutaFisica = path.join(UPLOAD_DIR, nombre)
  const rutaPublica = `/uploads/productos/${nombre}`

  await fs.writeFile(rutaFisica, buffer)

  const db = await getMongoDB()
  await db.collection("ref_productos").updateOne(
    { id_producto: idProducto },
    { $push: { fotos: rutaPublica } } as never,
    { upsert: true }
  )

  return rutaPublica
}

export async function eliminarFoto(
  idProducto: number,
  ruta: string
): Promise<void> {
  const db = await getMongoDB()
  await db.collection("ref_productos").updateOne(
    { id_producto: idProducto },
    { $pull: { fotos: ruta } } as never
  )

  const nombre = path.basename(ruta)
  try {
    await fs.unlink(path.join(UPLOAD_DIR, nombre))
  } catch {
    // archivo ya no existe, ignorar
  }
}
