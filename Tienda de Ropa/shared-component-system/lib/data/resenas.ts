import { ObjectId } from "mongodb"
import { getMongoDB } from "@/lib/db/mongo"
import { queryRows } from "@/lib/db/query"

export interface RespuestaResena {
  _id: ObjectId
  id_usuario: number
  id_sede: number
  autor: string
  autor_rol: "cliente" | "vendedor" | "admin-sede" | "admin-global"
  texto: string
  fecha: Date
  estado: "publicada" | "oculta"
  editada: boolean
  likes?: number
  dislikes?: number
  votos?: Array<{ id_usuario: number; id_sede: number; voto: "like" | "dislike"; fecha: Date }>
}

export interface Resena {
  _id?: ObjectId
  id_producto: number
  id_cliente: number
  id_venta: number
  id_sede: number
  rating: number
  titulo: string
  texto: string
  estado: "publicada" | "oculta"
  fecha: Date
  likes?: number
  dislikes?: number
  votos?: Array<{ id_cliente: number; id_sede: number; voto: "like" | "dislike"; fecha: Date }>
  respuestas?: RespuestaResena[]
}

export interface ResumenResenas {
  promedio: number
  total: number
  distribucion: Record<string, number>
}

export async function getResenasPublicadas(idProducto: number): Promise<Resena[]> {
  const db = await getMongoDB()
  return db
    .collection<Resena>("resenas")
    .find({ id_producto: idProducto, estado: "publicada" })
    .sort({ fecha: -1 })
    .toArray()
}

export async function getTodasResenas(idProducto: number): Promise<Resena[]> {
  const db = await getMongoDB()
  return db
    .collection<Resena>("resenas")
    .find({ id_producto: idProducto })
    .sort({ fecha: -1 })
    .toArray()
}

export async function getResumenResenas(idProducto: number): Promise<ResumenResenas> {
  const db = await getMongoDB()
  const pipeline = [
    { $match: { id_producto: idProducto, estado: "publicada" } },
    {
      $group: {
        _id: null,
        promedio: { $avg: "$rating" },
        total: { $sum: 1 },
        dist1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        dist5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]
  const rows = await db.collection("resenas").aggregate(pipeline).toArray()
  if (!rows.length) return { promedio: 0, total: 0, distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } }
  const r = rows[0]
  return {
    promedio: Math.round((r.promedio as number) * 10) / 10,
    total: r.total as number,
    distribucion: {
      "1": r.dist1 as number,
      "2": r.dist2 as number,
      "3": r.dist3 as number,
      "4": r.dist4 as number,
      "5": r.dist5 as number,
    },
  }
}

export async function clienteYaReseno(
  idCliente: number,
  idProducto: number,
  idVenta: number
): Promise<boolean> {
  const db = await getMongoDB()
  const existe = await db
    .collection("resenas")
    .findOne({ id_cliente: idCliente, id_producto: idProducto, id_venta: idVenta })
  return existe !== null
}

export async function validarCompraSQL(
  idCliente: number,
  idProducto: number,
  idVenta: number
): Promise<boolean> {
  const rows = await queryRows<{ existe: number }>(
    `SELECT TOP 1 1 AS existe
     FROM Ventas.Venta_Detalle vd
     INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
     WHERE vc.id_cliente  = @id_cliente
       AND vd.id_producto = @id_producto
       AND vd.id_venta    = @id_venta
       AND vc.Estado      IN ('Completada', 'Entregada')`,
    { id_cliente: idCliente, id_producto: idProducto, id_venta: idVenta }
  )
  return rows.length > 0
}

/**
 * Busca la compra más reciente (Completada o Entregada) en la que este
 * cliente adquirió este producto. Sirve para reseñar directo desde la
 * ficha del producto, sin tener que pasar por la página de pedidos.
 * Devuelve el id_venta o null si nunca lo compró.
 */
export async function getVentaCompradaProducto(
  idCliente: number,
  idProducto: number
): Promise<number | null> {
  const rows = await queryRows<{ id_venta: number }>(
    `SELECT TOP 1 vd.id_venta
     FROM Ventas.Venta_Detalle vd
     INNER JOIN Ventas.Venta_Cabecera vc ON vc.id_venta = vd.id_venta
     WHERE vc.id_cliente  = @id_cliente
       AND vd.id_producto = @id_producto
       AND vc.Estado      IN ('Completada', 'Entregada')
     ORDER BY vd.id_venta DESC`,
    { id_cliente: idCliente, id_producto: idProducto }
  )
  return rows[0]?.id_venta ?? null
}

export async function insertarResena(resena: Omit<Resena, "_id">): Promise<void> {
  const db = await getMongoDB()
  await db.collection("resenas").insertOne({ ...resena, fecha: new Date() })
}

export async function cambiarEstadoResena(
  id: string,
  estado: "publicada" | "oculta"
): Promise<void> {
  const db = await getMongoDB()
  await db
    .collection("resenas")
    .updateOne({ _id: new ObjectId(id) }, { $set: { estado } })
}

export async function editarResena(
  id: string,
  idCliente: number,
  data: { rating: number; titulo: string; texto: string }
): Promise<boolean> {
  const db = await getMongoDB()
  const result = await db
    .collection("resenas")
    .updateOne(
      { _id: new ObjectId(id), id_cliente: idCliente },
      { $set: { rating: data.rating, titulo: data.titulo, texto: data.texto } }
    )
  return result.matchedCount > 0
}

export async function eliminarResena(id: string): Promise<void> {
  const db = await getMongoDB()
  await db.collection("resenas").deleteOne({ _id: new ObjectId(id) })
}

/**
 * Toggle de voto sobre una resena.
 * Reglas:
 *   - Si el cliente nunca voto -> agrega su voto e incrementa el contador.
 *   - Si voto lo MISMO -> quita su voto y decrementa el contador (toggle off).
 *   - Si voto lo OPUESTO -> cambia el voto, decrementa el anterior, incrementa el nuevo.
 * Devuelve el nuevo estado: { likes, dislikes, voto_propio: 'like'|'dislike'|null }
 */
export async function votarResena(
  idResena: string,
  idCliente: number,
  idSede: number,
  voto: "like" | "dislike"
): Promise<{ likes: number; dislikes: number; voto_propio: "like" | "dislike" | null } | null> {
  const db = await getMongoDB()
  const _id = new ObjectId(idResena)
  const col = db.collection<Resena>("resenas")

  const doc = await col.findOne({ _id })
  if (!doc) return null

  const votoPrevio = (doc.votos ?? []).find((v) => v.id_cliente === idCliente)

  if (!votoPrevio) {
    // 1) Primer voto del cliente
    await col.updateOne(
      { _id },
      {
        $push: { votos: { id_cliente: idCliente, id_sede: idSede, voto, fecha: new Date() } },
        $inc: voto === "like" ? { likes: 1 } : { dislikes: 1 },
      } as never
    )
  } else if (votoPrevio.voto === voto) {
    // 2) Toggle off: quita su voto
    await col.updateOne(
      { _id },
      {
        $pull: { votos: { id_cliente: idCliente } },
        $inc: voto === "like" ? { likes: -1 } : { dislikes: -1 },
      } as never
    )
  } else {
    // 3) Cambio de voto
    await col.updateOne(
      { _id, "votos.id_cliente": idCliente },
      {
        $set: { "votos.$.voto": voto, "votos.$.fecha": new Date() },
        $inc: voto === "like" ? { likes: 1, dislikes: -1 } : { likes: -1, dislikes: 1 },
      } as never
    )
  }

  const actualizado = await col.findOne({ _id })
  const propio = (actualizado?.votos ?? []).find((v) => v.id_cliente === idCliente)
  return {
    likes: actualizado?.likes ?? 0,
    dislikes: actualizado?.dislikes ?? 0,
    voto_propio: propio?.voto ?? null,
  }
}

export async function getTodasResenasGlobal(filtros?: {
  id_producto?: number
  estado?: "publicada" | "oculta"
  limit?: number
}): Promise<Resena[]> {
  const db = await getMongoDB()
  const query: Record<string, unknown> = {}
  if (filtros?.id_producto) query.id_producto = filtros.id_producto
  if (filtros?.estado) query.estado = filtros.estado
  return db
    .collection<Resena>("resenas")
    .find(query)
    .sort({ fecha: -1 })
    .limit(filtros?.limit ?? 200)
    .toArray()
}

export async function getProductosResenadosEnVenta(
  idCliente: number,
  idVenta: number
): Promise<number[]> {
  const db = await getMongoDB()
  const docs = await db
    .collection<Resena>("resenas")
    .find({ id_cliente: idCliente, id_venta: idVenta })
    .project({ id_producto: 1 })
    .toArray()
  return docs.map((d) => d.id_producto)
}

export interface ResenaMia {
  _id: string
  id_producto: number
  rating: number
  titulo: string
  texto: string
}

export async function getResenasClienteEnVenta(
  idCliente: number,
  idVenta: number
): Promise<ResenaMia[]> {
  const db = await getMongoDB()
  const docs = await db
    .collection<Resena>("resenas")
    .find({ id_cliente: idCliente, id_venta: idVenta })
    .toArray()
  return docs.map((d) => ({
    _id: d._id!.toString(),
    id_producto: d.id_producto,
    rating: d.rating,
    titulo: d.titulo,
    texto: d.texto,
  }))
}

type RolRespuesta = "cliente" | "vendedor" | "admin-sede" | "admin-global"

/**
 * Agrega una respuesta a una reseña. Cualquier rol autenticado puede responder.
 */
export async function agregarRespuesta(
  idResena: string,
  autor: {
    id_usuario: number
    id_sede: number
    nombre: string
    rol: RolRespuesta
  },
  texto: string
): Promise<RespuestaResena | null> {
  const db = await getMongoDB()
  const _id = new ObjectId(idResena)
  const resp: RespuestaResena = {
    _id: new ObjectId(),
    id_usuario: autor.id_usuario,
    id_sede: autor.id_sede,
    autor: autor.nombre,
    autor_rol: autor.rol,
    texto: texto.trim(),
    fecha: new Date(),
    estado: "publicada",
    editada: false,
  }
  const result = await db
    .collection("resenas")
    .updateOne({ _id }, { $push: { respuestas: resp } } as never)
  if (result.matchedCount === 0) return null
  return resp
}

/**
 * Edita el texto de una respuesta. Solo el autor original puede editar.
 * Devuelve true si se modificó, false si no era el autor o no existe.
 */
export async function editarRespuesta(
  idResena: string,
  idRespuesta: string,
  idUsuarioAutor: number,
  nuevoTexto: string
): Promise<boolean> {
  const db = await getMongoDB()
  const result = await db.collection("resenas").updateOne(
    {
      _id: new ObjectId(idResena),
      respuestas: {
        $elemMatch: { _id: new ObjectId(idRespuesta), id_usuario: idUsuarioAutor },
      },
    },
    {
      $set: {
        "respuestas.$.texto": nuevoTexto.trim(),
        "respuestas.$.editada": true,
      },
    } as never
  )
  return result.modifiedCount > 0
}

/**
 * Cambia el estado (publicada / oculta) de una respuesta.
 * Solo admin-sede y admin-global pueden invocarla.
 */
export async function cambiarEstadoRespuesta(
  idResena: string,
  idRespuesta: string,
  estado: "publicada" | "oculta"
): Promise<boolean> {
  const db = await getMongoDB()
  const result = await db.collection("resenas").updateOne(
    {
      _id: new ObjectId(idResena),
      "respuestas._id": new ObjectId(idRespuesta),
    },
    { $set: { "respuestas.$.estado": estado } } as never
  )
  return result.modifiedCount > 0
}

/**
 * Elimina una respuesta. La puede borrar el autor original o un admin.
 * `puedeEliminarTodas` decide si la sesión es admin.
 */
export async function eliminarRespuesta(
  idResena: string,
  idRespuesta: string,
  idUsuarioSesion: number,
  puedeEliminarTodas: boolean
): Promise<boolean> {
  const db = await getMongoDB()
  const _idResena = new ObjectId(idResena)
  const _idRespuesta = new ObjectId(idRespuesta)

  // Verificar autoria si no es admin
  if (!puedeEliminarTodas) {
    const doc = await db
      .collection<Resena>("resenas")
      .findOne(
        { _id: _idResena, "respuestas._id": _idRespuesta },
        { projection: { respuestas: 1 } }
      )
    const r = doc?.respuestas?.find((x) => x._id.equals(_idRespuesta))
    if (!r || r.id_usuario !== idUsuarioSesion) return false
  }

  const result = await db
    .collection("resenas")
    .updateOne(
      { _id: _idResena },
      { $pull: { respuestas: { _id: _idRespuesta } } } as never
    )
  return result.modifiedCount > 0
}

/**
 * Toggle de voto sobre una RESPUESTA (subdocumento de una reseña).
 * Reglas identicas al voto de resena pero usando arrayFilters de Mongo
 * para llegar al elemento correcto del array anidado.
 */
export async function votarRespuesta(
  idResena: string,
  idRespuesta: string,
  idUsuario: number,
  idSede: number,
  voto: "like" | "dislike"
): Promise<{ likes: number; dislikes: number; voto_propio: "like" | "dislike" | null } | null> {
  const db = await getMongoDB()
  const _idResena = new ObjectId(idResena)
  const _idRespuesta = new ObjectId(idRespuesta)
  const col = db.collection<Resena>("resenas")

  // Buscar el voto previo del usuario en esa respuesta
  const doc = await col.findOne(
    { _id: _idResena, "respuestas._id": _idRespuesta },
    { projection: { "respuestas.$": 1 } }
  )
  const resp = doc?.respuestas?.[0]
  if (!resp) return null

  const votoPrevio = (resp.votos ?? []).find((v) => v.id_usuario === idUsuario)

  const arrayFilters = [{ "r._id": _idRespuesta }]

  if (!votoPrevio) {
    // 1) Primer voto
    await col.updateOne(
      { _id: _idResena },
      {
        $push: {
          "respuestas.$[r].votos": { id_usuario: idUsuario, id_sede: idSede, voto, fecha: new Date() },
        },
        $inc:
          voto === "like"
            ? { "respuestas.$[r].likes": 1 }
            : { "respuestas.$[r].dislikes": 1 },
      } as never,
      { arrayFilters }
    )
  } else if (votoPrevio.voto === voto) {
    // 2) Toggle off
    await col.updateOne(
      { _id: _idResena },
      {
        $pull: { "respuestas.$[r].votos": { id_usuario: idUsuario } },
        $inc:
          voto === "like"
            ? { "respuestas.$[r].likes": -1 }
            : { "respuestas.$[r].dislikes": -1 },
      } as never,
      { arrayFilters }
    )
  } else {
    // 3) Cambio de voto
    await col.updateOne(
      { _id: _idResena },
      {
        $pull: { "respuestas.$[r].votos": { id_usuario: idUsuario } },
        $inc:
          voto === "like"
            ? { "respuestas.$[r].likes": 1, "respuestas.$[r].dislikes": -1 }
            : { "respuestas.$[r].likes": -1, "respuestas.$[r].dislikes": 1 },
      } as never,
      { arrayFilters }
    )
    await col.updateOne(
      { _id: _idResena },
      {
        $push: {
          "respuestas.$[r].votos": { id_usuario: idUsuario, id_sede: idSede, voto, fecha: new Date() },
        },
      } as never,
      { arrayFilters }
    )
  }

  // Releer el estado final
  const actualizado = await col.findOne(
    { _id: _idResena, "respuestas._id": _idRespuesta },
    { projection: { "respuestas.$": 1 } }
  )
  const respFinal = actualizado?.respuestas?.[0]
  if (!respFinal) return null
  const propio = (respFinal.votos ?? []).find((v) => v.id_usuario === idUsuario)
  return {
    likes: respFinal.likes ?? 0,
    dislikes: respFinal.dislikes ?? 0,
    voto_propio: propio?.voto ?? null,
  }
}

/**
 * Reseña que el cliente ya escribió para un producto (en cualquier compra).
 * Se usa en la ficha del producto para mostrar/editar/borrar su reseña.
 */
export async function getMiResenaProducto(
  idCliente: number,
  idProducto: number
): Promise<ResenaMia | null> {
  const db = await getMongoDB()
  const doc = await db
    .collection<Resena>("resenas")
    .findOne({ id_cliente: idCliente, id_producto: idProducto })
  if (!doc) return null
  return {
    _id: doc._id!.toString(),
    id_producto: doc.id_producto,
    rating: doc.rating,
    titulo: doc.titulo,
    texto: doc.texto,
  }
}
