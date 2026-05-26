"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}

export function RoleCard({ title, description, icon: Icon, gradient, onClick }: RoleCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group w-full p-6 rounded-2xl text-left overflow-hidden",
        "bg-card border border-border/50 shadow-lg",
        "hover:border-brand-400/50 hover:shadow-xl transition-shadow"
      )}
    >
      {/* Gradient Accent */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity",
        gradient
      )} />

      <div className="relative z-10 space-y-4">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-brand-100 dark:bg-brand-900/30 text-brand-600"
        )}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-sm font-medium text-brand-600 group-hover:gap-2 transition-all">
          <span>Ingresar</span>
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            className="group-hover:translate-x-1 transition-transform"
          >
            &rarr;
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
