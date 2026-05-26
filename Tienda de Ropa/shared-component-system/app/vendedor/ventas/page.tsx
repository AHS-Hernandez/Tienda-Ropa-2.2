"use client"

import { useEffect, useState } from "react"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"
import { Loader2 } from "lucide-react"

export default function VendedorVentasPage() {
  const [ventas, setVentas] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vendedor/ventas?mode=hoy")
      .then((r) => r.json())
      .then((d) => d.ok && setVentas(d.ventas))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Record<string, unknown>>[] = [
    { key: "Nro_factura", header: "Factura", render: (r) => String(r.Nro_factura ?? "—") },
    { key: "Cliente_Nombre", header: "Cliente" },
    { key: "Fecha_emision", header: "Hora", render: (r) => formatDate(String(r.Fecha_emision)) },
    {
      key: "Estado",
      header: "Estado",
      render: (r) => (
        <StatusBadge variant={ventaEstadoVariant(String(r.Estado))} dot>
          {String(r.Estado)}
        </StatusBadge>
      ),
    },
    { key: "Total_neto", header: "Total", render: (r) => formatMoney(Number(r.Total_neto)) },
    { key: "Cajero_Nombre", header: "Cajero" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ventas del día</h1>
        <p className="text-sm text-muted-foreground">vw_Monitor_Ventas_Cabecera — sede y fecha actual</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <ModernTable data={ventas} columns={columns} keyExtractor={(r) => String(r.id_venta)} />
      )}
    </div>
  )
}
