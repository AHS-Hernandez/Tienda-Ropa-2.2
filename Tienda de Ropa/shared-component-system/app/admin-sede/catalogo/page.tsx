"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/erp/product-card"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

export default function AdminSedeCatalogoPage() {
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [categorias, setCategorias] = useState<{ id_categoria: number; nombre: string }[]>([])
  const [categoria, setCategoria] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoria) params.set("categoria", categoria)
      if (busqueda) params.set("q", busqueda)
      const res = await fetch(`/api/admin-sede/catalogo?${params}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setProductos(data.productos)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo")
    } finally {
      setLoading(false)
    }
  }, [categoria, busqueda])

  useEffect(() => {
    fetch("/api/admin-sede/catalogo?categorias=1")
      .then((r) => r.json())
      .then((d) => d.ok && setCategorias(d.categorias))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Vista de productos — haz clic para ver detalle y gestionar reseñas
        </p>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Nombre, marca, color o categoría…"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={categoria === "" ? "default" : "outline"} onClick={() => setCategoria("")}>
          Todas
        </Button>
        {categorias.map((c) => (
          <Button
            key={c.id_categoria}
            size="sm"
            variant={categoria === c.nombre ? "default" : "outline"}
            onClick={() => setCategoria(c.nombre)}
          >
            {c.nombre}
          </Button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : productos.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Sin productos</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <ProductCard
              key={p.id_producto}
              producto={p}
              href={`/admin-sede/catalogo/${p.id_producto}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
