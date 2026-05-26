"use client"

import { useEffect, useState } from "react"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Loader2 } from "lucide-react"

export default function AdminReportesPage() {
  const [ventas, setVentas] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin-sede/ventas")
      .then((r) => r.json())
      .then((d) => d.ok && setVentas(d.ventas))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Record<string, unknown>>[] = [
    { key: "Nro_factura", header: "Factura" },
    { key: "Cliente_Nombre", header: "Cliente" },
    { key: "Fecha_emision", header: "Fecha", render: (r) => formatDate(String(r.Fecha_emision)) },
    {
      key: "Estado",
      header: "Estado",
      render: (r) => (
        <StatusBadge variant={ventaEstadoVariant(String(r.Estado))} dot>
          {String(r.Estado)}
        </StatusBadge>
      ),
    },
    { key: "Total_neto", header: "Neto", render: (r) => formatMoney(Number(r.Total_neto)) },
    { key: "Cajero_Nombre", header: "Cajero" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes de ventas</h1>
        <p className="text-sm text-muted-foreground">Ventas.vw_Monitor_Ventas_Cabecera — sede actual</p>
      </div>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <ModernTable data={ventas} columns={columns} keyExtractor={(r) => String(r.id_venta)} />
      )}
    </div>
  )
}
