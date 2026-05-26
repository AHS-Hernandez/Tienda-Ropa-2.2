import { getDbPool, sql } from "@/lib/db"

export async function queryRows<T extends Record<string, unknown>>(
  queryText: string,
  inputs?: Record<string, unknown>
): Promise<T[]> {
  const pool = await getDbPool()
  const request = pool.request()

  if (inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar, null)
      } else if (typeof value === "number") {
        request.input(key, Number.isInteger(value) ? sql.Int : sql.Decimal(18, 2), value)
      } else if (typeof value === "boolean") {
        request.input(key, sql.Bit, value)
      } else {
        request.input(key, sql.NVarChar, String(value))
      }
    }
  }

  const result = await request.query<T>(queryText)
  return result.recordset ?? []
}

export async function queryOne<T extends Record<string, unknown>>(
  queryText: string,
  inputs?: Record<string, unknown>
): Promise<T | null> {
  const rows = await queryRows<T>(queryText, inputs)
  return rows[0] ?? null
}

/** Intenta vista con Linked Server; si falla, usa consulta local equivalente. */
export async function queryLinkedOrLocal<T extends Record<string, unknown>>(
  linkedSql: string,
  localSql: string,
  inputs?: Record<string, unknown>
): Promise<{ rows: T[]; source: "linked" | "local" }> {
  try {
    const rows = await queryRows<T>(linkedSql, inputs)
    return { rows, source: "linked" }
  } catch {
    const rows = await queryRows<T>(localSql, inputs)
    return { rows, source: "local" }
  }
}
