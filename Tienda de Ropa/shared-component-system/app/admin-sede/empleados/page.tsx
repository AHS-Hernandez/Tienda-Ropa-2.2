"use client"

import { useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Loader2 } from "lucide-react"

export default function AdminEmpleadosPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin-sede/empleados")
      .then((r) => r.json())
      .then((d) => d.ok && setRows(d.empleados))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Empleados</h1>
        <p className="text-sm text-muted-foreground">Persona.vw_Directorio_RRHH</p>
      </div>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <DataTableView
          rows={rows}
          columnKeys={[
            "Nombre_completo",
            "CI",
            "Telefono",
            "Email",
            "Fecha_contratacion",
            "Salario_base",
          ]}
        />
      )}
    </div>
  )
}
