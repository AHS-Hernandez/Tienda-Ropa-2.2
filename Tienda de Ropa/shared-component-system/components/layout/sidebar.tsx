"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  type UserRole,
  navigationByRole,
  roleLabels,
  roleColors,
  isNavItemActive,
} from "@/lib/navigation"

interface SidebarProps {
  role: UserRole
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  className?: string
}

export function Sidebar({ role, collapsed = false, onCollapse, className }: SidebarProps) {
  const pathname = usePathname()
  const navItems = navigationByRole[role]

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                SC
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">La Santa Cruz</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-md w-fit", roleColors[role])}>
                  {roleLabels[role]}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            SC
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 h-8 w-1 rounded-r-full bg-sidebar-primary"
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                  
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 truncate"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {item.badge && !collapsed && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && collapsed && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse?.(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  )
}

// Mobile Sidebar (Drawer)
interface MobileSidebarProps {
  role: UserRole
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ role, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const navItems = navigationByRole[role]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-full w-72 border-r border-sidebar-border bg-sidebar lg:hidden"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                  SC
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-sidebar-foreground">La Santa Cruz</span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-md w-fit", roleColors[role])}>
                    {roleLabels[role]}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href)
                  const Icon = item.icon

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
