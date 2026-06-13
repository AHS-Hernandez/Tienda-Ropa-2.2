"use client"

import { useMemo } from "react"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { Database } from "lucide-react"
import { formatMoney } from "@/lib/format"
import { LOCALE } from "@/lib/locale"
import { rowField } from "@/lib/api/row-field"

interface DataTableViewProps {
  title?: string
  rows: Record<string, unknown>[]
  columnKeys?: string[]
  searchKeys?: string[]
  loading?: boolean
  emptyTitle?: string
  onRowClick?: (row: Record<string, unknown>) => void
}

export function DataTableView({
  rows,
  columnKeys,
  searchKeys,
  loading,
  emptyTitle = "Sin registros",
  onRowClick,
}: DataTableViewProps) {
  const keys =
    columnKeys ??
    (rows[0] ? Object.keys(rows[0]).filter((k) => !k.startsWith("_")) : [])

  const columns: Column<Record<string, unknown>>[] = keys.map((key) => ({
    key,
    header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    render: (item) => {
      const val = item[key]
      if (val instanceof Date) return val.toLocaleString(LOCALE)
      if (typeof val === "number" && key.toLowerCase().includes("total")) {
        return formatMoney(val)
      }
      return String(val ?? "—")
    },
  }))

  const filtered = useMemo(() => rows, [rows])

  if (!loading && filtered.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title={emptyTitle}
        description="No hay datos que coincidan con el criterio actual."
      />
    )
  }

  return (
    <ModernTable
      data={filtered}
      columns={columns}
      loading={loading}
      onRowClick={onRowClick}
      keyExtractor={(r, index) => {
        const id = rowField(
          r,
          "id_log",
          "id_venta",
          "id_empleado",
          "id_cliente",
          "id_categoria",
          "id_subcategoria",
          "id_producto",
          "id_compra",
          "id_usuario",
          "id_promocion",
          "id_proveedor"
        )
        if (id != null && id !== "") return String(id)
        const sede = rowField(r, "Sede", "sede")
        const nombre = rowField(r, "Nombre", "Producto", "Nombre_completo")
        return `${String(sede ?? "row")}-${String(nombre ?? index)}-${index}`
      }}
    />
  )
}
