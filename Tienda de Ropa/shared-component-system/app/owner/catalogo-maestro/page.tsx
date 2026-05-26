"use client"

import { useEffect, useState } from "react"
import { ProductRow } from "@/components/erp/product-row"
import { PageToolbar } from "@/components/erp/page-toolbar"
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
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"
import { Loader2, Plus, Pencil } from "lucide-react"

export default function OwnerCatalogoPage() {
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [subcats, setSubcats] = useState<Record<string, unknown>[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductoCatalogoRow | null>(null)
  const [form, setForm] = useState({
    id_subcategoria: "",
    nombre: "",
    descripcion: "",
    marca: "",
    color: "",
    talla: "",
    precio_costo: "",
    precio_venta: "",
  })

  const loadProducts = () => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}` : ""
    fetch(`/api/owner/catalogo${params}`)
      .then((r) => r.json())
      .then((d) => d.ok && setProductos(d.productos))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(loadProducts, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    fetch("/api/owner/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subcategorias" }),
    })
      .then((r) => r.json())
      .then((d) => d.ok && setSubcats(d.subcategorias ?? []))
  }, [])

  const guardarNuevo = async () => {
    const res = await fetch("/api/owner/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "crear",
        ...form,
        id_subcategoria: Number(form.id_subcategoria),
        precio_costo: Number(form.precio_costo),
        precio_venta: Number(form.precio_venta),
      }),
    })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else {
      setOpen(false)
      loadProducts()
    }
  }

  const guardarPrecios = async () => {
    if (!editProduct) return
    const res = await fetch("/api/owner/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "precios",
        id_producto: editProduct.id_producto,
        precio_costo: Number(form.precio_costo),
        precio_venta: Number(form.precio_venta),
      }),
    })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else {
      setEditProduct(null)
      loadProducts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo maestro</h1>
          <p className="text-sm text-muted-foreground">Producto.sp_Registrar_Producto · sp_Actualizar_Precios</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-600">
              <Plus className="h-4 w-4 mr-2" /> Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Subcategoría</Label>
                <Select value={form.id_subcategoria} onValueChange={(v) => setForm({ ...form, id_subcategoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                  <SelectContent>
                    {subcats.map((s) => (
                      <SelectItem key={String(s.id_subcategoria)} value={String(s.id_subcategoria)}>
                        {String(s.Categoria)} — {String(s.Nombre)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(["nombre", "marca", "color", "talla", "descripcion", "precio_costo", "precio_venta"] as const).map((k) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <Button onClick={guardarNuevo} className="w-full bg-brand-600">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <PageToolbar search={q} onSearchChange={setQ} />

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <div className="grid gap-2">
          {productos.map((p) => (
            <div key={p.id_producto} className="flex gap-2 items-start">
              <div className="flex-1">
                <ProductRow product={p} showCosto compact />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditProduct(p)
                  setForm({
                    ...form,
                    precio_costo: String(p.precio_costo ?? ""),
                    precio_venta: String(p.precio_venta ?? ""),
                  })
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editProduct} onOpenChange={(v) => !v && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar precios</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Costo</Label>
              <Input type="number" value={form.precio_costo} onChange={(e) => setForm({ ...form, precio_costo: e.target.value })} />
            </div>
            <div>
              <Label>Venta</Label>
              <Input type="number" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} />
            </div>
            <Button onClick={guardarPrecios} className="w-full bg-brand-600">Actualizar precios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
