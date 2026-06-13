"use client"

import { useCallback, useEffect, useState } from "react"
import { ProductRow } from "@/components/erp/product-row"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { fetchJson } from "@/lib/api/fetch-json"
import { rowField, rowStr } from "@/lib/api/row-field"
import { Loader2, Plus, Pencil, Camera } from "lucide-react"
import Link from "next/link"

export default function OwnerCatalogoPage() {
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [subcats, setSubcats] = useState<Record<string, unknown>[]>([])
  const [categorias, setCategorias] = useState<Record<string, unknown>[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(true)
  const [catError, setCatError] = useState<string | null>(null)
  const [subcatError, setSubcatError] = useState<string | null>(null)
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

  const [nuevaCat, setNuevaCat] = useState("")
  const [nuevaSub, setNuevaSub] = useState({ id_categoria: "", nombre: "" })
  const [editCat, setEditCat] = useState<Record<string, unknown> | null>(null)
  const [editSub, setEditSub] = useState<Record<string, unknown> | null>(null)
  const [editCatNombre, setEditCatNombre] = useState("")
  const [editSubForm, setEditSubForm] = useState({ nombre: "", id_categoria: "" })

  const postCatalogo = async (body: Record<string, unknown>) => {
    return fetchJson<{ ok: boolean; message?: string; categorias?: Record<string, unknown>[]; subcategorias?: Record<string, unknown>[] }>(
      "/api/owner/catalogo",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
  }

  const loadCategorias = useCallback(() => {
    setCatLoading(true)
    setCatError(null)
    postCatalogo({ action: "categorias" })
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar categorías")
        setCategorias(d.categorias ?? [])
      })
      .catch((e) =>
        setCatError(e instanceof Error ? e.message : "No se pudieron cargar categorías")
      )
      .finally(() => setCatLoading(false))
  }, [])

  const loadSubcategorias = useCallback(() => {
    setSubcatError(null)
    postCatalogo({ action: "subcategorias" })
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar subcategorías")
        setSubcats(d.subcategorias ?? [])
      })
      .catch((e) =>
        setSubcatError(
          e instanceof Error ? e.message : "No se pudieron cargar subcategorías"
        )
      )
  }, [])

  const loadProducts = useCallback(() => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}` : ""
    fetchJson<{ ok: boolean; productos?: ProductoCatalogoRow[]; message?: string }>(
      `/api/owner/catalogo${params}`
    )
      .then((d) => {
        if (!d.ok) throw new Error(d.message ?? "Error al cargar productos")
        setProductos(d.productos ?? [])
      })
      .catch(() => setProductos([]))
      .finally(() => setLoading(false))
  }, [q])

  useEffect(() => {
    const t = setTimeout(loadProducts, 300)
    return () => clearTimeout(t)
  }, [loadProducts])

  useEffect(() => {
    loadCategorias()
    loadSubcategorias()
  }, [loadCategorias, loadSubcategorias])

  const guardarNuevo = async () => {
    const costo = Number(form.precio_costo)
    const venta = Number(form.precio_venta)
    if (!form.nombre.trim()) {
      alert("Nombre obligatorio")
      return
    }
    if (venta < costo) {
      alert("El precio de venta debe ser mayor o igual al costo")
      return
    }
    try {
      const data = await postCatalogo({
        action: "crear",
        ...form,
        id_subcategoria: Number(form.id_subcategoria),
        precio_costo: costo,
        precio_venta: venta,
      })
      if (!data.ok) throw new Error(data.message)
      setOpen(false)
      loadProducts()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const guardarPrecios = async () => {
    if (!editProduct) return
    try {
      const data = await postCatalogo({
        action: "precios",
        id_producto: editProduct.id_producto,
        precio_costo: Number(form.precio_costo),
        precio_venta: Number(form.precio_venta),
      })
      if (!data.ok) throw new Error(data.message)
      setEditProduct(null)
      loadProducts()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const crearCategoria = async () => {
    try {
      const d = await postCatalogo({ action: "crear_categoria", nombre: nuevaCat.trim() })
      if (!d.ok) throw new Error(d.message)
      setCategorias(d.categorias ?? [])
      setNuevaCat("")
      loadSubcategorias()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const crearSubcategoria = async () => {
    try {
      const d = await postCatalogo({
        action: "crear_subcategoria",
        id_categoria: Number(nuevaSub.id_categoria),
        nombre: nuevaSub.nombre.trim(),
      })
      if (!d.ok) throw new Error(d.message)
      setCategorias(d.categorias ?? [])
      setSubcats(d.subcategorias ?? [])
      setNuevaSub({ id_categoria: "", nombre: "" })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const guardarEditCat = async () => {
    if (!editCat) return
    try {
      const d = await postCatalogo({
        action: "editar_categoria",
        id_categoria: rowField(editCat, "id_categoria"),
        nombre: editCatNombre.trim(),
      })
      if (!d.ok) throw new Error(d.message)
      setCategorias(d.categorias ?? [])
      setEditCat(null)
      loadSubcategorias()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const guardarEditSub = async () => {
    if (!editSub) return
    try {
      const d = await postCatalogo({
        action: "editar_subcategoria",
        id_subcategoria: rowField(editSub, "id_subcategoria"),
        id_categoria: Number(editSubForm.id_categoria),
        nombre: editSubForm.nombre.trim(),
      })
      if (!d.ok) throw new Error(d.message)
      setCategorias(d.categorias ?? [])
      setSubcats(d.subcategorias ?? [])
      setEditSub(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo maestro</h1>
        <p className="text-sm text-muted-foreground">
          Productos, categorías y subcategorías centralizados
        </p>
      </div>

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-6 mt-4">
          <div className="flex flex-wrap justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              sp_Registrar_Producto · sp_Actualizar_Precios
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-600">
                  <Plus className="h-4 w-4 mr-2" /> Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo producto</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {subcatError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                      {subcatError}
                    </p>
                  )}
                  <div>
                    <Label>Subcategoría</Label>
                    <Select
                      value={form.id_subcategoria}
                      onValueChange={(v) => setForm({ ...form, id_subcategoria: v })}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            subcats.length === 0
                              ? "Sin subcategorías — créelas en la pestaña Categorías"
                              : "Elegir"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {subcats.map((s, i) => (
                          <SelectItem
                            key={`sub-${rowStr(s, "id_subcategoria") || i}`}
                            value={rowStr(s, "id_subcategoria")}
                          >
                            {rowStr(s, "Categoria")} — {rowStr(s, "Nombre")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(
                    [
                      "nombre",
                      "marca",
                      "color",
                      "talla",
                      "descripcion",
                      "precio_costo",
                      "precio_venta",
                    ] as const
                  ).map((k) => (
                    <div key={k}>
                      <Label>{k}</Label>
                      <Input
                        value={form[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                  <Button
                    onClick={guardarNuevo}
                    className="w-full bg-brand-600"
                    disabled={!form.id_subcategoria}
                  >
                    Registrar
                  </Button>
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/owner/catalogo-maestro/${p.id_producto}`}>
                      <Camera className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6 mt-4">
          {catError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {catError}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border p-4 space-y-4">
              <h2 className="font-semibold">Categorías</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre nueva categoría"
                  value={nuevaCat}
                  onChange={(e) => setNuevaCat(e.target.value)}
                />
                <Button onClick={crearCategoria} className="bg-brand-600 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {catLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <DataTableView
                  rows={categorias}
                  columnKeys={["id_categoria", "Nombre"]}
                  emptyTitle="Sin categorías — agregue una arriba"
                  onRowClick={(row) => {
                    setEditCat(row)
                    setEditCatNombre(rowStr(row, "Nombre"))
                  }}
                />
              )}
            </div>

            <div className="rounded-xl border p-4 space-y-4">
              <h2 className="font-semibold">Subcategorías</h2>
              <div className="space-y-2">
                <Select
                  value={nuevaSub.id_categoria}
                  onValueChange={(v) => setNuevaSub({ ...nuevaSub, id_categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría padre" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c, i) => (
                      <SelectItem
                        key={`cat-${rowStr(c, "id_categoria") || i}`}
                        value={rowStr(c, "id_categoria")}
                      >
                        {rowStr(c, "Nombre")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre subcategoría"
                    value={nuevaSub.nombre}
                    onChange={(e) =>
                      setNuevaSub({ ...nuevaSub, nombre: e.target.value })
                    }
                  />
                  <Button
                    onClick={crearSubcategoria}
                    className="bg-brand-600 shrink-0"
                    disabled={!nuevaSub.id_categoria || !nuevaSub.nombre.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {subcatError && (
                <p className="text-sm text-destructive">{subcatError}</p>
              )}
              <DataTableView
                rows={subcats}
                columnKeys={["id_subcategoria", "Categoria", "Nombre"]}
                emptyTitle="Sin subcategorías"
                onRowClick={(row) => {
                  setEditSub(row)
                  setEditSubForm({
                    nombre: rowStr(row, "Nombre"),
                    id_categoria: String(rowField(row, "id_categoria")),
                  })
                }}
              />
              <p className="text-xs text-muted-foreground">
                Pulse una fila para editar nombre o categoría padre.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editProduct} onOpenChange={(v) => !v && setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar precios</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Costo</Label>
              <Input
                type="number"
                value={form.precio_costo}
                onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
              />
            </div>
            <div>
              <Label>Venta</Label>
              <Input
                type="number"
                value={form.precio_venta}
                onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
              />
            </div>
            <Button onClick={guardarPrecios} className="w-full bg-brand-600">
              Actualizar precios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCat} onOpenChange={(v) => !v && setEditCat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          <Input value={editCatNombre} onChange={(e) => setEditCatNombre(e.target.value)} />
          <Button onClick={guardarEditCat} className="w-full bg-brand-600 mt-3">
            Guardar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSub} onOpenChange={(v) => !v && setEditSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar subcategoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoría padre</Label>
              <Select
                value={editSubForm.id_categoria}
                onValueChange={(v) =>
                  setEditSubForm({ ...editSubForm, id_categoria: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem
                      key={String(c.id_categoria)}
                      value={String(c.id_categoria)}
                    >
                      {String(c.Nombre)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={editSubForm.nombre}
                onChange={(e) =>
                  setEditSubForm({ ...editSubForm, nombre: e.target.value })
                }
              />
            </div>
            <Button onClick={guardarEditSub} className="w-full bg-brand-600">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
