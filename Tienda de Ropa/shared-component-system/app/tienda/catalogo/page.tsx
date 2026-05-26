'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, Grid3X3, List, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ClientTopbar, ClientBottomNav } from '@/components/client/client-topbar'
import { ProductGrid } from '@/components/client/product-grid'
import { ProductFilters, defaultFilters, type FilterState } from '@/components/client/product-filters'
import { EmptyCatalogState } from '@/components/client/catalog-components'
import { products } from '@/lib/client-mock-data'

export default function CatalogPage() {
  const [cartCount] = useState(3)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false
      }

      // Subcategory filter
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(product.subcategory)) {
        return false
      }

      // Brand filter
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false
      }

      // Size filter
      if (filters.sizes.length > 0) {
        const productSizes = product.sizes.filter(s => s.available).map(s => s.name)
        if (!filters.sizes.some(s => productSizes.includes(s))) {
          return false
        }
      }

      // Color filter
      if (filters.colors.length > 0) {
        const productColorIds = product.colors.map(c => c.id)
        if (!filters.colors.some(c => productColorIds.includes(c))) {
          return false
        }
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Promotion filter
      if (filters.hasPromotion && !product.promotion) {
        return false
      }

      // Availability filter
      if (filters.availability.length > 0 && !filters.availability.includes(product.stock)) {
        return false
      }

      return true
    })
  }, [filters])

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        // relevance - keep original order
        break
    }
    return sorted
  }, [filteredProducts, sortBy])

  const activeFiltersCount = 
    filters.categories.length +
    filters.subcategories.length +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    filters.availability.length +
    (filters.hasPromotion ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0)

  const handleResetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <ClientTopbar cartCount={cartCount} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
            <p className="text-sm text-muted-foreground">{sortedProducts.length} productos encontrados</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name">Nombre A-Z</option>
            </select>

            {/* View Mode Toggle - Desktop */}
            <div className="hidden md:flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filters Button */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden relative">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="h-full overflow-y-auto p-4">
                  <ProductFilters
                    filters={filters}
                    onChange={setFilters}
                    onReset={handleResetFilters}
                    onClose={() => setMobileFiltersOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {filters.categories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                {cat}
                <button onClick={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.brands.map(brand => (
              <span key={brand} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                {brand}
                <button onClick={() => setFilters(prev => ({ ...prev, brands: prev.brands.filter(b => b !== brand) }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.hasPromotion && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                Con descuento
                <button onClick={() => setFilters(prev => ({ ...prev, hasPromotion: false }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpiar todos
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              <ProductFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {sortedProducts.length > 0 ? (
                <ProductGrid
                  key="products"
                  products={sortedProducts}
                  onAddToCart={(product) => console.log('Add to cart:', product.id)}
                  onToggleFavorite={(id) => console.log('Toggle favorite:', id)}
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyCatalogState onAction={handleResetFilters} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {sortedProducts.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="default" size="sm" className="w-8 h-8 p-0">1</Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">2</Button>
                  <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
                </div>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <ClientBottomNav cartCount={cartCount} />
    </div>
  )
}
