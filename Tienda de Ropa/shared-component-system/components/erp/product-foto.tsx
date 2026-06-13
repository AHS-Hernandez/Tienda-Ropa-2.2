"use client"

import { useRef, useState } from "react"
import { Camera, ShoppingBag, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductFotoProps {
  idProducto: number
  initialFotos?: string[]
  canEdit?: boolean
  className?: string
}

export function ProductFoto({
  idProducto,
  initialFotos = [],
  canEdit = false,
  className,
}: ProductFotoProps) {
  const [fotos, setFotos] = useState<string[]>(initialFotos)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminandoRuta, setEliminandoRuta] = useState<string | null>(null)
  const [fotoActiva, setFotoActiva] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append("foto", file)

      const res = await fetch(`/api/foto/producto/${idProducto}`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)

      setFotos((prev) => [...prev, data.ruta])
      setFotoActiva(fotos.length)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al subir")
    } finally {
      setSubiendo(false)
    }
  }

  const eliminar = async (ruta: string) => {
    if (!confirm("¿Eliminar esta foto?")) return
    setEliminandoRuta(ruta)
    try {
      const res = await fetch(`/api/foto/producto/${idProducto}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruta }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setFotos((prev) => {
        const next = prev.filter((f) => f !== ruta)
        setFotoActiva((i) => Math.min(i, Math.max(0, next.length - 1)))
        return next
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setEliminandoRuta(null)
    }
  }

  const fotoActual = fotos[fotoActiva] ?? null

  return (
    <div className={className}>
      {/* Imagen principal */}
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-muted">
        {fotoActual ? (
          <img
            src={fotoActual}
            alt="Foto del producto"
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBag className="h-20 w-20 text-muted-foreground/20" />
        )}

        {/* Botones flotantes de gestión */}
        {canEdit && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <Button
              size="sm"
              className="gap-1.5 shadow-md"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo || !!eliminandoRuta}
            >
              {subiendo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {subiendo ? "Subiendo…" : "Agregar foto"}
            </Button>

            {fotoActual && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => eliminar(fotoActual)}
                disabled={!!eliminandoRuta || subiendo}
                className="gap-1 shadow-md bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {eliminandoRuta === fotoActual ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Miniaturas si hay más de una foto */}
      {fotos.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={f}
              onClick={() => setFotoActiva(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === fotoActiva ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={f} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
