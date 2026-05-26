import { cookies } from "next/headers"
import { VENTA_BORRADOR_COOKIE, ventaBorradorCookieOptions } from "@/lib/cart/cookie-options"

export { VENTA_BORRADOR_COOKIE }

export async function getVentaBorradorId(): Promise<number | null> {
  const store = await cookies()
  const val = store.get(VENTA_BORRADOR_COOKIE)?.value
  if (!val) return null
  const id = parseInt(val, 10)
  return Number.isNaN(id) ? null : id
}

export async function setVentaBorradorId(idVenta: number): Promise<void> {
  const store = await cookies()
  store.set(VENTA_BORRADOR_COOKIE, ventaBorradorCookieOptions(idVenta).value!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  })
}

export async function clearVentaBorradorId(): Promise<void> {
  const store = await cookies()
  store.delete(VENTA_BORRADOR_COOKIE)
}
