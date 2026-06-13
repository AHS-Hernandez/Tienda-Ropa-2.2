import { queryRows } from "@/lib/db/query"

export async function getNombresProductos(
  ids: number[]
): Promise<Record<number, string>> {
  if (!ids.length) return {}
  try {
    const lista = ids.join(",")
    const rows = await queryRows<{ id_producto: number; nombre: string }>(
      `SELECT id_producto, Nombre AS nombre
       FROM Producto.Producto
       WHERE id_producto IN (${lista})`
    )
    const map: Record<number, string> = {}
    for (const r of rows) map[r.id_producto] = r.nombre
    return map
  } catch {
    return {}
  }
}

export async function getNombresClientes(
  ids: number[]
): Promise<Record<number, string>> {
  if (!ids.length) return {}
  try {
    const lista = ids.join(",")
    const rows = await queryRows<{ id_cliente: number; nombre: string }>(
      `SELECT cl.id_cliente,
              ISNULL(NULLIF(TRIM(ISNULL(p.Nombre,'') + ' ' + ISNULL(p.Apellido,'')), ''), u.Username) AS nombre
       FROM Persona.Cliente cl
       INNER JOIN Persona.Persona p ON p.id_persona = cl.id_persona
       LEFT JOIN Seguridad.Usuario u ON u.id_persona = p.id_persona AND u.Nivel_acceso = 1
       WHERE cl.id_cliente IN (${lista})`
    )
    const map: Record<number, string> = {}
    for (const r of rows) map[r.id_cliente] = r.nombre
    return map
  } catch {
    return {}
  }
}
