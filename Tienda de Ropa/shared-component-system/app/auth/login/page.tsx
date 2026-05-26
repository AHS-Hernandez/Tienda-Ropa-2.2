"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard, AuthHeader, AuthDivider } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    form?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "El usuario es requerido";
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrors({
          form: data.message ?? "No se pudo iniciar sesión.",
        });
        return;
      }

      const next = searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("/auth")
          ? next
          : data.redirectTo;

      router.push(target);
      router.refresh();
    } catch {
      setErrors({ form: "Error de conexión con el servidor." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title="Bienvenido de vuelta"
          description="Ingresa tu usuario del sistema (Seguridad.Usuario)"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.form && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {errors.form}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="username">Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="nombre.usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: undefined });
                }}
                className={`pl-10 h-12 rounded-xl ${errors.username ? "border-destructive" : ""}`}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="Tu contraseña"
              error={errors.password}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Recordarme en este dispositivo
            </Label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </motion.div>
        </form>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Prueba: owner@test.com / admin@test.com / vendedor@test.com / cliente@test.com — contraseña Abc123!
        </p>
        <p className="mt-2 text-xs text-center">
          <Link
            href="/auth/login?logout=1"
            className="text-muted-foreground hover:text-foreground underline"
          >
            Cerrar sesión anterior e ingresar con otra cuenta
          </Link>
        </p>

        <AuthDivider />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          ¿No tienes una cuenta?{" "}
          <Link
            href="/auth/register"
            className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            Regístrate aquí
          </Link>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 pt-4 border-t border-border"
        >
          <Link href="/auth/demo">
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              Probar demo por rol (sin base de datos)
            </Button>
          </Link>
        </motion.div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthCard>
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
