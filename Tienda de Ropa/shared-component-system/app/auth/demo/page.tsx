"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, ShoppingCart, Building2, Crown, Cross } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard, AuthHeader } from "@/components/auth/auth-card";
import { RoleCard } from "@/components/auth/role-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "cliente",
    title: "Cliente",
    description: "Explora productos, realiza compras y gestiona tus pedidos",
    icon: User,
    gradient: "bg-blue-500",
    path: "/cliente/home",
  },
  {
    id: "vendedor",
    title: "Vendedor",
    description: "Punto de venta, atención al cliente y registro de transacciones",
    icon: ShoppingCart,
    gradient: "bg-brand-500",
    path: "/vendedor/pos",
  },
  {
    id: "admin-sede",
    title: "Admin de Sede",
    description: "Gestión de inventario, empleados y reportes de sucursal",
    icon: Building2,
    gradient: "bg-purple-500",
    path: "/admin-sede/dashboard",
  },
  {
    id: "admin-global",
    title: "Admin Global",
    description: "Control total del sistema, todas las sucursales y configuración",
    icon: Crown,
    gradient: "bg-amber-500",
    path: "/owner/dashboard",
  },
];

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-card/50 backdrop-blur-sm"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Cross className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">La Santa Cruz</h1>
              <p className="text-xs text-muted-foreground">Demo Mode</p>
            </div>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Iniciar sesión real
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground">
              Selecciona un rol para explorar
            </h2>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
              Prueba la plataforma desde diferentes perspectivas. Cada rol tiene acceso a funcionalidades específicas.
            </p>
          </motion.div>

          {/* Role Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <RoleCard
                  title={role.title}
                  description={role.description}
                  icon={role.icon}
                  gradient={role.gradient}
                  onClick={() => router.push(role.path)}
                />
              </motion.div>
            ))}
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/50 text-center"
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Modo Demo:</span>{" "}
              Los datos mostrados son ficticios. Las acciones no afectan ningún sistema real.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
