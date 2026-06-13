"use client"

import { useEffect, useState } from "react"
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
import { Loader2 } from "lucide-react"

type Sede = { id_sede: number; Nombre: string; Es_Central: boolean }

export default function OwnerStockPage() {
  const [consolidado, setConsolidado] = useState<Record<string, unknown>[]>([])
  const [alertas, setAlertas] = useState<Record<string, unknown>[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [transferForm, setTransferForm] = useState({
    id_producto: null as number | null,
    id_sede_origen: "",
    id_sede_destino: "",
    cantidad: "1",
  })
  const [transferring, setTransferring] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/owner/stock").then((r) => r.json()),
      fetch("/api/owner/stock?alertas=1").then((r) => r.json()),
      fetch("/api/owner/stock?sedes=1").then((r) => r.json()),
    ])
      .then(([c, a, s]) => {
        if (c.ok) setConsolidado(c.stock)
        if (a.ok) setAlertas(a.stock)
        if (s.ok && s.sedes?.length) {
          setSedes(s.sedes)
          const central = s.sedes.find((x: Sede) => x.Es_Central)
          const otra = s.sedes.find((x: Sede) => !x.Es_Central)
          if (central && !transferForm.id_sede_origen) {
            setTransferForm((f) => ({
              ...f,
              id_sede_origen: String(central.id_sede),
              id_sede_destino: otra ? String(otra.id_sede) : "",
            }))
          }
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const transferir = async () => {
    if (!transferForm.id_producto || !transferForm.id_sede_origen || !transferForm.id_sede_destino) {
      alert("Complete producto, sede origen y destino")
      return
    }
    setTransferring(true)
    try {
      const res = await fetch("/api/owner/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transferir",
          id_producto: transferForm.id_producto,
          id_sede_origen: Number(transferForm.id_sede_origen),
          id_sede_destino: Number(transferForm.id_sede_destino),
          cantidad: Number(transferForm.cantidad),
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      alert(data.message ?? "Transferencia OK")
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Central</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Inventario actual de la sede <strong>Central</strong>. Para enviar mercadería a otra
          sede use la pestaña Transferir (<code>sp_Transferir_Stock</code>).
        </p>
      </div>
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <Tabs defaultValue="consolidado">
          <TabsList>
            <TabsTrigger value="consolidado">Stock actual (Central)</TabsTrigger>
            <TabsTrigger value="alertas">Alertas ({alertas.length})</TabsTrigger>
            <TabsTrigger value="transferir">Transferir a sede</TabsTrigger>
          </TabsList>
          <TabsContent value="consolidado" className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Catálogo completo con cantidades en Central (0 si aún no hay recepción de compra).
            </p>
            <DataTableView
              rows={consolidado}
              columnKeys={[
                "Producto",
                "Marca",
                "Talla",
                "Color",
                "Cantidad",
                "Nivel",
              ]}
            />
          </TabsContent>
          <TabsContent value="alertas" className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Solo productos con fila en stock y cantidad ≤ 10 (no incluye “sin registro”).
            </p>
            <DataTableView
              rows={alertas}
              columnKeys={[
                "Producto",
                "Marca",
                "Talla",
                "Color",
                "Cantidad",
                "Nivel",
              ]}
            />
          </TabsContent>
          <TabsContent value="transferir" className="mt-4 max-w-lg space-y-4 rounded-xl border p-4">
            <ProductSearchPicker
              apiBase="/api/owner/compras"
              label="Producto a transferir"
              hint="Debe haber stock en la sede origen (normalmente Central)."
              onSelect={(p) =>
                setTransferForm({ ...transferForm, id_producto: p.id_producto })
              }
              selectedId={transferForm.id_producto}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sede origen</Label>
                <Select
                  value={transferForm.id_sede_origen}
                  onValueChange={(v) =>
                    setTransferForm({ ...transferForm, id_sede_origen: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map((s) => (
                      <SelectItem key={s.id_sede} value={String(s.id_sede)}>
                        {s.Nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sede destino</Label>
                <Select
                  value={transferForm.id_sede_destino}
                  onValueChange={(v) =>
                    setTransferForm({ ...transferForm, id_sede_destino: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map((s) => (
                      <SelectItem key={s.id_sede} value={String(s.id_sede)}>
                        {s.Nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                value={transferForm.cantidad}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, cantidad: e.target.value })
                }
              />
            </div>
            <Button
              className="w-full bg-brand-600"
              disabled={transferring}
              onClick={transferir}
            >
              {transferring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Transferir (sp_Transferir_Stock)"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Esto actualiza Kardex/stock en la BD de Central. El reporte linked muestra también
              el stock físico en el servidor Sede (.77), que es independiente hasta que allá
              reciban mercadería o ajusten inventario.
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
