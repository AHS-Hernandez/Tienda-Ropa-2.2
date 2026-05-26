import { CURRENCY, LOCALE } from "@/lib/locale"

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(value)
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

export function stockStatus(cantidad: number): "in-stock" | "low-stock" | "out-of-stock" {
  if (cantidad <= 0) return "out-of-stock"
  if (cantidad <= 5) return "low-stock"
  return "in-stock"
}

export function ventaEstadoVariant(
  estado: string
): "success" | "warning" | "info" | "neutral" {
  const e = estado.toLowerCase()
  if (e === "completada" || e === "entregada") return "success"
  if (e === "borrador") return "warning"
  return "neutral"
}
