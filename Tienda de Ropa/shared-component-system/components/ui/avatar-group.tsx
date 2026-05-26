"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps {
  avatars: { src?: string; fallback: string; alt?: string }[]
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remaining = avatars.length - max

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  }

  const offsetClasses = {
    sm: "-ml-2",
    md: "-ml-2.5",
    lg: "-ml-3",
  }

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          className={cn(
            sizeClasses[size],
            index > 0 && offsetClasses[size],
            "border-2 border-background"
          )}
        >
          <AvatarImage src={avatar.src} alt={avatar.alt || `Avatar ${index + 1}`} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            offsetClasses[size],
            "flex items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-muted-foreground"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
