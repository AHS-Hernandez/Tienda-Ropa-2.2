"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { fetchJson } from "@/lib/api/fetch-json"
import { formatMoney } from "@/lib/format"
import { Loader2, Radio, Receipt } from "lucide-react"

type Block = {
  rows: Record<string, unknown>[]
  error: string | null
  warning: string | null
  linkedError?: string | null
  source?: "linked" | "local"
  count: number
}

type RedPayload = {
  ok: boolean
  linkedServer?: boolean
  partialCentral?: boolean
  dbServer?: string
  dbUser?: string
  linkedHint?: string | null
  ventas?: Block
  ventasGlobal?: Block
  empleados?: Block
  clientes?: Block
  stock?: Block
  message?: string
}

type DetalleLinea = {
  id_detalle: number
  id_producto: number
  Producto: string
  Color: string
  Talla: string
  Cantidad: number
  Precio_unitario: number
  Subtotal: number
}

const API_URL = "/api/owner/global-live"

function filterRows(rows: Record<string, unknown>[], q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return rows
  return rows.filter((r) =>
    Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(t))
  )
}

function TabPanel({
  block,
  columnKeys,
  q,
  loading,
  emptyTitle,
  onRowClick,
}: {
  block?: Block
  columnKeys: string[]
  q: string
  loading: boolean
  emptyTitle: string
  onRowClick?: (row: Record<string, unknown>) => void
}) {
  const rows = useMemo(
    () => filterRows(block?.rows ?? [], q),
    [block?.rows, q]
  )

  if (block?.error && rows.length === 0) {
    return (
      <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
        {block.error}
      </p>
    )
  }

  return (
    <DataTableView
      rows={rows}
      columnKeys={columnKeys}
      loading={loading}
      emptyTitle={emptyTitle}
      onRowClick={onRowClick}
    />
  )
}

function DetalleSheet({
  open,
  onClose,
  factura,
}: {
  open: boolean
  onClose: () => void
  factura: { id_venta: number; sede: string; nro_factura: string; cliente: string; total_neto: number } | null
}) {
  const [lineas, setLineas] = useState<DetalleLinea[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null)

  const cargarDetalle = useCallback(async () => {
    if (!factura) return
    setLoadingDetalle(true)
    setErrorDetalle(null)
    try {
      const res = await fetchJson<{ ok: boolean; detalle: DetalleLinea[]; message?: string }>(
        `/api/owner/ventas-global?id_venta=${factura.id_venta}&sede=${encodeURIComponent(factura.sede)}`
      )
      if (!res.ok) throw new Error(res.message ?? "Error al cargar detalle")
      setLineas(res.detalle ?? [])
    } catch (e) {
      setErrorDetalle(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoadingDetalle(false)
    }
  }, [factura])

  useEffect(() => {
    if (open && factura) cargarDetalle()
    else setLineas([])
  }, [open, factura, cargarDetalle])

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Factura #{factura?.nro_factura ?? "—"}
          </SheetTitle>
          <SheetDescription className="space-y-0.5 text-left">
            <span className="block">{factura?.cliente}</span>
            <span className="block text-xs">
              Sede: <strong>{factura?.sede}</strong>
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {loadingDetalle ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : errorDetalle ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {errorDetalle}
            </p>
          ) : lineas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin líneas de detalle
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Producto</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Talla</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Color</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Cant.</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Precio</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lineas.map((l) => (
                      <tr key={l.id_detalle} className="bg-card">
                        <td className="px-3 py-2.5 font-medium">{l.Producto}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{l.Talla || "—"}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{l.Color || "—"}</td>
                        <td className="px-3 py-2.5 text-center">{l.Cantidad}</td>
                        <td className="px-3 py-2.5 text-right">{formatMoney(l.Precio_unitario)}</td>
                        <td className="px-3 py-2.5 text-right font-medium">{formatMoney(l.Subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="rounded-xl border border-border bg-muted/30 px-5 py-3 space-y-1 text-sm min-w-48">
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-base">{formatMoney(factura?.total_neto ?? 0)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function OwnerRedTiempoRealPage() {
  const [data, setData] = useState<RedPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<{
    id_venta: number
    sede: string
    nro_factura: string
    cliente: string
    total_neto: number
  } | null>(null)

  useEffect(() => {
    fetchJson<RedPayload>(API_URL, { cache: "no-store" })
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar red en vivo")
        setData(d)
      })
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "No se pudo cargar")
      )
      .finally(() => setLoading(false))
  }, [])

  const handleVentaClick = (row: Record<string, unknown>) => {
    setFacturaSeleccionada({
      id_venta: Number(row.id_venta),
      sede: String(row.Sede ?? ""),
      nro_factura: String(row.Nro_factura ?? row.id_venta),
      cliente: String(row.Cliente_Nombre ?? ""),
      total_neto: Number(row.Total_neto ?? 0),
    })
    setSheetOpen(true)
  }

  const counts = {
    ventas: data?.ventas?.count ?? 0,
    ventasGlobal: data?.ventasGlobal?.count ?? 0,
    empleados: data?.empleados?.count ?? 0,
    clientes: data?.clientes?.count ?? 0,
    stock: data?.stock?.count ?? 0,
  }

  const enModoFallback = Boolean(data?.partialCentral && !data?.linkedServer)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-7 w-7 text-brand-600" />
            Red en vivo
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Central + sucursal vía <strong>linked server</strong>. Separado del dashboard
            (solo Central). Cinco vistas en tiempo real.
          </p>
        </div>
        <Badge
          variant={
            data?.linkedServer ? "default" : data?.partialCentral ? "secondary" : "outline"
          }
        >
          {loading
            ? "Cargando…"
            : data?.linkedServer
              ? "Central + Sede (linked)"
              : data?.partialCentral
                ? "Solo Central (fallback)"
                : "Sin datos"}
        </Badge>
      </div>

      {loadError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      {enModoFallback && (
        <div className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 space-y-2">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Modo solo Central — la sucursal no está conectada
          </p>
          <p className="text-xs text-muted-foreground">
            Los números de Empleados, Clientes y Stock son de <strong>Central</strong>.
            Ventas hoy (0) significa que hoy no hay facturas en Central; con linked server
            vería también la sucursal.
          </p>
          <p className="text-xs text-muted-foreground">
            App: <strong>{data?.dbUser}</strong> @ <strong>{data?.dbServer}</strong>
            {data?.linkedHint && <> — {data.linkedHint}</>}
          </p>
          {data?.ventas?.linkedError && (
            <p className="text-xs font-mono text-muted-foreground break-all">
              SQL: {data.ventas.linkedError}
            </p>
          )}
          <p className="text-xs font-mono">
            master: SQL-Grant-LinkedServer-login_nivel4.sql · Sede: SQL-Sede-Login-LinkedServer.sql
          </p>
        </div>
      )}

      <PageToolbar
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Filtrar en la pestaña activa…"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <Tabs defaultValue="ventas-global">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="ventas-global">
              Ventas ({counts.ventasGlobal})
            </TabsTrigger>
            <TabsTrigger value="ventas">
              Ventas hoy ({counts.ventas})
            </TabsTrigger>
            <TabsTrigger value="empleados">
              Empleados ({counts.empleados})
            </TabsTrigger>
            <TabsTrigger value="clientes">
              Clientes ({counts.clientes})
            </TabsTrigger>
            <TabsTrigger value="stock">
              Stock ({counts.stock})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ventas-global" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              Ventas.vw_Ventas_Global — haz clic en una fila para ver el detalle de la factura
            </p>
            <TabPanel
              block={data?.ventasGlobal}
              columnKeys={[
                "Sede",
                "Nro_factura",
                "Fecha_emision",
                "Estado",
                "Cliente_Nombre",
                "Cajero_Nombre",
                "Metodo_pago",
                "Total_neto",
              ]}
              q={q}
              loading={false}
              emptyTitle="Sin ventas registradas"
              onRowClick={handleVentaClick}
            />
          </TabsContent>

          <TabsContent value="ventas" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              Ventas.vw_Ventas_Hoy_Global — haz clic en una fila para ver el detalle
            </p>
            <TabPanel
              block={data?.ventas}
              columnKeys={[
                "Sede",
                "Nro_factura",
                "Fecha_emision",
                "Cliente_Nombre",
                "Cajero_Nombre",
                "Metodo_pago",
                "Estado",
                "Total_neto",
              ]}
              q={q}
              loading={false}
              emptyTitle={
                enModoFallback
                  ? "Sin ventas hoy en Central (la sucursal requiere linked server)"
                  : "Sin ventas hoy en Central + Sede"
              }
              onRowClick={handleVentaClick}
            />
          </TabsContent>

          <TabsContent value="empleados" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              Persona.vw_Empleados_Global_TiempoReal
            </p>
            <TabPanel
              block={data?.empleados}
              columnKeys={[
                "Sede",
                "Nombre_completo",
                "CI",
                "Telefono",
                "Email",
                "Fecha_contratacion",
                "Salario_base",
              ]}
              q={q}
              loading={false}
              emptyTitle="Sin empleados"
            />
          </TabsContent>

          <TabsContent value="clientes" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              Persona.vw_Clientes_Global_TiempoReal
            </p>
            <TabPanel
              block={data?.clientes}
              columnKeys={[
                "Sede",
                "Nombre_completo",
                "CI",
                "Telefono",
                "Email",
                "Nit_ci_facturacion",
              ]}
              q={q}
              loading={false}
              emptyTitle="Sin clientes"
            />
          </TabsContent>

          <TabsContent value="stock" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              Inventario.vw_Stock_Sede_TiempoReal
            </p>
            <TabPanel
              block={data?.stock}
              columnKeys={[
                "Sede",
                "Producto",
                "Talla",
                "Color",
                "Cantidad_Disponible",
                "Nivel_Stock",
              ]}
              q={q}
              loading={false}
              emptyTitle="Sin filas de stock"
            />
          </TabsContent>
        </Tabs>
      )}

      <DetalleSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        factura={facturaSeleccionada}
      />
    </div>
  )
}
