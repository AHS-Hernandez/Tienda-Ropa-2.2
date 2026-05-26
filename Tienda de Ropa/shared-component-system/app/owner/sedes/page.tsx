"use client"

import { useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Loader2 } from "lucide-react"

export default function OwnerSedesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/sedes")
      .then((r) => r.json())
      .then((d) => d.ok && setRows(d.sedes))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sedes y réplica</h1>
        <p className="text-sm text-muted-foreground">Configuracion.vw_Estado_Red</p>
      </div>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <DataTableView
          rows={rows}
          columnKeys={[
            "Sede",
            "IP_Servidor",
            "Activa",
            "Tabla_nombre",
            "Ultima_sync",
            "Estado_Replica",
            "Detalle_error",
          ]}
        />
      )}
    </div>
  )
}
