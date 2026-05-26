import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getAlertasStockSede } from "@/lib/data/dashboard"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  if (session.role === "cliente") {
    return NextResponse.json({ ok: true, notifications: [] })
  }

  try {
    const alertas = await getAlertasStockSede(session.id_sede)
    const notifications = alertas.slice(0, 6).map((a, i) => ({
      id: i + 1,
      title: `Stock ${a.Nivel_Alerta}`,
      message: `${a.Producto} — ${a.Cantidad} uds (${a.Sede})`,
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
