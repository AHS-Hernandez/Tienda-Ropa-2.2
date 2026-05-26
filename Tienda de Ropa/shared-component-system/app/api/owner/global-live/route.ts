import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonData } from "@/lib/api/json-response"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import {
  getRedClientesGlobal,
  getRedEmpleadosGlobal,
  getRedStockSedeTiempoReal,
  getRedVentasHoyGlobal,
} from "@/lib/data/red-tiempo-real"
import { getSqlErrorMessage } from "@/lib/db/errors"

function pack(block: Awaited<ReturnType<typeof getRedVentasHoyGlobal>>) {
  return {
    rows: sanitizeRows(block.rows),
    error: block.error,
    warning: block.warning,
    linkedError: block.linkedError,
    source: block.source,
    count: block.rows.length,
  }
}

export async function GET() {
  try {
    const session = await requireApiSession(["admin-global"])
    if (sessionIsResponse(session)) return session

    const [ventas, empleados, clientes, stock] = await Promise.all([
      getRedVentasHoyGlobal(),
      getRedEmpleadosGlobal(),
      getRedClientesGlobal(),
      getRedStockSedeTiempoReal(),
    ])

    const blocks = [ventas, empleados, clientes, stock]
    const linkedServer = blocks.every(
      (b) => (b.source === "linked" || b.source === "proxy") && !b.error
    )
    const partialCentral = blocks.some(
      (b) => b.source === "local" && b.rows.length > 0
    )

    const dbServer = process.env.DB_SERVER ?? "?"
    const dbUser = process.env.DB_USER ?? "?"

    return jsonData({
      ok: true,
      linkedServer,
      partialCentral,
      dbServer,
      dbUser,
      linkedHint: partialCentral
        ? `SSMS suele usar otro login; la app usa ${dbUser}@${dbServer}. Ejecute SQL/SQL-Grant-LinkedServer-login_nivel4.sql en master.`
        : null,
      ventas: pack(ventas),
      empleados: pack(empleados),
      clientes: pack(clientes),
      stock: pack(stock),
    })
  } catch (error) {
    console.error("[owner/global-live]", error)
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}
