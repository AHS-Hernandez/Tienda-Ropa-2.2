"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type UserRole, roleLabels, roleColors } from "@/lib/navigation"
import type { SessionUser } from "@/lib/auth/types"

interface TopBarProps {
  role: UserRole
  session?: SessionUser
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  onMenuClick?: () => void
  showMobileMenu?: boolean
  className?: string
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U"
}

export function TopBar({
  role,
  session,
  title,
  breadcrumbs,
  onMenuClick,
  showMobileMenu = true,
  className,
}: TopBarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [notifications, setNotifications] = React.useState<
    { id: number; title: string; message: string; read: boolean; time: string }[]
  >([])

  const showStockAlerts = role !== "cliente"

  React.useEffect(() => {
    if (!session || !showStockAlerts) return
    fetch("/api/notificaciones")
      .then((r) => r.json())
      .then((d) => d.ok && setNotifications(d.notifications ?? []))
      .catch(() => setNotifications([]))
  }, [session, showStockAlerts])

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayName = session?.nombreCompleto ?? "Usuario"
  const avatarInitials = initials(displayName)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-9 w-9 p-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.label}>
                  {index > 0 && <span className="mx-1">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
        </div>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground gap-2"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="md:hidden h-9 w-9 p-0">
          <Search className="h-5 w-5" />
        </Button>

        {showStockAlerts && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Alertas de stock
                {unreadCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {unreadCount} sin leer
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled>Sin alertas de stock</DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3"
                  >
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium max-w-[140px] truncate">{displayName}</span>
                <span className={cn("text-[10px] px-1 py-0.5 rounded", roleColors[role])}>
                  {roleLabels[role]}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{displayName}</span>
                {session?.username && (
                  <span className="text-xs font-normal text-muted-foreground">
                    @{session.username}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? "Cerrando..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
