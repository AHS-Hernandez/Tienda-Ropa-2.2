"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { ProductSearchPicker } from "@/components/erp/product-search-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchJson } from "@/lib/api/fetch-json"
import { rowStr } from "@/lib/api/row-field"
import { Loader2, Plus } from "lucide-react"

export default function OwnerComprasPage() {
  const [compras, setCompras] = useState<Record<string, unknown>[]>([])
  const [proveedores, setProveedores] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [provForm, setProvForm] = useState({
    razon_social: "",
    nit: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
  })
  const [ordenForm, setOrdenForm] = useState({
    id_proveedor: "",
    id_producto: null as number | null,
    cantidad: "10",
    costo: "50",
  })

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetchJson<{
      ok: boolean
      compras?: Record<string, unknown>[]
      proveedores?: Record<string, unknown>[]
      message?: string
    }>("/api/owner/compras")
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar compras")
        setCompras(d.compras ?? [])
        setProveedores(d.proveedores ?? [])
      })
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "No se pudo cargar datos")
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const post = async (body: Record<string, unknown>) => {
    const data = await fetchJson<{ ok: boolean; message?: string }>(
      "/api/owner/compras",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
    if (!data.ok) throw new Error(data.message ?? "Error en la operación")
    load()
  }

  const registrarProveedor = async () => {
    try {
      await post({ action: "proveedor", ...provForm })
      setProvForm({
        razon_social: "",
        nit: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const emitirOrden = async () => {
    if (!ordenForm.id_proveedor || !ordenForm.id_producto) {
      alert("Seleccione proveedor y producto")
      return
    }
    try {
      const cantidad = Number(ordenForm.cantidad)
      const costo = Number(ordenForm.costo)
      const total = cantidad * costo
      await post({
        action: "orden",
        id_proveedor: Number(ordenForm.id_proveedor),
        total_compra: total,
        detalles: [
          {
            id_producto: ordenForm.id_producto,
            cantidad,
            costo,
          },
        ],
      })
      setOrdenForm({
        id_proveedor: ordenForm.id_proveedor,
        id_producto: null,
        cantidad: "10",
        costo: "50",
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const accionCompra = async (action: string, id_compra: number) => {
    try {
      await post({ action, id_compra })
      if (action === "recibir") {
        alert("Mercadería recibida: stock sube en Central (sp_Consolidar_Recepcion_Mercaderia).")
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  if (loading) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-20" />
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      <div>
        <h1 className="text-2xl font-bold">Compras</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          <strong>1)</strong> Emitir orden → <strong>2)</strong> Recibir mercadería (sube stock en{" "}
          <strong>Central</strong>). Para enviar a la sucursal use{" "}
          <strong>Stock global → Transferir</strong> (sp_Transferir_Stock). El linked server solo
          muestra el reporte unificado.
        </p>
      </div>

      <Tabs defaultValue="ordenes">
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="nuevo">Nueva orden</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <DataTableView
            rows={compras}
            columnKeys={["id_compra", "Fecha_Emision", "Proveedor", "Estado", "Total_compra"]}
          />
          {compras.map((c) => (
            <div key={Number(c.id_compra)} className="flex gap-2 flex-wrap">
              {String(c.Estado) === "Pendiente" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => accionCompra("recibir", Number(c.id_compra))}
                  >
                    Recibir mercadería
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => accionCompra("anular", Number(c.id_compra))}
                  >
                    Anular
                  </Button>
                </>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="proveedores">
          <DataTableView
            rows={proveedores}
            columnKeys={["id_proveedor", "Razon_social", "Nit", "Contacto_nombre", "Telefono", "Email"]}
          />
        </TabsContent>

        <TabsContent value="nuevo" className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Proveedor
            </h2>
            {(["razon_social", "nit", "contacto", "telefono", "email", "direccion"] as const).map(
              (k) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <Input
                    value={provForm[k]}
                    onChange={(e) => setProvForm({ ...provForm, [k]: e.target.value })}
                  />
                </div>
              )
            )}
            <Button onClick={registrarProveedor} className="bg-brand-600 w-full">
              Registrar proveedor
            </Button>
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <h2 className="font-semibold">Orden de compra</h2>
            <div>
              <Label>Proveedor</Label>
              <Select
                value={ordenForm.id_proveedor}
                onValueChange={(v) => setOrdenForm({ ...ordenForm, id_proveedor: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elija proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Sin proveedores — registre uno a la izquierda
                    </SelectItem>
                  ) : (
                    proveedores.map((p) => (
                      <SelectItem
                        key={rowStr(p, "id_proveedor")}
                        value={rowStr(p, "id_proveedor")}
                      >
                        {rowStr(p, "Razon_social")} (NIT {rowStr(p, "Nit")})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <ProductSearchPicker
              apiBase="/api/owner/compras"
              onSelect={(p) =>
                setOrdenForm({
                  ...ordenForm,
                  id_producto: p.id_producto,
                  costo: String(p.precio_costo ?? ordenForm.costo),
                })
              }
              selectedId={ordenForm.id_producto}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={ordenForm.cantidad}
                  onChange={(e) => setOrdenForm({ ...ordenForm, cantidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Costo unit. (Bs.)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={ordenForm.costo}
                  onChange={(e) => setOrdenForm({ ...ordenForm, costo: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={emitirOrden} className="bg-brand-600 w-full">
              Emitir orden (sp_Emitir_Orden_Compra)
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
