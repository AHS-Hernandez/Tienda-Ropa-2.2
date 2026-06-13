import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { queryRows } from "@/lib/db/query"

export async function GET() {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  if (session.role === "cliente") {
    return NextResponse.json({ ok: true, notifications: [] })
  }

  try {
    let alertas: { producto: string; subcategoria: string; stock_actual: number; umbral: number }[] = []

    if (session.role === "admin-global") {
      // Owner ve todas las sedes via vw_Stock_Bajo (usa umbrales configurados)
      alertas = await queryRows(
        `SELECT TOP 10 producto, subcategoria, stock_actual, umbral
         FROM Inventario.vw_Stock_Bajo
         ORDER BY stock_actual ASC`
      )
    } else {
      // Admin-sede y vendedor usan la vista local con umbrales configurados
      // Si no existe vw_Stock_Bajo_Local cae silenciosamente
      try {
        alertas = await queryRows(
          `SELECT TOP 10 producto, subcategoria, stock_actual, umbral
           FROM Inventario.vw_Stock_Bajo_Local
           ORDER BY stock_actual ASC`
        )
      } catch {
        alertas = []
      }
    }

    const notifications = alertas.map((a, i) => ({
      id: i + 1,
      title: a.stock_actual === 0 ? "Sin stock" : "Stock bajo",
      message: `${a.producto} — ${a.stock_actual} uds (mín. ${a.umbral})`,
      read: false,
      time: "Ahora",
    }))

    return NextResponse.json({ ok: true, notifications })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error), notifications: [] },
      { status: 500 }
    )
  }
}
