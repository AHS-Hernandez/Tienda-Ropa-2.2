import { NextResponse } from "next/server"

/** Evita cuerpo vacío si NextResponse.json falla al serializar (Decimal, Buffer, etc.). */
export function jsonData(
  body: unknown,
  init?: { status?: number }
): NextResponse {
  try {
    JSON.stringify(body)
    return NextResponse.json(body, { status: init?.status ?? 200 })
  } catch (error) {
    console.error("[jsonData] serialización fallida", error)
    return NextResponse.json(
      { ok: false, message: "Error al preparar la respuesta para la interfaz." },
      { status: 500 }
    )
  }
}
