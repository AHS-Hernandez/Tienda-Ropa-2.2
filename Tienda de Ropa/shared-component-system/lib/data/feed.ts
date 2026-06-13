import { getMongoDB } from "@/lib/db/mongo"
import { queryRows } from "@/lib/db/query"

export type MotivoFeed =
  | "vistos_no_comprados"
  | "categoria_afin"
  | "co_visitacion"
  | "trending_sede"

export interface RecomendacionFeed {
  id_producto: number
  nombre: string
  precio_venta: number
  precio_final: number | null
  score: number
  motivo: MotivoFeed
  motivo_label: string
}

export interface FeedCliente {
  id_cliente: number
  id_sede: number
  recomendaciones: RecomendacionFeed[]
  generado_en: Date
  vigencia: Date
}

const MOTIVO_LABELS: Record<MotivoFeed, string> = {
  vistos_no_comprados: "Lo estuviste viendo",
  categoria_afin: "Por tus categorías favoritas",
  co_visitacion: "Otros también lo vieron",
  trending_sede: "Tendencia en tu sede",
}

const SCORES: Record<MotivoFeed, number> = {
  vistos_no_comprados: 1.0,
  categoria_afin: 0.6,
  co_visitacion: 0.8,
  trending_sede: 0.4,
}

export async function getFeedCliente(idCliente: number): Promise<FeedCliente | null> {
  const db = await getMongoDB()
  // El documento real sigue el schema $jsonSchema: id_sede_contexto, generado, fuente/motivo
  type DocMongo = {
    id_cliente: number
    id_sede_contexto: number
    generado: Date
    vigencia: Date
    recomendaciones: Array<{
      id_producto: number
      nombre: string
      precio: number
      score: number
      fuente: MotivoFeed
      motivo: string
    }>
  }
  const doc = await db.collection<DocMongo>("feed_cliente").findOne({ id_cliente: idCliente })
  if (!doc) return null
  if (doc.vigencia < new Date()) {
    await db.collection("feed_cliente").deleteOne({ id_cliente: idCliente })
    return null
  }
  // Adaptar al tipo que usa la app
  return {
    id_cliente: doc.id_cliente,
    id_sede: doc.id_sede_contexto,
    generado_en: doc.generado,
    vigencia: doc.vigencia,
    recomendaciones: doc.recomendaciones.map((r) => ({
      id_producto: r.id_producto,
      nombre: r.nombre,
      precio_venta: r.precio,
      precio_final: null,
      score: r.score,
      motivo: r.fuente,
      motivo_label: r.motivo,
    })),
  }
}

export async function generarFeedCliente(
  idCliente: number,
  idSede: number
): Promise<FeedCliente> {
  const db = await getMongoDB()
  const candidatos = new Map<number, { score: number; motivo: MotivoFeed }>()

  // 1. Vistos no comprados (score 1.0)
  const vistos = await db
    .collection("eventos")
    .aggregate([
      { $match: { id_cliente: idCliente, tipo: "vista_producto", id_producto: { $exists: true } } },
      { $group: { _id: "$id_producto", veces: { $sum: 1 } } },
      { $sort: { veces: -1 } },
      { $limit: 20 },
    ])
    .toArray()

  for (const v of vistos) {
    candidatos.set(v._id as number, { score: SCORES.vistos_no_comprados, motivo: "vistos_no_comprados" })
  }

  // 2. Categoría afín (score 0.6) — obtiene categorías más vistas y busca productos desde SQL
  const catAfin = await db
    .collection("eventos")
    .aggregate([
      { $match: { id_cliente: idCliente, tipo: "vista_producto", id_categoria: { $exists: true } } },
      { $group: { _id: "$id_categoria", veces: { $sum: 1 } } },
      { $sort: { veces: -1 } },
      { $limit: 3 },
    ])
    .toArray()

  for (const cat of catAfin) {
    if (!cat._id) continue
    // vw_Catalogo_Maestro no expone id_categoria; vamos a las tablas base.
    const prods = await queryRows<{ id_producto: number }>(
      `SELECT TOP 5 p.id_producto
       FROM Producto.Producto p
       INNER JOIN Producto.Subcategoria sc ON p.id_subcategoria = sc.id_subcategoria
       WHERE sc.id_categoria = @id_categoria
       ORDER BY NEWID()`,
      { id_categoria: cat._id as number }
    )
    for (const p of prods) {
      if (!candidatos.has(p.id_producto)) {
        candidatos.set(p.id_producto, { score: SCORES.categoria_afin, motivo: "categoria_afin" })
      }
    }
  }

  // 3. Co-visitación (score 0.8) — productos vistos por clientes que vieron los mismos productos
  const idsVistos = [...candidatos.keys()]
  if (idsVistos.length > 0) {
    const coVisitados = await db
      .collection("eventos")
      .aggregate([
        { $match: { tipo: "vista_producto", id_producto: { $in: idsVistos }, id_cliente: { $ne: idCliente } } },
        { $group: { _id: "$id_cliente" } },
        { $limit: 50 },
        {
          $lookup: {
            from: "eventos",
            let: { cid: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$id_cliente", "$$cid"] }, { $eq: ["$tipo", "vista_producto"] }] } } },
              { $group: { _id: "$id_producto", veces: { $sum: 1 } } },
              { $sort: { veces: -1 } },
              { $limit: 5 },
            ],
            as: "otros_vistos",
          },
        },
        { $unwind: "$otros_vistos" },
        { $group: { _id: "$otros_vistos._id", frecuencia: { $sum: "$otros_vistos.veces" } } },
        { $sort: { frecuencia: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    for (const cv of coVisitados) {
      if (!candidatos.has(cv._id as number)) {
        candidatos.set(cv._id as number, { score: SCORES.co_visitacion, motivo: "co_visitacion" })
      }
    }
  }

  // 4. Tendencia en sede — últimos 7 días (score 0.4)
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const trending = await db
    .collection("eventos")
    .aggregate([
      { $match: { tipo: "vista_producto", id_sede: idSede, ts: { $gte: hace7dias }, id_producto: { $exists: true } } },
      { $group: { _id: "$id_producto", veces: { $sum: 1 } } },
      { $sort: { veces: -1 } },
      { $limit: 10 },
    ])
    .toArray()

  for (const t of trending) {
    if (!candidatos.has(t._id as number)) {
      candidatos.set(t._id as number, { score: SCORES.trending_sede, motivo: "trending_sede" })
    }
  }

  // Exclusiones: ya comprados (estados Pagada o Entregada)
  const comprados = await queryRows<{ id_producto: number }>(
    `SELECT DISTINCT vd.id_producto
     FROM Ventas.Venta_Detalle vd
     INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
     WHERE vc.id_cliente = @id_cliente
       AND vc.Estado IN ('Pagada', 'Entregada')`,
    { id_cliente: idCliente }
  )
  for (const c of comprados) candidatos.delete(c.id_producto)

  // Exclusiones: sin stock en la sede
  const idsFinales = [...candidatos.keys()]
  if (idsFinales.length === 0) {
    const feed: FeedCliente = {
      id_cliente: idCliente,
      id_sede: idSede,
      recomendaciones: [],
      generado_en: new Date(),
      vigencia: new Date(Date.now() + 6 * 60 * 60 * 1000),
    }
    await db.collection("feed_cliente").replaceOne(
      { id_cliente: idCliente },
      feed,
      { upsert: true }
    )
    return feed
  }

  const conStock = await queryRows<{ id_producto: number }>(
    `SELECT id_producto FROM Inventario.vw_Disponibilidad_Stock
     WHERE id_sede = @id_sede AND Cantidad_Disponible > 0
       AND id_producto IN (${idsFinales.join(",")})`,
    { id_sede: idSede }
  )
  const setConStock = new Set(conStock.map((r) => r.id_producto))
  for (const id of idsFinales) {
    if (!setConStock.has(id)) candidatos.delete(id)
  }

  // Enriquecer con nombre y precio desde SQL
  const idsEnriquecer = [...candidatos.keys()]
  let enriched: Record<number, { nombre: string; precio_venta: number; precio_final: number | null }> = {}

  if (idsEnriquecer.length > 0) {
    const rows = await queryRows<{
      id_producto: number
      nombre: string
      precio_venta: number
      precio_final: number | null
    }>(
      `SELECT c.id_producto, c.Nombre AS nombre, c.Precio_venta AS precio_venta,
              vo.Precio_Final_Oferta AS precio_final
       FROM Producto.vw_Catalogo_Maestro c
       LEFT JOIN Marketing.vw_Validacion_Precios_Oferta vo ON vo.id_producto = c.id_producto
       WHERE c.id_producto IN (${idsEnriquecer.join(",")})`,
      {}
    )
    for (const r of rows) {
      enriched[r.id_producto] = {
        nombre: r.nombre,
        precio_venta: r.precio_venta,
        precio_final: r.precio_final ?? null,
      }
    }
  }

  // Construir recomendaciones ordenadas por score
  const recomendaciones: RecomendacionFeed[] = []
  for (const [idProducto, { score, motivo }] of candidatos) {
    const info = enriched[idProducto]
    if (!info) continue
    recomendaciones.push({
      id_producto: idProducto,
      nombre: info.nombre,
      precio_venta: info.precio_venta,
      precio_final: info.precio_final,
      score,
      motivo,
      motivo_label: MOTIVO_LABELS[motivo],
    })
  }
  recomendaciones.sort((a, b) => b.score - a.score)

  const feed: FeedCliente = {
    id_cliente: idCliente,
    id_sede: idSede,
    recomendaciones: recomendaciones.slice(0, 8),
    generado_en: new Date(),
    vigencia: new Date(Date.now() + 6 * 60 * 60 * 1000),
  }

  // Mapear al schema $jsonSchema de la coleccion (definido en 00_crear_bd.js):
  // id_sede_contexto, generado, vigencia, recomendaciones[].{id_producto,score,fuente,motivo,nombre,precio}
  const docMongo = {
    id_cliente: idCliente,
    id_sede_contexto: idSede,
    generado: feed.generado_en,
    vigencia: feed.vigencia,
    recomendaciones: feed.recomendaciones.map((r) => ({
      id_producto: r.id_producto,
      nombre: r.nombre,
      precio: r.precio_final ?? r.precio_venta,
      score: r.score,
      fuente: r.motivo,
      motivo: r.motivo_label,
    })),
  }

  await db.collection("feed_cliente").replaceOne(
    { id_cliente: idCliente },
    docMongo,
    { upsert: true }
  )

  return feed
}
