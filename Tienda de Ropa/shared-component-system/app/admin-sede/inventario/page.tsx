"use client"

import { useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductSearchPicker } from "@/components/erp/product-search-picker"
import { Loader2 } from "lucide-react"

export default function AdminInventarioPage() {
  const [stock, setStock] = useState<Record<string, unknown>[]>([])
  const [ajustes, setAjustes] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id_producto: "",
    tipo_ajuste: "Conteo Físico",
    motivo: "",
    cantidad: "0",
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch("/api/admin-sede/stock").then((r) => r.json()),
      fetch("/api/admin-sede/inventario").then((r) => r.json()),
    ])
      .then(([s, a]) => {
        if (s.ok) setStock(s.stock)
        if (a.ok) setAjustes(a.ajustes)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const submitAjuste = async () => {
    const res = await fetch("/api/admin-sede/inventario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_producto: Number(form.id_producto),
        tipo_ajuste: form.tipo_ajuste,
        motivo: form.motivo,
        cantidad: Number(form.cantidad),
      }),
    })
    const data = await res.json()
    if (!data.ok) {
      alert(data.message)
      return
    }
    setAjustes(data.ajustes)
    alert("Ajuste registrado")
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Stock sede + sp_Ejecutar_Ajuste_Inventario
        </p>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          <TabsTrigger value="nuevo">Nuevo ajuste</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          ) : (
            <DataTableView
              rows={stock}
              columnKeys={["Nombre", "Talla", "Color", "Cantidad_Disponible", "id_producto"]}
            />
          )}
        </TabsContent>

        <TabsContent value="ajustes" className="mt-4">
          <DataTableView
            rows={ajustes}
            loading={loading}
            columnKeys={[
              "Fecha",
              "Tipo_ajuste",
              "Motivo",
              "Producto_Afectado",
              "Cantidad_Ajustada",
              "Autorizado_Por",
            ]}
          />
        </TabsContent>

        <TabsContent value="nuevo" className="mt-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-base">Registrar ajuste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductSearchPicker
                apiBase="/api/admin-sede/inventario"
                label="Producto"
                hint="Busque por nombre o ID. Stock mostrado es de su sede."
                onSelect={(p) =>
                  setForm({ ...form, id_producto: String(p.id_producto) })
                }
                selectedId={form.id_producto ? Number(form.id_producto) : null}
              />
              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.tipo_ajuste}
                  onValueChange={(v) => setForm({ ...form, tipo_ajuste: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conteo Físico">Conteo Físico</SelectItem>
                    <SelectItem value="Robo">Robo</SelectItem>
                    <SelectItem value="Dañado">Dañado</SelectItem>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cantidad (+/-)</Label>
                <Input
                  type="number"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                />
              </div>
              <div>
                <Label>Motivo</Label>
                <Input
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>
              <Button onClick={submitAjuste} className="bg-brand-600 hover:bg-brand-700">
                Ejecutar SP
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
