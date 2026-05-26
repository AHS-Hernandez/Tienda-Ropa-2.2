"use client"

import { useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { Loader2 } from "lucide-react"

export default function VendedorStockPage() {
  const [stock, setStock] = useState<Record<string, unknown>[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vendedor/stock")
      .then((r) => r.json())
      .then((d) => d.ok && setStock(d.stock))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stock.filter((r) => {
    if (!q) return true
    const n = String(r.Nombre ?? "").toLowerCase()
    return n.includes(q.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock</h1>
        <p className="text-sm text-muted-foreground">Inventario.vw_Disponibilidad_Stock</p>
      </div>
      <PageToolbar search={q} onSearchChange={setQ} />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <DataTableView
          rows={filtered}
          columnKeys={["Nombre", "Talla", "Color", "Cantidad_Disponible"]}
          loading={loading}
        />
      )}
    </div>
  )
}
