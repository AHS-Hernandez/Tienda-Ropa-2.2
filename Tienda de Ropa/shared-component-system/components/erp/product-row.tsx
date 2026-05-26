"use client"

import { useState } from "react"
import { Package, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StockStatusBadge } from "@/components/ui/status-badge"
import { formatMoney, stockStatus } from "@/lib/format"
import type { ProductoCatalogoRow } from "@/lib/data/catalogo"
import { cn } from "@/lib/utils"

interface ProductRowProps {
  product: ProductoCatalogoRow
  onAdd?: (id: number, cantidad: number) => void
  adding?: boolean
  showCosto?: boolean
  compact?: boolean
  showQty?: boolean
}

export function ProductRow({
  product,
  onAdd,
  adding,
  showCosto,
  compact,
  showQty = true,
}: ProductRowProps) {
  const [qty, setQty] = useState(1)
  const maxQty = Math.max(1, product.stock)
  const precio =
    product.precio_final != null && product.precio_final < product.precio_venta
      ? product.precio_final
      : product.precio_venta
  const tieneOferta = product.precio_final != null && product.precio_final < product.precio_venta

  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30",
        compact && "p-3"
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Package className="h-7 w-7 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground leading-tight">{product.nombre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[product.marca, product.categoria, product.subcategoria]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <StockStatusBadge status={stockStatus(product.stock)} />
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {product.talla && <span>Talla: {product.talla}</span>}
          {product.color && <span>Color: {product.color}</span>}
          <span>Stock: {product.stock}</span>
          {showCosto && product.precio_costo != null && (
            <span>Costo: {formatMoney(product.precio_costo)}</span>
          )}
        </div>

        {product.promocion && product.promocion !== "Sin Oferta" && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
            <Tag className="h-3 w-3" />
            {product.promocion}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatMoney(precio)}</span>
            {tieneOferta && (
              <span className="text-sm text-muted-foreground line-through">
                {formatMoney(product.precio_venta)}
              </span>
            )}
          </div>
          {onAdd && (
            <div className="flex items-center gap-2 shrink-0">
              {showQty && product.stock > 0 && (
                <Input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(maxQty, Number(e.target.value) || 1))
                    setQty(n)
                  }}
                  className="w-14 h-8 text-center text-sm px-1"
                  aria-label="Cantidad"
                />
              )}
              <Button
                size="sm"
                disabled={product.stock <= 0 || adding}
                onClick={() => onAdd(product.id_producto, showQty ? qty : 1)}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {adding ? "..." : "Agregar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
