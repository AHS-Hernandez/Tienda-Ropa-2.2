import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { buscarProductosCompra } from "@/lib/data/producto"
import { getReporteAjustes, ejecutarAjusteInventario } from "@/lib/data/inventario"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  try {
    if (searchParams.get("productos") === "1" && q) {
      const productos = await buscarProductosCompra(q)
      return NextResponse.json({ ok: true, productos })
    }

    const ajustes = await getReporteAjustes(session.id_sede)
    return NextResponse.json({ ok: true, ajustes })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    await ejecutarAjusteInventario({
      idUsuario: session.id_usuario,
      idProducto: Number(body.id_producto),
      tipoAjuste: String(body.tipo_ajuste),
      motivo: String(body.motivo),
      cantidad: Number(body.cantidad),
      idSede: session.id_sede,
    })
    const ajustes = await getReporteAjustes(session.id_sede)
    return NextResponse.json({ ok: true, message: "Ajuste registrado", ajustes })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}
