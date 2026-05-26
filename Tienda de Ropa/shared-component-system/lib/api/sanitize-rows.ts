/** Valores serializables para NextResponse.json (evita Decimal/Date que rompen el body). */
export function sanitizeRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value == null) {
      out[key] = null
      continue
    }
    if (value instanceof Date) {
      out[key] = value.toISOString()
      continue
    }
    if (typeof value === "bigint") {
      out[key] = Number(value)
      continue
    }
    if (Buffer.isBuffer(value)) {
      out[key] = value.toString("utf8")
      continue
    }
    if (typeof value === "object" && "valueOf" in value) {
      const raw = (value as { valueOf: () => unknown }).valueOf()
      if (raw !== value) {
        if (raw instanceof Date) {
          out[key] = raw.toISOString()
          continue
        }
        const n = Number(raw)
        out[key] = Number.isNaN(n) ? String(raw) : n
        continue
      }
    }
    if (typeof value === "object") {
      try {
        JSON.stringify(value)
        out[key] = value
      } catch {
        out[key] = String(value)
      }
      continue
    }
    out[key] = value
  }
  return out
}

export function sanitizeRows(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map(sanitizeRow)
}
