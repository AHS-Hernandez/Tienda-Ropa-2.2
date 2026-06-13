/** Convierte a entero SQL válido (>0) o null (evita 0/NaN en alcances). */
export function toPositiveInt(v: unknown): number | null {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}
