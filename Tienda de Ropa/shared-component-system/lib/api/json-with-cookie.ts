import { NextResponse } from "next/server"
import {
  VENTA_BORRADOR_COOKIE,
  ventaBorradorCookieOptions,
} from "@/lib/cart/cookie-options"

export function jsonWithVentaCookie(
  data: Record<string, unknown>,
  idVenta: number | null,
  init?: { status?: number }
) {
  const res = NextResponse.json(data, init)
  if (idVenta) {
    const opts = ventaBorradorCookieOptions(idVenta)
    res.cookies.set(VENTA_BORRADOR_COOKIE, opts.value!, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    })
  }
  return res
}
