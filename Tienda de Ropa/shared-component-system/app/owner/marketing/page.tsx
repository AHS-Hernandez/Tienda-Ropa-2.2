"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
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
import { rowField, rowStr } from "@/lib/api/row-field"
import { Loader2, Plus, Trash2, X } from "lucide-react"

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

  const cargarEnFormulario = (row: Promo) => {
    const pct = row.Porcentaje != null && Number(row.Porcentaje) > 0
    setEditId(Number(rowField(row, "id_promocion")))
    setForm({
      ...emptyForm,
      nombre: rowStr(row, "Nombre"),
      tipo: pct ? "porcentaje" : "monto",
      valor: String(pct ? rowField(row, "Porcentaje") : rowField(row, "Monto") ?? ""),
      fecha_inicio: rowStr(row, "Fecha_inicio").slice(0, 10),
      fecha_fin: rowStr(row, "Fecha_fin").slice(0, 10),
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const buildAlcancePayload = () => {
    const base: Record<string, unknown> = {
      nombre: form.nombre,
      tipo: form.tipo,
      valor: form.valor,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      monto_minimo: Number(form.monto_minimo) || 0,
    }
    if (form.alcance_tipo === "producto" && form.id_producto) {
      base.id_producto = form.id_producto
    } else if (form.alcance_tipo === "categoria" && form.id_categoria) {
      base.id_categoria = form.id_categoria
    } else if (form.alcance_tipo === "subcategoria" && form.id_subcategoria) {
      base.id_subcategoria = form.id_subcategoria
    }
    if (editId) {
      base.reasignar_alcance = false
    }
    return base
  }

  const guardar = async () => {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      alert("Complete nombre y fechas")
      return
    }
    if (!editId) {
      const okAlcance =
        (form.alcance_tipo === "producto" && form.id_producto) ||
        (form.alcance_tipo === "categoria" && form.id_categoria) ||
        (form.alcance_tipo === "subcategoria" && form.id_subcategoria)
      if (!okAlcance) {
        alert("Seleccione un alcance en el desplegable")
        return
      }
    }
    const payload = buildAlcancePayload()

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
    else {
      if (editId === id) resetForm()
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Cree o edite campañas en el panel superior. Pulse una fila de la lista para cargarla.
        </p>
      </div>

      <div className="rounded-xl border p-4 space-y-4 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            {editId ? `Editando campaña #${editId}` : "Nueva campaña"}
          </h2>
          {editId && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" /> Cancelar edición
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tipo</Label>
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
          <div>
            <Label>Inicio</Label>
            <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
          </div>
          <div>
            <Label>Fin</Label>
            <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
          </div>
        </div>

        {!editId && (
          <div className="space-y-3 rounded-lg border p-3 bg-background">
            <Label className="font-semibold">Alcance (solo al crear)</Label>
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
                    <SelectItem key={`p-${rowStr(p, "id_producto")}`} value={rowStr(p, "id_producto")}>
                      {rowStr(p, "Nombre")} (#{rowStr(p, "id_producto")})
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
                    <SelectItem key={`c-${rowStr(c, "id_categoria")}`} value={rowStr(c, "id_categoria")}>
                      {rowStr(c, "Nombre")}
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
                    <SelectItem key={`s-${rowStr(s, "id_subcategoria")}`} value={rowStr(s, "id_subcategoria")}>
                      {rowStr(s, "Categoria")} — {rowStr(s, "Nombre")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div>
              <Label>Monto mínimo (Bs.)</Label>
              <Input type="number" value={form.monto_minimo} onChange={(e) => setForm({ ...form, monto_minimo: e.target.value })} />
            </div>
          </div>
        )}

        {editId && (
          <p className="text-xs text-muted-foreground">
            El alcance no se cambia al editar; modifique fechas, nombre o descuento. Para otro alcance,
            cree una campaña nueva.
          </p>
        )}

        <Button onClick={guardar} disabled={saving} className="w-full bg-brand-600">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editId ? (
            "Guardar cambios"
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" /> Crear promoción
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Campañas — pulse para editar
            </h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin promociones registradas.</p>
            ) : (
              rows.map((row) => {
                const id = Number(rowField(row, "id_promocion"))
                const activa = editId === id
                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    onClick={() => cargarEnFormulario(row)}
                    onKeyDown={(e) => e.key === "Enter" && cargarEnFormulario(row)}
                    className={`flex justify-between items-center border rounded-xl p-3 cursor-pointer transition-colors ${
                      activa ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <span className="font-medium">{rowStr(row, "Nombre")}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {rowField(row, "Porcentaje") != null
                          ? `${rowStr(row, "Porcentaje")}%`
                          : `Bs. ${rowStr(row, "Monto")}`}{" "}
                        · {rowStr(row, "Fecha_inicio").slice(0, 10)} →{" "}
                        {rowStr(row, "Fecha_fin").slice(0, 10)}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        eliminar(id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
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
