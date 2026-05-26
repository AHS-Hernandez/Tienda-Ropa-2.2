"use client"

import { useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Loader2 } from "lucide-react"

export default function OwnerBitacoraPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/owner/bitacora")
      .then((r) => r.json())
      .then((d) => d.ok && setRows(d.bitacora))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bitácora</h1>
        <p className="text-sm text-muted-foreground">Seguridad.vw_Trazabilidad_Bitacora</p>
      </div>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <DataTableView
          rows={rows}
          columnKeys={[
            "Fecha_hora",
            "Usuario",
            "Accion",
            "Tabla_afectada",
            "Valor_anterior",
            "Valor_nuevo",
          ]}
        />
      )}
    </div>
  )
}
