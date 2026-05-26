import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  getVentasUltimos7Dias,
  getVentasPorCategoria7Dias,
  getVentasHoyCentral,
  countStockCriticoCentral,
} from "@/lib/data/dashboard"
import { getEstadoRed, getBitacora } from "@/lib/data/admin"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { formatMoney } from "@/lib/format"
import { LOCALE } from "@/lib/locale"

function dayLabel(d: unknown): string {
  const date = d instanceof Date ? d : new Date(String(d))
  return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric" })
}

export async function GET() {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const [serie, categorias, ventasHoy, stockCritico, sedes, bitacora] = await Promise.all([
      getVentasUltimos7Dias().catch(() => [] as Record<string, unknown>[]),
      getVentasPorCategoria7Dias().catch(() => [] as Record<string, unknown>[]),
      getVentasHoyCentral().catch(() => [] as Record<string, unknown>[]),
      countStockCriticoCentral().catch(() => 0),
      getEstadoRed().catch(() => [] as Record<string, unknown>[]),
      getBitacora().catch(() => [] as Record<string, unknown>[]),
    ])

    const chartData = serie.map((r) => ({
      name: dayLabel(r.dia),
      ventas: Number(r.total_neto ?? 0),
      pedidos: Number(r.transacciones ?? 0),
    }))

    const total7 = chartData.reduce((s, d) => s + d.ventas, 0)
    const categoryData = categorias.map((c) => ({
      name: String(c.categoria),
      value: Number(c.total ?? 0),
    }))

    const ventasHoyList = ventasHoy
    const totalHoy = ventasHoyList.reduce(
      (s, v) => s + Number(v.Total_neto ?? 0),
      0
    )

    const globalStats = [
      { label: "Ventas hoy (Central)", value: formatMoney(totalHoy), hint: "Ventas.Venta_Cabecera · Es_Central" },
      { label: "Ventas 7 días", value: formatMoney(total7), hint: "Ventas.vw_Ventas_Ultimos_7_Dias" },
      { label: "Sedes en red", value: String(sedes.length), hint: "Configuracion.vw_Estado_Red" },
      { label: "Stock crítico (Central)", value: String(stockCritico), hint: "Inventario.Stock_Actual" },
    ]

    const branches = sedes.map((s) => ({
      name: String(s.Sede ?? s.Nombre),
      estado: String(s.Estado_Replica ?? (s.Activa ? "Activa" : "Inactiva")),
      esCentral: false,
    }))

    const recentOrders = ventasHoyList.slice(0, 6).map((v) => ({
      id: String(v.Nro_factura ?? v.id_venta),
      customer: String(v.Cliente_Nombre ?? "Cliente"),
      amount: Number(v.Total_neto ?? 0),
      time: v.Fecha_emision
        ? new Date(String(v.Fecha_emision)).toLocaleTimeString(LOCALE, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      status: String(v.Estado ?? ""),
    }))

    const activities = bitacora.slice(0, 8).map((b, i) => ({
      id: i,
      type: String(b.Accion ?? "").toLowerCase().includes("login") ? "update" : "sale",
      action: String(b.Accion ?? "Evento"),
      description: `${b.Tabla_afectada ?? ""} ${b.Valor_nuevo ?? ""}`.trim(),
      user: String(b.Usuario ?? b.Username ?? "Sistema"),
      time: b.Fecha_hora
        ? new Date(String(b.Fecha_hora)).toLocaleString(LOCALE, {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "",
    }))

    return NextResponse.json({
      ok: true,
      scope: "central",
      globalStats,
      chartData,
      categoryData,
      branches,
      recentOrders,
      activities,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}
