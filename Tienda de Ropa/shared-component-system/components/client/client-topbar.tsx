'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Search, ShoppingCart, User, Menu, X, 
  ChevronRight, Package, Heart, MapPin, LogOut,
  Settings, HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientTopbarProps {
  cartCount?: number
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onSearch?: (query: string) => void
  className?: string
}

export function ClientTopbar({ 
  cartCount = 0, 
  user = { name: 'María García', email: 'maria@email.com' },
  onSearch,
  className 
}: ClientTopbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header className={cn('sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border', className)}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/tienda" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LSC</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:block">La Santa Cruz</span>
          </Link>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos, categorías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
              <Search className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Link href="/tienda/carrito">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tienda/pedidos" className="flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Mis Pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tienda/favoritos" className="flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Favoritos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tienda/direcciones" className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Direcciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tienda/ajustes" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Ajustes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tienda/ayuda" className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Ayuda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <motion.div
          initial={false}
          animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
          className="md:hidden overflow-hidden"
        >
          <form onSubmit={handleSearch} className="py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-0"
              />
            </div>
          </form>
        </motion.div>
      </div>

      {/* Categories Nav - Desktop */}
      <nav className="hidden md:block border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-6 h-10 text-sm">
            {['Hombre', 'Mujer', 'Calzado', 'Accesorios', 'Deportivo', 'Formal', 'Promociones'].map((cat) => (
              <li key={cat}>
                <Link 
                  href={`/tienda/catalogo?categoria=${cat.toLowerCase()}`}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors',
                    cat === 'Promociones' && 'text-primary font-medium'
                  )}
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}

// Mobile Bottom Navigation
export function ClientBottomNav({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        <Link href="/tienda" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px]">Inicio</span>
        </Link>
        <Link href="/tienda/catalogo" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Buscar</span>
        </Link>
        <Link href="/tienda/carrito" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 right-1/2 translate-x-4 w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px]">Carrito</span>
        </Link>
        <Link href="/tienda/favoritos" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-5 h-5" />
          <span className="text-[10px]">Favoritos</span>
        </Link>
        <Link href="/tienda/perfil" className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </Link>
      </div>
    </nav>
  )
}
