"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, PartyPopper } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

// Simple confetti particle
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ["#5FA37A", "#97C1A9", "#8FC9CB", "#CCE2CB", "#D4F0F1"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x, rotate: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [0, 100, 200, 300],
        x: [x, x + (Math.random() - 0.5) * 100, x + (Math.random() - 0.5) * 150],
        rotate: [0, 360, 720]
      }}
      transition={{ 
        duration: 3,
        delay,
        ease: "easeOut"
      }}
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color, top: -20, left: "50%" }}
    />
  );
}

export default function RegisterSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 300
  }));

  return (
    <AuthLayout showBranding={false}>
      <div className="relative">
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiParticles.map((particle, i) => (
              <ConfettiParticle key={i} delay={particle.delay} x={particle.x} />
            ))}
          </div>
        )}

        <AuthCard className="text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="relative w-24 h-24 mx-auto mb-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-brand-100 dark:bg-brand-900/30"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CheckCircle2 className="w-14 h-14 text-brand-600" />
            </motion.div>
            
            {/* Sparkles */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-1 -left-2"
            >
              <PartyPopper className="w-5 h-5 text-brand-500" />
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground">
              ¡Bienvenido a La Santa Cruz!
            </h2>
            <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
              Tu cuenta ha sido creada exitosamente. Ya puedes explorar nuestra colección exclusiva de moda artesanal boliviana.
            </p>
          </motion.div>

          {/* Benefits Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid grid-cols-2 gap-3"
          >
            {[
              { label: "Descuentos exclusivos", icon: "%" },
              { label: "Envío prioritario", icon: "📦" },
              { label: "Acceso anticipado", icon: "⭐" },
              { label: "Puntos de lealtad", icon: "🎁" },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="p-3 rounded-xl bg-muted/50 text-center"
              >
                <span className="text-xl">{benefit.icon}</span>
                <p className="mt-1 text-xs text-muted-foreground">{benefit.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-8 space-y-3"
          >
            <Link href="/auth/login">
              <Button className="w-full h-12 rounded-xl">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full h-12 rounded-xl">
                Explorar catálogo
              </Button>
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-6 text-xs text-muted-foreground"
          >
            Hemos enviado un correo de confirmación a tu bandeja de entrada.
          </motion.p>
        </AuthCard>
      </div>
    </AuthLayout>
  );
}
