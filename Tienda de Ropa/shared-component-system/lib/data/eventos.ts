import { getMongoDB } from "@/lib/db/mongo"

export type TipoEvento =
  | "vista_producto"
  | "busqueda"
  | "agregar_carrito"
  | "abandono"

export interface Evento {
  id_cliente: number
  tipo: TipoEvento
  id_producto?: number
  id_categoria?: number
  termino_busqueda?: string
  session_id: string
  id_sede: number
  ts: Date
  meta?: Record<string, unknown>
}

export async function insertarEvento(evento: Omit<Evento, "ts">): Promise<void> {
  const db = await getMongoDB()
  await db.collection("eventos").insertOne({ ...evento, ts: new Date() })
}

export async function invalidarFeed(idCliente: number): Promise<void> {
  const db = await getMongoDB()
  await db.collection("feed_cliente").deleteOne({ id_cliente: idCliente })
}
