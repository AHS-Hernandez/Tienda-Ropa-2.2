'use client'

import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StockBadge, PriceTag } from './catalog-components'
import type { CartItem } from '@/lib/client-mock-data'

interface CartSummaryProps {
  items: CartItem[]
  className?: string
}

export function CartSummary({ items, className }: CartSummaryProps) {
  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const originalTotal = items.reduce((acc, item) => {
    const price = item.product.originalPrice || item.product.price
    return acc + (price * item.quantity)
  }, 0)
  const discount = originalTotal - subtotal
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const formatPrice = (p: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(p)

  return (
    <div className={cn('bg-card border border-border rounded-xl p-5 space-y-4', className)}>
      <h3 className="font-semibold text-lg text-foreground">Resumen del Pedido</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({items.length} productos)</span>
          <span className="text-foreground">{formatPrice(originalTotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Descuentos</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">IVA (16%)</span>
          <span className="text-foreground">{formatPrice(tax)}</span>
        </div>

        <div className="h-px bg-border my-2" />
        
        <div className="flex justify-between text-base font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full" size="lg">
          Proceder al Pago
        </Button>
        <Link href="/tienda/catalogo">
          <Button variant="outline" className="w-full">
            Continuar Comprando
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Envío gratis en compras mayores a Bs. 1.500
      </p>
    </div>
  )
}

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  className?: string
}

export function CartItemRow({ item, onUpdateQuantity, onRemove, className }: CartItemRowProps) {
  const { product, quantity, selectedSize, selectedColor } = item
  const selectedColorObj = product.colors.find(c => c.id === selectedColor)
  const selectedSizeObj = product.sizes.find(s => s.id === selectedSize)
  
  const subtotal = product.price * quantity
  const originalSubtotal = (product.originalPrice || product.price) * quantity

  const formatPrice = (p: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(p)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn('flex gap-4 p-4 bg-card border border-border rounded-xl', className)}
    >
      {/* Product Image */}
      <div className="w-24 h-24 shrink-0 bg-muted rounded-lg flex items-center justify-center">
        <svg className="w-8 h-8 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link 
              href={`/tienda/producto/${product.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {product.name}
            </Link>
            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove(product.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Attributes */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          {selectedSizeObj && (
            <span className="text-muted-foreground">
              Talla: <span className="text-foreground font-medium">{selectedSizeObj.name}</span>
            </span>
          )}
          {selectedColorObj && (
            <span className="flex items-center gap-1 text-muted-foreground">
              Color: 
              <span 
                className="w-3 h-3 rounded-full ring-1 ring-border" 
                style={{ backgroundColor: selectedColorObj.hex }}
              />
              <span className="text-foreground font-medium">{selectedColorObj.name}</span>
            </span>
          )}
        </div>

        {/* Stock Warning */}
        {product.stock === 'pocas-unidades' && (
          <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Pocas unidades disponibles</span>
          </div>
        )}

        {/* Quantity & Price */}
        <div className="flex items-center justify-between mt-3">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 h-8 flex items-center justify-center text-sm font-medium bg-background">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              disabled={quantity >= product.stockCount}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-semibold text-foreground">{formatPrice(subtotal)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(originalSubtotal)}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Cart Table for Desktop
interface CartTableProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  className?: string
}

export function CartTable({ items, onUpdateQuantity, onRemove, className }: CartTableProps) {
  const formatPrice = (p: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(p)

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
        <div className="col-span-5">Producto</div>
        <div className="col-span-1">Talla</div>
        <div className="col-span-1">Color</div>
        <div className="col-span-2 text-center">Cantidad</div>
        <div className="col-span-1 text-right">Precio</div>
        <div className="col-span-1 text-right">Subtotal</div>
        <div className="col-span-1"></div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const selectedColorObj = item.product.colors.find(c => c.id === item.selectedColor)
          const selectedSizeObj = item.product.sizes.find(s => s.id === item.selectedSize)
          const subtotal = item.product.price * item.quantity

          return (
            <motion.div
              key={item.product.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-12 gap-4 px-4 py-4 items-center"
            >
              {/* Product */}
              <div className="col-span-12 lg:col-span-5 flex items-center gap-3">
                <div className="w-16 h-16 shrink-0 bg-muted rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <Link 
                    href={`/tienda/producto/${item.product.id}`}
                    className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>
                  <StockBadge stock={item.product.stock} className="mt-1" />
                </div>
              </div>

              {/* Size */}
              <div className="col-span-3 lg:col-span-1">
                <span className="lg:hidden text-xs text-muted-foreground">Talla: </span>
                <span className="text-sm">{selectedSizeObj?.name || '-'}</span>
              </div>

              {/* Color */}
              <div className="col-span-3 lg:col-span-1 flex items-center gap-1">
                <span className="lg:hidden text-xs text-muted-foreground">Color: </span>
                {selectedColorObj && (
                  <>
                    <span 
                      className="w-4 h-4 rounded-full ring-1 ring-border" 
                      style={{ backgroundColor: selectedColorObj.hex }}
                    />
                    <span className="text-xs text-muted-foreground hidden xl:inline">{selectedColorObj.name}</span>
                  </>
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-6 lg:col-span-2 flex justify-center">
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 h-7 flex items-center justify-center text-sm font-medium bg-background">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stockCount}
                    className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Unit Price */}
              <div className="hidden lg:block col-span-1 text-right">
                <span className="text-sm">{formatPrice(item.product.price)}</span>
              </div>

              {/* Subtotal */}
              <div className="col-span-6 lg:col-span-1 text-right">
                <span className="font-semibold text-sm">{formatPrice(subtotal)}</span>
              </div>

              {/* Remove */}
              <div className="hidden lg:flex col-span-1 justify-end">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(item.product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
