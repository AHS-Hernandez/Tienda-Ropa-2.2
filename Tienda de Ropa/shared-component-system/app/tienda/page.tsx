'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Package, Clock, Truck, CheckCircle, ArrowRight, Tag, Percent, Gift, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ClientTopbar, ClientBottomNav } from '@/components/client/client-topbar'
import { CategoryCard, StockBadge, PriceTag, PromotionBadge } from '@/components/client/catalog-components'
import { categories, promotions, products, recentOrders } from '@/lib/client-mock-data'

export default function ClientHomePage() {
  const [cartCount] = useState(3)

  const featuredProducts = products.slice(0, 6)
  const orderStatusIcons = {
    pendiente: Clock,
    procesando: Package,
    enviado: Truck,
    entregado: CheckCircle,
    cancelado: Clock
  }

  const orderStatusColors = {
    pendiente: 'text-amber-500',
    procesando: 'text-blue-500',
    enviado: 'text-indigo-500',
    entregado: 'text-emerald-500',
    cancelado: 'text-red-500'
  }

  const promotionIcons = [Tag, Percent, Gift, Zap]

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <ClientTopbar cartCount={cartCount} />
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Section 1: Promotional Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Promociones Activas</h2>
            <Link href="/tienda/promociones" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {promotions.map((promo, index) => {
              const Icon = promotionIcons[index % promotionIcons.length]
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">{promo.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{promo.description}</p>
                    </div>
                  </div>
                  {promo.code && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">{promo.code}</span>
                      {promo.discount > 0 && (
                        <span className="text-sm font-bold text-primary">-{promo.discount}%</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Section 2: Quick Access Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Categorías</h2>
            <Link href="/tienda/catalogo" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver catálogo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/tienda/catalogo?categoria=${category.slug}`}>
                  <CategoryCard
                    name={category.name}
                    icon={category.icon}
                    productCount={category.productCount}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 3: Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Productos Destacados</h2>
            <Link href="/tienda/catalogo" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Table Header - Desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Colores / Tallas</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-1"></div>
            </div>

            {/* Products */}
            <div className="divide-y divide-border">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
                >
                  {/* Product Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-14 h-14 shrink-0 bg-muted rounded-lg flex items-center justify-center relative">
                      <svg className="w-6 h-6 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {product.promotion && (
                        <PromotionBadge discount={product.promotion.discount} className="absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/tienda/producto/${product.id}`} className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2 hidden md:block">
                    <p className="text-sm text-foreground">{product.category}</p>
                    <p className="text-xs text-muted-foreground">{product.subcategory}</p>
                  </div>

                  {/* Colors & Sizes */}
                  <div className="col-span-2 hidden md:block">
                    <div className="flex items-center gap-1 mb-1">
                      {product.colors.slice(0, 4).map((color) => (
                        <span
                          key={color.id}
                          className="w-4 h-4 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{product.colors.length - 4}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {product.sizes.filter(s => s.available).slice(0, 4).map((size) => (
                        <span key={size.id} className="text-[10px] px-1 py-0.5 bg-muted rounded text-muted-foreground">
                          {size.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="col-span-1 hidden md:block">
                    <StockBadge stock={product.stock} />
                  </div>

                  {/* Price */}
                  <div className="col-span-2">
                    <PriceTag 
                      price={product.price} 
                      originalPrice={product.originalPrice}
                      discount={product.discount}
                      size="sm"
                    />
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <Link href={`/tienda/producto/${product.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Recent Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pedidos Recientes</h2>
            <Link href="/tienda/pedidos" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentOrders.map((order, index) => {
              const StatusIcon = orderStatusIcons[order.status]
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono text-muted-foreground">{order.id}</span>
                    <div className={cn('flex items-center gap-1', orderStatusColors[order.status])}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{order.date}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{order.items} productos</span>
                    <span className="font-semibold text-foreground">
                      ${order.total.toLocaleString('es-MX')}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      </main>

      <ClientBottomNav cartCount={cartCount} />
    </div>
  )
}
