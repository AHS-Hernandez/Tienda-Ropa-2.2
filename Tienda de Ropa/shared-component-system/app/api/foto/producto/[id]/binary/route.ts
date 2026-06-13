import { NextResponse } from "next/server"
import { getMongoDB } from "@/lib/db/mongo"

/**
 * Sirve la imagen binaria de un producto desde la coleccion imagenes_producto
 * de MongoDB (donde Sede subio las imagenes como base64).
 *
 * GET /api/foto/producto/123/binary
 *   -> Content-Type: image/jpeg
 *   -> body: bytes decodificados de base64
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const idProducto = Number(id)
  if (!idProducto) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    const db = await getMongoDB()
    const doc = await db
      .collection("imagenes_producto")
      .findOne({ id_producto: idProducto }, { projection: { base64: 1 } })

    if (!doc?.base64) {
      return NextResponse.json({ ok: false, message: "Sin imagen" }, { status: 404 })
    }

    const buffer = Buffer.from(doc.base64 as string, "base64")
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}
