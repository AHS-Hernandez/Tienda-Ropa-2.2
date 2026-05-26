import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getMonitorVentas } from "@/lib/data/ventas"
import {
  getResumenHoySede,
  getVentasUltimos7Dias,
  getAlertasStockSede,
} from "@/lib/data/dashboard"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { formatMoney } from "@/lib/format"
import { LOCALE } from "@/lib/locale"

function dayLabel(d: unknown): string {
  const date = d instanceof Date ? d : new Date(String(d))
  return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric" })
}

export async function GET() {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const [resumen, serie, alertas, ventasHoy] = await Promise.all([
      getResumenHoySede(session.id_sede),
      getVentasUltimos7Dias(),
      getAlertasStockSede(session.id_sede),
      getMonitorVentas({ idSede: session.id_sede, soloHoy: true }),
    ])

    const chartData = serie.map((r) => ({
      name: dayLabel(r.dia),
      ventas: Number(r.total_neto ?? 0),
      pedidos: Number(r.transacciones ?? 0),
    }))

    const stats = [
      {
        label: "Ventas del día",
        value: formatMoney(Number(resumen?.total_neto ?? 0)),
        sub: `${resumen?.transacciones ?? 0} transacciones`,
      },
      {
        label: "Ticket promedio",
        value: formatMoney(Number(resumen?.ticket_promedio ?? 0)),
        sub: "Ventas.vw_Resumen_Ventas_Hoy_Sede",
      },
      {
        label: "Clientes únicos",
        value: String(resumen?.clientes_unicos ?? 0),
        sub: "Hoy en esta sede",
      },
      {
        label: "Alertas stock",
        value: String(alertas.length),
        sub: "Inventario.vw_Alertas_Stock_Bajo",
      },
    ]

    const recentSales = ventasHoy.slice(0, 8).map((v) => ({
      id: String(v.Nro_factura ?? v.id_venta),
      customer: String(v.Cliente_Nombre ?? v.Razon_Social ?? "Cliente"),
      amount: Number(v.Total_neto ?? 0),
      time: v.Fecha_emision
        ? new Date(String(v.Fecha_emision)).toLocaleTimeString(LOCALE, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      estado: String(v.Estado ?? ""),
    }))

    const lowStock = alertas.slice(0, 8).map((a, i) => ({
      name: String(a.Producto),
      stock: Number(a.Cantidad),
      nivel: String(a.Nivel_Alerta),
      key: i,
    }))

    return NextResponse.json({
      ok: true,
      stats,
      chartData,
      recentSales,
      lowStock,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}
