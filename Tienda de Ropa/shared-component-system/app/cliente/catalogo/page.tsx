"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/erp/product-card"
import { useTrackEvent } from "@/hooks/use-track-event"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

export default function ClienteCatalogoPage() {
  const track = useTrackEvent()
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [categorias, setCategorias] = useState<{ id_categoria: number; nombre: string }[]>([])
  const [categoria, setCategoria] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cartMsg, setCartMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoria) params.set("categoria", categoria)
      if (busqueda) params.set("q", busqueda)
      const res = await fetch(`/api/cliente/catalogo?${params}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setProductos(data.productos)

      if (busqueda) {
        track({ tipo: "busqueda", termino_busqueda: busqueda })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo")
    } finally {
      setLoading(false)
    }
  }, [categoria, busqueda, track])

  useEffect(() => {
    fetch("/api/cliente/catalogo?categorias=1")
      .then((r) => r.json())
      .then((d) => d.ok && setCategorias(d.categorias))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const addToCart = async (idProducto: number) => {
    try {
      const res = await fetch("/api/cliente/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", id_producto: idProducto, cantidad: 1 }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCartMsg(data.message ?? "Agregado al carrito")
      setTimeout(() => setCartMsg(null), 3000)
      track({ tipo: "agregar_carrito", id_producto: idProducto })
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo agregar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {productos.length} producto{productos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/cliente/carrito">
          <Button variant="outline">Ver carrito</Button>
        </Link>
      </div>

      {/* Buscador */}
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Nombre, marca, color o categoría…"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

      {/* Filtros de categoría */}
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
      {cartMsg && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-950/30">
          {cartMsg} —{" "}
          <Link href="/cliente/carrito" className="font-medium underline">
            Ver carrito
          </Link>
        </p>
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
              href={`/cliente/catalogo/${p.id_producto}`}
              onAgregar={addToCart}
              hideStock
            />
          ))}
        </div>
      )}
    </div>
  )
}
