"use client";

import { motion } from "framer-motion";
import { Cross, Shirt, ShoppingBag, TrendingUp, Users } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  showBranding?: boolean;
}

const floatingShapes = [
  { size: 120, top: "10%", left: "10%", delay: 0 },
  { size: 80, top: "60%", left: "15%", delay: 0.5 },
  { size: 100, top: "30%", left: "70%", delay: 1 },
  { size: 60, top: "80%", left: "60%", delay: 1.5 },
];

const stats = [
  { label: "Ventas Diarias", value: "$12.4K", icon: TrendingUp },
  { label: "Clientes Activos", value: "2,847", icon: Users },
  { label: "Productos", value: "1,234", icon: Shirt },
];

export function AuthLayout({ children, showBranding = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Branding Panel - Hidden on mobile */}
      {showBranding && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400"
        >
          {/* Animated Background Shapes */}
          {floatingShapes.map((shape, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ delay: shape.delay, duration: 1 }}
              className="absolute rounded-full bg-white/20 backdrop-blur-sm"
              style={{
                width: shape.size,
                height: shape.size,
                top: shape.top,
                left: shape.left,
              }}
            />
          ))}

          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Cross className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">La Santa Cruz</h1>
                <p className="text-sm text-white/70">Moda Artesanal Boliviana</p>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
                  Gestión moderna para tu negocio de moda
                </h2>
                <p className="mt-4 text-lg text-white/80 max-w-md">
                  Plataforma integral para administrar inventario, ventas y clientes de tu tienda de ropa artesanal.
                </p>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-5 h-5 text-white/70" />
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-white/60">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-2 text-sm text-white/50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Sistema de gestión retail premium</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Right Auth Content */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Cross className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">La Santa Cruz</h1>
              <p className="text-xs text-muted-foreground">Moda Artesanal</p>
            </div>
          </motion.div>

          {children}
        </div>
      </div>
    </div>
  );
}
