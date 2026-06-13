"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ResenaFormProps {
  idProducto: number
  /** Opcional: si no se pasa (reseña directa desde la ficha), el servidor resuelve la compra. */
  idVenta?: number
  nombreProducto: string
  onSuccess: () => void
  onCancel: () => void
  // modo edición
  mode?: "create" | "edit"
  resenaId?: string
  initialRating?: number
  initialTitulo?: string
  initialTexto?: string
}

export function ResenaForm({
  idProducto,
  idVenta,
  nombreProducto,
  onSuccess,
  onCancel,
  mode = "create",
  resenaId,
  initialRating = 0,
  initialTitulo = "",
  initialTexto = "",
}: ResenaFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [hover, setHover] = useState(0)
  const [titulo, setTitulo] = useState(initialTitulo)
  const [texto, setTexto] = useState(initialTexto)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError("Selecciona una calificación"); return }
    if (!titulo.trim()) { setError("Escribe un título"); return }
    if (!texto.trim()) { setError("Escribe tu comentario"); return }

    setLoading(true)
    setError(null)

    try {
      const isEdit = mode === "edit"
      const res = await fetch("/api/cliente/resenas", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { _id: resenaId, rating, titulo, texto }
            : { id_producto: idProducto, id_venta: idVenta, rating, titulo, texto }
        ),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.message); return }
      onSuccess()
    } catch {
      setError("Error al enviar la reseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-medium text-foreground">
        {mode === "edit" ? "Editar reseña: " : "Reseñar: "}
        <span className="text-primary">{nombreProducto}</span>
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hover || rating) >= star
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de tu reseña"
        maxLength={100}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Comparte tu experiencia con este producto..."
        rows={3}
        maxLength={800}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Publicar reseña"}
        </Button>
      </div>
    </form>
  )
}
