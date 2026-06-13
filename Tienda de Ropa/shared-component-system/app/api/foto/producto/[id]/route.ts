import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getFotosProducto, agregarFoto, eliminarFoto } from "@/lib/data/fotos"

const EXTENSIONES_VALIDAS = new Set(["jpg", "jpeg", "png", "webp", "gif"])

/** Devuelve la lista de fotos de un producto (JSON). Sin autenticación. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const idProducto = Number(id)
  if (!idProducto) return NextResponse.json({ ok: false, message: "id inválido" }, { status: 400 })

  try {
    const fotos = await getFotosProducto(idProducto)
    return NextResponse.json({ ok: true, fotos })
  } catch {
    return NextResponse.json({ ok: false, fotos: [] })
  }
}

/** Sube un archivo al servidor y registra la ruta en MongoDB ref_productos.fotos */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession(["admin-sede", "admin-global"])
  if (sessionIsResponse(session)) return session

  const { id } = await params
  const idProducto = Number(id)
  if (!idProducto) return NextResponse.json({ ok: false, message: "id inválido" }, { status: 400 })

  try {
    const formData = await request.formData()
    const archivo = formData.get("foto") as File | null

    if (!archivo || archivo.size === 0) {
      return NextResponse.json({ ok: false, message: "No se recibió archivo" }, { status: 400 })
    }
    if (archivo.size > 3 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "La imagen supera 3 MB" }, { status: 400 })
    }

    const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg"
    if (!EXTENSIONES_VALIDAS.has(ext)) {
      return NextResponse.json({ ok: false, message: "Formato no válido (jpg, png, webp)" }, { status: 400 })
    }

    const buffer = Buffer.from(await archivo.arrayBuffer())
    const ruta = await agregarFoto(idProducto, buffer, ext)

    return NextResponse.json({ ok: true, ruta })
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error al subir foto" },
      { status: 500 }
    )
  }
}

/** Elimina una foto del disco y del array en MongoDB */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession(["admin-sede", "admin-global"])
  if (sessionIsResponse(session)) return session

  const { id } = await params
  const idProducto = Number(id)
  if (!idProducto) return NextResponse.json({ ok: false, message: "id inválido" }, { status: 400 })

  try {
    const { ruta } = await request.json()
    if (!ruta || typeof ruta !== "string") {
      return NextResponse.json({ ok: false, message: "ruta requerida" }, { status: 400 })
    }
    await eliminarFoto(idProducto, ruta)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error al eliminar" },
      { status: 500 }
    )
  }
}
