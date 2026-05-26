"use client"

import { useCallback, useEffect, useState } from "react"
import { ProductRow } from "@/components/erp/product-row"
import { PageToolbar } from "@/components/erp/page-toolbar"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"
import Link from "next/link"

export default function ClienteCatalogoPage() {
  const [productos, setProductos] = useState<ProductoCatalogoRow[]>([])
  const [categorias, setCategorias] = useState<{ id_categoria: number; nombre: string }[]>([])
  const [categoria, setCategoria] = useState<string>("")
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo")
    } finally {
      setLoading(false)
    }
  }, [categoria, busqueda])

  useEffect(() => {
    fetch("/api/cliente/catalogo?categorias=1")
      .then((r) => r.json())
      .then((d) => d.ok && setCategorias(d.categorias))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const addToCart = async (idProducto: number, cantidad: number) => {
    setAddingId(idProducto)
    try {
      const res = await fetch("/api/cliente/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", id_producto: idProducto, cantidad }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setCartMsg(data.message ?? "Agregado al carrito")
      setTimeout(() => setCartMsg(null), 3000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo agregar"
      setCartMsg(msg)
      alert(msg)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            Producto.vw_Catalogo_Maestro + stock y ofertas vigentes
          </p>
        </div>
        <Link href="/cliente/carrito">
          <Button variant="outline">Ver carrito</Button>
        </Link>
      </div>

      <PageToolbar
        search={busqueda}
        onSearchChange={setBusqueda}
        searchPlaceholder="Nombre, marca, color o categoría…"
        searchHint="Escriba al menos una letra. Use la cantidad y Agregar (o pulse varias veces). Ej.: camisa, nike"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={categoria === "" ? "default" : "outline"}
          onClick={() => setCategoria("")}
        >
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

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}
      {cartMsg && (
        <p className="text-sm text-brand-700 bg-brand-50 dark:bg-brand-950/30 rounded-lg px-3 py-2">
          {cartMsg} — <Link href="/cliente/carrito" className="underline font-medium">Ver carrito</Link>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3">
          {productos.map((p) => (
            <ProductRow
              key={p.id_producto}
              product={p}
              onAdd={addToCart}
              adding={addingId === p.id_producto}
            />
          ))}
          {productos.length === 0 && !error && (
            <p className="text-center text-muted-foreground py-12">Sin productos</p>
          )}
        </div>
      )}
    </div>
  )
}
