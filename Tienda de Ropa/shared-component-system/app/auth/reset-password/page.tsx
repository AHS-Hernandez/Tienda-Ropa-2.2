"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard, AuthHeader } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSuccess(true);
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <AuthLayout showBranding={false}>
        <AuthCard className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-brand-600" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground">Contraseña actualizada</h2>
            <p className="mt-2 text-muted-foreground">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              Ir al inicio de sesión
            </Button>
          </motion.div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout showBranding={false}>
      <AuthCard>
        {/* Security Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center"
        >
          <ShieldCheck className="w-8 h-8 text-brand-600" />
        </motion.div>

        <AuthHeader
          title="Nueva contraseña"
          description="Crea una nueva contraseña segura para tu cuenta"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="password">Nueva contraseña</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="Crea una contraseña segura"
              showStrength
              error={errors.password}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(val) => {
                setConfirmPassword(val);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              placeholder="Repite tu contraseña"
              error={errors.confirmPassword}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </motion.div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
