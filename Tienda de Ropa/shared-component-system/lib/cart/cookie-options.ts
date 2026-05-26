import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"

export const VENTA_BORRADOR_COOKIE = "sc_venta_borrador"

export function ventaBorradorCookieOptions(idVenta: number): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
    value: String(idVenta),
  }
}
