"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"

type Promo = Record<string, unknown>
type AlcanceTipo = "producto" | "categoria" | "subcategoria"

const emptyForm = {
  nombre: "",
  tipo: "porcentaje" as "porcentaje" | "monto",
  valor: "",
  fecha_inicio: "",
  fecha_fin: "",
  alcance_tipo: "categoria" as AlcanceTipo,
  id_producto: "",
  id_categoria: "",
  id_subcategoria: "",
  monto_minimo: "0",
}

export default function OwnerMarketingPage() {
  const [rows, setRows] = useState<Promo[]>([])
  const [alcances, setAlcances] = useState<Promo[]>([])
  const [categorias, setCategorias] = useState<Promo[]>([])
  const [subcategorias, setSubcategorias] = useState<Promo[]>([])
  const [productos, setProductos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/owner/marketing")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRows(d.promociones ?? [])
          setAlcances(d.alcances ?? [])
          setCategorias(d.categorias ?? [])
          setSubcategorias(d.subcategorias ?? [])
          setProductos(d.productos ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm(emptyForm)
    setEditId(null)
  }

  const openEdit = (row: Promo) => {
    const pct = row.Porcentaje != null
    setEditId(Number(row.id_promocion))
    setForm({
      ...emptyForm,
      nombre: String(row.Nombre ?? ""),
      tipo: pct ? "porcentaje" : "monto",
      valor: String(pct ? row.Porcentaje : row.Monto ?? ""),
      fecha_inicio: String(row.Fecha_inicio ?? "").slice(0, 10),
      fecha_fin: String(row.Fecha_fin ?? "").slice(0, 10),
    })
    setOpen(true)
  }

  const buildAlcancePayload = () => {
    const base = {
      nombre: form.nombre,
      tipo: form.tipo,
      valor: form.valor,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      monto_minimo: Number(form.monto_minimo) || 0,
      id_producto: null as number | null,
      id_categoria: null as number | null,
      id_subcategoria: null as number | null,
      reasignar_alcance: true,
    }
    if (form.alcance_tipo === "producto") {
      base.id_producto = Number(form.id_producto)
    } else if (form.alcance_tipo === "categoria") {
      base.id_categoria = Number(form.id_categoria)
    } else {
      base.id_subcategoria = Number(form.id_subcategoria)
    }
    return base
  }

  const guardar = async () => {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      alert("Complete nombre y fechas")
      return
    }
    const payload = buildAlcancePayload()
    if (!payload.id_producto && !payload.id_categoria && !payload.id_subcategoria) {
      alert("Seleccione alcance: producto, categoría o subcategoría")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/owner/marketing", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editId ? { ...payload, id_promocion: editId } : payload
        ),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setOpen(false)
      resetForm()
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id: number) => {
    if (!confirm("¿Finalizar esta promoción?")) return
    const res = await fetch(`/api/owner/marketing?id=${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else load()
  }

  const formAlcance = (
    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
      <Label className="font-semibold">Alcance (obligatorio)</Label>
      <Select
        value={form.alcance_tipo}
        onValueChange={(v) =>
          setForm({
            ...form,
            alcance_tipo: v as AlcanceTipo,
            id_producto: "",
            id_categoria: "",
            id_subcategoria: "",
          })
        }
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="producto">Un producto</SelectItem>
          <SelectItem value="categoria">Toda una categoría</SelectItem>
          <SelectItem value="subcategoria">Una subcategoría</SelectItem>
        </SelectContent>
      </Select>

      {form.alcance_tipo === "producto" && (
        <Select value={form.id_producto} onValueChange={(v) => setForm({ ...form, id_producto: v })}>
          <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
          <SelectContent>
            {productos.map((p) => (
              <SelectItem key={String(p.id_producto)} value={String(p.id_producto)}>
                {String(p.Nombre)} (#{String(p.id_producto)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {form.alcance_tipo === "categoria" && (
        <Select value={form.id_categoria} onValueChange={(v) => setForm({ ...form, id_categoria: v })}>
          <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={String(c.id_categoria)} value={String(c.id_categoria)}>
                {String(c.Nombre)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {form.alcance_tipo === "subcategoria" && (
        <Select value={form.id_subcategoria} onValueChange={(v) => setForm({ ...form, id_subcategoria: v })}>
          <SelectTrigger><SelectValue placeholder="Subcategoría" /></SelectTrigger>
          <SelectContent>
            {subcategorias.map((s) => (
              <SelectItem key={String(s.id_subcategoria)} value={String(s.id_subcategoria)}>
                {String(s.Categoria)} — {String(s.Nombre)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div>
        <Label>Monto mínimo de compra (Bs.)</Label>
        <Input
          type="number"
          value={form.monto_minimo}
          onChange={(e) => setForm({ ...form, monto_minimo: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            sp_Registrar_Campana + sp_Asignar_Alcance_Promocion
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva promoción</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar campaña" : "Nueva campaña"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo descuento</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "porcentaje" | "monto" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                </div>
              </div>
              {formAlcance}
              <Button onClick={guardar} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <>
          <DataTableView
            rows={rows}
            columnKeys={["id_promocion", "Nombre", "Porcentaje", "Monto", "Fecha_inicio", "Fecha_fin"]}
          />
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={Number(row.id_promocion)} className="flex justify-between border rounded-xl p-3">
                <span className="font-medium">{String(row.Nombre)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => eliminar(Number(row.id_promocion))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DataTableView
            title="Alcances vigentes"
            rows={alcances}
            columnKeys={["Campana", "Aplica_A", "Descuento_Ofrecido", "Estado_Actual"]}
          />
        </>
      )}
    </div>
  )
}
