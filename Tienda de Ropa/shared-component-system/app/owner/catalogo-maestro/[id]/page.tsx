"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFoto } from "@/components/erp/product-foto"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n)
}

export default function OwnerProductoFotoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [producto, setProducto] = useState<ProductoCatalogoRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/owner/catalogo?q=`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.message)
        const found = (d.productos as ProductoCatalogoRow[]).find(
          (p) => p.id_producto === Number(id)
        )
        if (!found) throw new Error("Producto no encontrado")
        setProducto(found)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{error ?? "Producto no encontrado"}</p>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      <div>
        <h1 className="text-2xl font-bold">{producto.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {producto.categoria} · {producto.subcategoria}
          {producto.marca && ` · ${producto.marca}`}
        </p>
        <p className="mt-1 text-lg font-semibold">
          {formatPrecio(producto.precio_venta)}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Foto del producto</h2>
        <p className="text-sm text-muted-foreground">
          Sube, cambia o elimina la foto. Formatos admitidos: JPG, PNG, WEBP. Máximo 3 MB.
        </p>
        <ProductFoto
          idProducto={producto.id_producto}
          initialFotos={producto.fotos ?? []}
          canEdit
          className="max-w-xs"
        />
      </div>
    </div>
  )
}
