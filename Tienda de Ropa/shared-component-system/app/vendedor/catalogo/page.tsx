"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { ProductCard } from "@/components/erp/product-card"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

export default function VendedorCatalogoPage() {
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set("q", busqueda)
      const res = await fetch(`/api/vendedor/catalogo?${params}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setProductos(data.productos)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo")
    } finally {
      setLoading(false)
    }
  }, [busqueda])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Productos disponibles en tu sede — haz clic para ver reseñas
        </p>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Nombre, marca, color o categoría…"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

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
              href={`/vendedor/catalogo/${p.id_producto}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
