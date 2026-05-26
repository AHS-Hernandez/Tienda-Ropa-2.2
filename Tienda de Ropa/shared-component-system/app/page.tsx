"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Cross, ArrowRight, Shirt, MapPin, Star, Users, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shirt,
    title: "Moda Artesanal",
    description: "Piezas únicas bordadas a mano por artesanos bolivianos",
  },
  {
    icon: MapPin,
    title: "Sucursales",
    description: "Presencia en las principales ciudades de Bolivia",
  },
  {
    icon: Star,
    title: "Calidad Premium",
    description: "Materiales de primera calidad y acabados impecables",
  },
  {
    icon: Users,
    title: "24K+ Clientes",
    description: "Miles de clientes satisfechos nos respaldan",
  },
];

const testimonials = [
  {
    name: "María García",
    role: "Cliente frecuente",
    text: "La calidad de las prendas es excepcional. Cada pieza cuenta una historia.",
    avatar: "MG",
  },
  {
    name: "Carlos Mendez",
    role: "Coleccionista",
    text: "He comprado en muchas tiendas, pero La Santa Cruz es única en su estilo.",
    avatar: "CM",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Cross className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">La Santa Cruz</h1>
              <p className="text-xs text-muted-foreground">Moda Artesanal</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login?logout=1">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100/50 via-background to-brand-50/30 dark:from-brand-950/30 dark:via-background dark:to-brand-900/20" />
        
        {/* Floating Shapes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-400/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl"
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Nueva colección primavera 2024
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight text-balance">
              Viste la esencia de{" "}
              <span className="text-brand-600">Bolivia</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Descubre nuestra colección exclusiva de moda artesanal boliviana.
              Cada prenda es una obra de arte bordada a mano por artesanos locales.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl">
                  Comenzar ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/login?logout=1">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/demo">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-xl">
                  Explorar demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8"
          >
            {[
              { value: "12+", label: "Sucursales" },
              { value: "24K+", label: "Clientes" },
              { value: "1,800+", label: "Productos" },
              { value: "98%", label: "Satisfacción" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold text-brand-600">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              ¿Por qué elegir La Santa Cruz?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos más que una tienda de ropa, somos guardianes de la tradición artesanal boliviana.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:border-brand-400/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Lo que dicen nuestros clientes
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl p-12 text-white"
        >
          <ShoppingBag className="w-12 h-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-bold">
            Comienza tu experiencia hoy
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Únete a miles de clientes que ya disfrutan de la mejor moda artesanal boliviana.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-brand-700 hover:bg-white/90 rounded-xl">
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/auth/login?logout=1">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-white/40 text-white bg-transparent hover:bg-white/10 rounded-xl"
              >
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Cross className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-foreground">La Santa Cruz</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2024 La Santa Cruz. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
