"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function Skeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
    />
  )
}

export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function StatCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1 max-w-[150px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({
  items = 5,
  className,
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}
