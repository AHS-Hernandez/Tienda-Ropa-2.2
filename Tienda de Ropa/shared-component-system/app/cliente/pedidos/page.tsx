"use client"

import { useEffect, useState } from "react"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatMoney, formatDate, ventaEstadoVariant } from "@/lib/format"
import { Loader2 } from "lucide-react"

export default function ClientePedidosPage() {
  const [pedidos, setPedidos] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/cliente/pedidos")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        setPedidos(d.pedidos)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Record<string, unknown>>[] = [
    { key: "Nro_factura", header: "Factura", render: (r) => String(r.Nro_factura ?? "Borrador") },
    {
      key: "Fecha_emision",
      header: "Fecha",
      render: (r) => formatDate(String(r.Fecha_emision)),
    },
    { key: "Estado", header: "Estado", render: (r) => (
      <StatusBadge variant={ventaEstadoVariant(String(r.Estado))} dot>
        {String(r.Estado)}
      </StatusBadge>
    )},
    {
      key: "Total_neto",
      header: "Total",
      render: (r) => formatMoney(Number(r.Total_neto)),
    },
    { key: "Metodo_pago", header: "Pago" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground">Ventas.vw_Monitor_Ventas_Cabecera</p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ModernTable
          data={pedidos}
          columns={columns}
          keyExtractor={(r) => String(r.id_venta)}
          emptyState={<p className="text-center text-muted-foreground">Sin pedidos</p>}
        />
      )}
    </div>
  )
}
