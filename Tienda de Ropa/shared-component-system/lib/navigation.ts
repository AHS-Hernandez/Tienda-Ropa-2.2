import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Package,
  User,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  FileText,
  Building2,
  Truck,
  Megaphone,
  BookOpen,
  ClipboardList,
  Warehouse,
  Radio,
  type LucideIcon,
} from "lucide-react"

export type UserRole = "cliente" | "vendedor" | "admin-sede" | "admin-global"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}

export const navigationByRole: Record<UserRole, NavItem[]> = {
  cliente: [
    { title: "Inicio", href: "/cliente/home", icon: Home },
    { title: "Catálogo", href: "/cliente/catalogo", icon: ShoppingBag },
    { title: "Carrito", href: "/cliente/carrito", icon: ShoppingCart },
    { title: "Mis Pedidos", href: "/cliente/pedidos", icon: Package },
    { title: "Perfil", href: "/cliente/perfil", icon: User },
  ],
  vendedor: [
    { title: "POS", href: "/vendedor/pos", icon: CreditCard },
    { title: "Clientes", href: "/vendedor/clientes", icon: Users },
    { title: "Ventas del Día", href: "/vendedor/ventas", icon: BarChart3 },
    { title: "Stock", href: "/vendedor/stock", icon: Package },
  ],
  "admin-sede": [
    { title: "Dashboard", href: "/admin-sede/dashboard", icon: Home },
    { title: "Inventario", href: "/admin-sede/inventario", icon: Package },
    { title: "Empleados", href: "/admin-sede/empleados", icon: Users },
    { title: "Usuarios", href: "/admin-sede/usuarios", icon: User },
    { title: "Reportes", href: "/admin-sede/reportes", icon: FileText },
    { title: "Ajustes", href: "/admin-sede/ajustes", icon: Settings },
  ],
  "admin-global": [
    { title: "Dashboard Central", href: "/owner/dashboard", icon: Home },
    { title: "Red en vivo", href: "/owner/red-tiempo-real", icon: Radio },
    { title: "Sedes", href: "/owner/sedes", icon: Building2 },
    { title: "Stock global", href: "/owner/stock", icon: Warehouse },
    { title: "Compras", href: "/owner/compras", icon: Truck },
    { title: "Marketing", href: "/owner/marketing", icon: Megaphone },
    { title: "Catálogo Maestro", href: "/owner/catalogo-maestro", icon: BookOpen },
    { title: "Usuarios Globales", href: "/owner/usuarios", icon: Users },
    { title: "Bitácora", href: "/owner/bitacora", icon: ClipboardList },
  ],
}

export const roleLabels: Record<UserRole, string> = {
  cliente: "Cliente",
  vendedor: "Vendedor",
  "admin-sede": "Admin de Sede",
  "admin-global": "Admin Global",
}

export const roleColors: Record<UserRole, string> = {
  cliente: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  vendedor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "admin-sede": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "admin-global": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

/** Activo si la ruta coincide o es subruta (excepto home exacto). */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href.endsWith("/home") || href.endsWith("/dashboard") || href.endsWith("/pos")) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
