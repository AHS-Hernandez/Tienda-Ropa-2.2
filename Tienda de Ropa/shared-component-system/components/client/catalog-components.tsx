'use client'

import { cn } from '@/lib/utils'

// Stock Badge Component
interface StockBadgeProps {
  stock: 'disponible' | 'pocas-unidades' | 'agotado'
  count?: number
  showCount?: boolean
  className?: string
}

export function StockBadge({ stock, count, showCount = false, className }: StockBadgeProps) {
  const variants = {
    disponible: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    'pocas-unidades': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    agotado: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
  }

  const labels = {
    disponible: 'Disponible',
    'pocas-unidades': 'Pocas unidades',
    agotado: 'Agotado'
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
      variants[stock],
      className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        stock === 'disponible' && 'bg-emerald-500',
        stock === 'pocas-unidades' && 'bg-amber-500',
        stock === 'agotado' && 'bg-red-500'
      )} />
      {labels[stock]}
      {showCount && count !== undefined && stock !== 'agotado' && (
        <span className="text-[10px] opacity-75">({count})</span>
      )}
    </span>
  )
}

// Promotion Badge Component
interface PromotionBadgeProps {
  discount: number
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function PromotionBadge({ discount, label, size = 'sm', className }: PromotionBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-semibold bg-primary text-primary-foreground rounded-md',
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
      className
    )}>
      {label || `-${discount}%`}
    </span>
  )
}

// Price Tag Component
interface PriceTagProps {
  price: number
  originalPrice?: number
  discount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriceTag({ price, originalPrice, discount, size = 'md', className }: PriceTagProps) {
  const formatPrice = (p: number) => 
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(p)

  const sizeClasses = {
    sm: { price: 'text-sm', original: 'text-xs' },
    md: { price: 'text-base', original: 'text-sm' },
    lg: { price: 'text-xl', original: 'text-base' }
  }

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-bold text-foreground', sizeClasses[size].price)}>
        {formatPrice(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span className={cn('text-muted-foreground line-through', sizeClasses[size].original)}>
            {formatPrice(originalPrice)}
          </span>
          {discount && (
            <span className={cn('text-primary font-medium', sizeClasses[size].original)}>
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  )
}

// Size Selector Component
interface SizeSelectorProps {
  sizes: { id: string; name: string; available: boolean }[]
  selectedSize: string | null
  onSelect: (sizeId: string) => void
  className?: string
}

export function SizeSelector({ sizes, selectedSize, onSelect, className }: SizeSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {sizes.map((size) => (
        <button
          key={size.id}
          onClick={() => size.available && onSelect(size.id)}
          disabled={!size.available}
          className={cn(
            'min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all',
            'border-2',
            selectedSize === size.id
              ? 'border-primary bg-primary text-primary-foreground'
              : size.available
                ? 'border-border bg-background hover:border-primary/50 text-foreground'
                : 'border-border/50 bg-muted text-muted-foreground cursor-not-allowed line-through'
          )}
        >
          {size.name}
        </button>
      ))}
    </div>
  )
}

// Color Selector Component
interface ColorSelectorProps {
  colors: { id: string; name: string; hex: string }[]
  selectedColor: string | null
  onSelect: (colorId: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function ColorSelector({ colors, selectedColor, onSelect, size = 'md', className }: ColorSelectorProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8'
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {colors.map((color) => (
        <button
          key={color.id}
          onClick={() => onSelect(color.id)}
          title={color.name}
          className={cn(
            'rounded-full transition-all ring-offset-2 ring-offset-background',
            sizeClasses[size],
            selectedColor === color.id
              ? 'ring-2 ring-primary scale-110'
              : 'ring-1 ring-border hover:ring-primary/50'
          )}
          style={{ backgroundColor: color.hex }}
        >
          {color.hex === '#FFFFFF' && (
            <span className="sr-only">{color.name}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// Quantity Stepper Component
interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled = false, className }: QuantityStepperProps) {
  const decrease = () => {
    if (value > min) onChange(value - 1)
  }

  const increase = () => {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className={cn(
      'inline-flex items-center border border-border rounded-lg overflow-hidden',
      disabled && 'opacity-50',
      className
    )}>
      <button
        onClick={decrease}
        disabled={disabled || value <= min}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="w-10 h-8 flex items-center justify-center text-sm font-medium bg-background">
        {value}
      </span>
      <button
        onClick={increase}
        disabled={disabled || value >= max}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// Category Card Component
import { User, Footprints, Watch, Dumbbell, Briefcase } from 'lucide-react'

interface CategoryCardProps {
  name: string
  icon: string
  productCount: number
  onClick?: () => void
  className?: string
}

const iconMap: Record<string, React.ReactNode> = {
  user: <User className="w-6 h-6" />,
  footprints: <Footprints className="w-6 h-6" />,
  watch: <Watch className="w-6 h-6" />,
  dumbbell: <Dumbbell className="w-6 h-6" />,
  briefcase: <Briefcase className="w-6 h-6" />
}

export function CategoryCard({ name, icon, productCount, onClick, className }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border',
        'hover:border-primary/50 hover:shadow-md transition-all group',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {iconMap[icon] || <User className="w-6 h-6" />}
      </div>
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-xs text-muted-foreground">{productCount} productos</span>
    </button>
  )
}

// Product Skeleton Component
export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-4 animate-pulse', className)}>
      <div className="aspect-square bg-muted rounded-lg mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="w-4 h-4 bg-muted rounded-full" />
          <div className="w-4 h-4 bg-muted rounded-full" />
          <div className="w-4 h-4 bg-muted rounded-full" />
        </div>
        <div className="h-5 bg-muted rounded w-1/3 mt-3" />
      </div>
    </div>
  )
}

// Empty Catalog State Component
import { PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyCatalogStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyCatalogState({ 
  title = 'No se encontraron productos',
  description = 'Intenta ajustar los filtros o buscar algo diferente',
  actionLabel = 'Limpiar filtros',
  onAction,
  className 
}: EmptyCatalogStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <PackageX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
