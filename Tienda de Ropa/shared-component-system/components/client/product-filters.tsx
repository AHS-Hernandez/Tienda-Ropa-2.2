'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { categories, subcategories, brands, colorOptions, sizeOptions } from '@/lib/client-mock-data'

export interface FilterState {
  categories: string[]
  subcategories: string[]
  brands: string[]
  sizes: string[]
  colors: string[]
  priceRange: [number, number]
  hasPromotion: boolean
  availability: ('disponible' | 'pocas-unidades' | 'agotado')[]
}

interface ProductFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onReset: () => void
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

const defaultFilters: FilterState = {
  categories: [],
  subcategories: [],
  brands: [],
  sizes: [],
  colors: [],
  priceRange: [0, 5000],
  hasPromotion: false,
  availability: []
}

export function ProductFilters({ filters, onChange, onReset, isOpen = true, onClose, className }: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['category', 'price', 'availability'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleArrayFilter = <K extends keyof FilterState>(
    key: K, 
    value: FilterState[K] extends (infer U)[] ? U : never
  ) => {
    const currentArray = filters[key] as unknown[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value]
    onChange({ ...filters, [key]: newArray })
  }

  const activeFiltersCount = 
    filters.categories.length +
    filters.subcategories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.availability.length +
    (filters.hasPromotion ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0)

  const FilterSection = ({ 
    id, 
    title, 
    children 
  }: { 
    id: string
    title: string
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.includes(id)
    return (
      <div className="border-b border-border last:border-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {title}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const content = (
    <div className={cn('space-y-0', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpiar
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 md:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Categories */}
      <FilterSection id="category" title="Categoría">
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.categories.includes(cat.name)}
                onCheckedChange={() => toggleArrayFilter('categories', cat.name)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {cat.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">({cat.productCount})</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Subcategories - only show if category is selected */}
      {filters.categories.length > 0 && (
        <FilterSection id="subcategory" title="Subcategoría">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filters.categories.flatMap(cat => 
              (subcategories[cat] || []).map(sub => (
                <label key={sub} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={filters.subcategories.includes(sub)}
                    onCheckedChange={() => toggleArrayFilter('subcategories', sub)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {sub}
                  </span>
                </label>
              ))
            )}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      <FilterSection id="brand" title="Marca">
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => toggleArrayFilter('brands', brand)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection id="price" title="Precio">
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onChange({ ...filters, priceRange: value as [number, number] })}
            min={0}
            max={5000}
            step={100}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              ${filters.priceRange[0].toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              ${filters.priceRange[1].toLocaleString()}
            </span>
          </div>
        </div>
      </FilterSection>

      {/* Sizes */}
      <FilterSection id="size" title="Talla">
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map(size => (
            <button
              key={size}
              onClick={() => toggleArrayFilter('sizes', size)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md border transition-all',
                filters.sizes.includes(size)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection id="color" title="Color">
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(color => (
            <button
              key={color.id}
              onClick={() => toggleArrayFilter('colors', color.id)}
              title={color.name}
              className={cn(
                'w-7 h-7 rounded-full transition-all ring-offset-2 ring-offset-background',
                filters.colors.includes(color.id)
                  ? 'ring-2 ring-primary scale-110'
                  : 'ring-1 ring-border hover:ring-primary/50'
              )}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection id="availability" title="Disponibilidad">
        <div className="space-y-2">
          {[
            { value: 'disponible' as const, label: 'Disponible' },
            { value: 'pocas-unidades' as const, label: 'Pocas unidades' },
            { value: 'agotado' as const, label: 'Agotado' }
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.availability.includes(opt.value)}
                onCheckedChange={() => toggleArrayFilter('availability', opt.value)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Promotions */}
      <FilterSection id="promotion" title="Promociones">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            checked={filters.hasPromotion}
            onCheckedChange={(checked) => onChange({ ...filters, hasPromotion: checked as boolean })}
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Solo productos con descuento
          </span>
        </label>
      </FilterSection>
    </div>
  )

  return content
}

export { defaultFilters }
