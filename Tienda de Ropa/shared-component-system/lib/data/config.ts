import { queryOne, queryRows } from "@/lib/db/query"

export async function getIdSedeCentral(): Promise<number> {
  const row = await queryOne<{ id_sede: number }>(
    `SELECT id_sede FROM Configuracion.Sede WHERE Es_Central = 1`
  )
  return row?.id_sede ?? 1
}

export async function getSedesActivas(): Promise<
  { id_sede: number; Nombre: string; Es_Central: boolean }[]
> {
  const rows = await queryRows<{
    id_sede: number
    Nombre: string
    Es_Central: boolean
  }>(
    `SELECT id_sede, Nombre, CAST(Es_Central AS BIT) AS Es_Central
     FROM Configuracion.Sede
     WHERE Activa = 1
     ORDER BY Es_Central DESC, Nombre`
  )
  return rows.map((r) => ({
    id_sede: Number(r.id_sede),
    Nombre: String(r.Nombre),
    Es_Central: Boolean(r.Es_Central),
  }))
}
