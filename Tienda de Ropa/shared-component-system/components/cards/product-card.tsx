"use client"

import * as React from "react"
import Image from "next/image"
import { Heart, Plus, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StockStatusBadge } from "@/components/ui/status-badge"

interface ProductCardProps {
  id: string
  name: string
  brand: string
  category: string
  price: number
  discountPrice?: number | null
  discount?: number | null
  image: string
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock"
  isFavorite?: boolean
  onFavoriteToggle?: (id: string) => void
  onAddToCart?: (id: string) => void
  onQuickView?: (id: string) => void
  className?: string
}

export function ProductCard({
  id,
  name,
  brand,
  category,
  price,
  discountPrice,
  discount,
  image,
  status,
  isFavorite = false,
  onFavoriteToggle,
  onAddToCart,
  onQuickView,
  className,
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(price)

  const formattedDiscountPrice = discountPrice
    ? new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
      }).format(discountPrice)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-muted cursor-pointer"
        onClick={() => onQuickView?.(id)}
      >
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discount && (
          <div className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            -{discount}%
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle?.(id)
          }}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
            isFavorite
              ? "bg-red-500 text-white"
              : "bg-white/80 text-slate-700 hover:bg-white backdrop-blur-sm"
          )}
        >
          <Heart
            className={cn("h-4 w-4", isFavorite && "fill-current")}
          />
        </button>

        {/* Quick Add Button - Appears on Hover */}
        <div className="absolute inset-x-3 bottom-3 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart?.(id)
            }}
            disabled={status === "out-of-stock"}
            className="w-full gap-2 rounded-xl"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar al Carrito
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Brand */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{category}</span>
          <span className="font-medium text-primary">{brand}</span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
          {name}
        </h3>

        {/* Price & Status */}
        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            {formattedDiscountPrice ? (
              <>
                <p className="text-lg font-bold text-primary">
                  {formattedDiscountPrice}
                </p>
                <p className="text-sm text-muted-foreground line-through">
                  {formattedPrice}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-foreground">{formattedPrice}</p>
            )}
          </div>
          <StockStatusBadge status={status} />
        </div>
      </div>
    </motion.div>
  )
}

// Cart Item Component
interface CartItemProps {
  id: string
  name: string
  brand: string
  price: number
  quantity: number
  image: string
  size?: string
  color?: string
  onQuantityChange?: (id: string, quantity: number) => void
  onRemove?: (id: string) => void
  className?: string
}

export function CartItem({
  id,
  name,
  brand,
  price,
  quantity,
  image,
  size,
  color,
  onQuantityChange,
  onRemove,
  className,
}: CartItemProps) {
  const formattedPrice = new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(price * quantity)

  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{brand}</p>
          <h4 className="font-medium">{name}</h4>
          {(size || color) && (
            <p className="text-xs text-muted-foreground">
              {[size, color].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuantityChange?.(id, Math.max(1, quantity - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => onQuantityChange?.(id, quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-sm hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price & Remove */}
          <div className="text-right">
            <p className="font-semibold">{formattedPrice}</p>
            <button
              onClick={() => onRemove?.(id)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
