"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Sidebar, MobileSidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { type UserRole } from "@/lib/navigation"
import type { SessionUser } from "@/lib/auth/types"

interface MainLayoutProps {
  children: React.ReactNode
  role: UserRole
  session?: SessionUser
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  className?: string
}

export function MainLayout({
  children,
  role,
  session,
  title,
  breadcrumbs,
  className,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        role={role}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-200",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        {/* Top Bar */}
        <TopBar
          role={role}
          session={session}
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className={cn("flex-1 pb-20 lg:pb-0", className)}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav role={role} />
    </div>
  )
}

// Page Header Component
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// Section Header Component
interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// Content Container
interface ContentContainerProps {
  children: React.ReactNode
  className?: string
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 lg:px-8", className)}>
      {children}
    </div>
  )
}
