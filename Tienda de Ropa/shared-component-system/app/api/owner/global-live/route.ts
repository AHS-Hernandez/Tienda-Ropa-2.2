import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonData } from "@/lib/api/json-response"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import {
  getRedClientesGlobal,
  getRedEmpleadosGlobal,
  getRedStockSedeTiempoReal,
  getRedVentasHoyGlobal,
  getRedVentasGlobal,
  type RedTiempoRealBlock,
} from "@/lib/data/red-tiempo-real"
import { getSqlErrorMessage } from "@/lib/db/errors"

function pack(block: RedTiempoRealBlock) {
  return {
    rows: sanitizeRows(block.rows),
    error: block.error,
    warning: block.warning,
    linkedError: block.linkedError,
    source: block.source,
    count: block.rows.length,
  }
}

// Si una consulta individual falla (timeout, error), se devuelve un bloque
// vacio con el error para que las demas se sigan mostrando. Antes usabamos
// Promise.all y un solo timeout tumbaba toda la pagina.
async function safe(
  loader: () => Promise<RedTiempoRealBlock>
): Promise<RedTiempoRealBlock> {
  try {
    return await loader()
  } catch (err) {
    return {
      rows: [],
      error: getSqlErrorMessage(err),
      warning: null,
      linkedError: getSqlErrorMessage(err),
      source: "local",
    }
  }
}

export async function GET() {
  try {
    const session = await requireApiSession(["admin-global"])
    if (sessionIsResponse(session)) return session

    const [ventas, ventasGlobal, empleados, clientes, stock] = await Promise.all([
      safe(getRedVentasHoyGlobal),
      safe(getRedVentasGlobal),
      safe(getRedEmpleadosGlobal),
      safe(getRedClientesGlobal),
      safe(getRedStockSedeTiempoReal),
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
      ventasGlobal: pack(ventasGlobal),
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
