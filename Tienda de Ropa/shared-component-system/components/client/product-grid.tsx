'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Eye, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StockBadge, PromotionBadge, PriceTag, ColorSelector } from './catalog-components'
import type { Product } from '@/lib/client-mock-data'

interface ProductTableCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onToggleFavorite?: (productId: string) => void
  className?: string
}

export function ProductTableCard({ product, onAddToCart, onToggleFavorite, className }: ProductTableCardProps) {
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.id || null)

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    onToggleFavorite?.(product.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all',
        className
      )}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.promotion && (
            <PromotionBadge discount={product.promotion.discount} />
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-muted-foreground hover:bg-white hover:text-red-500'
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
        </button>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link href={`/cliente/producto/${product.id}`}>
            <Button size="sm" variant="secondary" className="h-8">
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
          </Link>
          <Button 
            size="sm" 
            className="h-8"
            disabled={product.stock === 'agotado'}
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        {/* SKU & Stock */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">{product.sku}</span>
          <StockBadge stock={product.stock} />
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Category info */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{product.category}</span>
          <span>·</span>
          <span>{product.subcategory}</span>
        </div>

        {/* Brand */}
        <span className="text-xs text-muted-foreground">{product.brand}</span>

        {/* Colors */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Colores:</span>
          <ColorSelector
            colors={product.colors}
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
            size="sm"
          />
        </div>

        {/* Sizes */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground">Tallas:</span>
          {product.sizes.slice(0, 5).map((size) => (
            <span
              key={size.id}
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border',
                size.available 
                  ? 'border-border text-foreground' 
                  : 'border-border/50 text-muted-foreground line-through'
              )}
            >
              {size.name}
            </span>
          ))}
          {product.sizes.length > 5 && (
            <span className="text-[10px] text-muted-foreground">+{product.sizes.length - 5}</span>
          )}
        </div>

        {/* Price */}
        <PriceTag 
          price={product.price} 
          originalPrice={product.originalPrice} 
          discount={product.discount}
          size="sm"
        />
      </div>
    </motion.div>
  )
}

// Product Grid Component
interface ProductGridProps {
  products: Product[]
  loading?: boolean
  onAddToCart?: (product: Product) => void
  onToggleFavorite?: (productId: string) => void
  className?: string
}

export function ProductGrid({ products, loading = false, onAddToCart, onToggleFavorite, className }: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ProductTableCard 
            product={product} 
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
          />
        </motion.div>
      ))}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-muted rounded-full" />
          <div className="w-4 h-4 bg-muted rounded-full" />
          <div className="w-4 h-4 bg-muted rounded-full" />
        </div>
        <div className="h-5 w-24 bg-muted rounded" />
      </div>
    </div>
  )
}
