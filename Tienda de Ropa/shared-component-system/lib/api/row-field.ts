/** Lee un campo de fila SQL ignorando mayúsculas/minúsculas del driver. */
export function rowField(
  row: Record<string, unknown>,
  ...names: string[]
): unknown {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name]
    const hit = Object.keys(row).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    )
    if (hit != null && row[hit] !== undefined && row[hit] !== null) {
      return row[hit]
    }
  }
  return undefined
}

export function rowStr(
  row: Record<string, unknown>,
  ...names: string[]
): string {
  const v = rowField(row, ...names)
  return v != null ? String(v) : ""
}
