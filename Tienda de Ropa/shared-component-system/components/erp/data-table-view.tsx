"use client"

import { useMemo } from "react"
import { ModernTable, type Column } from "@/components/tables/modern-table"
import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { Database } from "lucide-react"
import { formatMoney } from "@/lib/format"
import { LOCALE } from "@/lib/locale"

interface DataTableViewProps {
  title?: string
  rows: Record<string, unknown>[]
  columnKeys?: string[]
  searchKeys?: string[]
  loading?: boolean
  emptyTitle?: string
}

export function DataTableView({
  rows,
  columnKeys,
  searchKeys,
  loading,
  emptyTitle = "Sin registros",
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
      keyExtractor={(r) =>
        `${String(r.Sede ?? r.sede ?? "")}-${String(
          r.id_venta ??
          r.id_empleado ??
          r.id_cliente ??      // ← agregar esto
          r.id_producto ??
          r.id_log ??
          r.id_compra ??
          r.id_usuario ??
          JSON.stringify(r).slice(0, 60)
        ) }`
      }
    />
  )
}
