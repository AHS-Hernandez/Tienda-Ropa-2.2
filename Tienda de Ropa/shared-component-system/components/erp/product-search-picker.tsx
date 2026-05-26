"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { fetchJson } from "@/lib/api/fetch-json"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface ProductoPick {
  id_producto: number
  nombre: string
  precio_costo?: number
  marca?: string | null
  talla?: string | null
}

interface ProductSearchPickerProps {
  apiBase: string
  label?: string
  hint?: string
  onSelect: (p: ProductoPick) => void
  selectedId?: number | null
}

export function ProductSearchPicker({
  apiBase,
  label = "Buscar producto",
  hint = "Nombre, marca o número de ID. Pulse un resultado.",
  onSelect,
  selectedId,
}: ProductSearchPickerProps) {
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<ProductoPick[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const t = q.trim()
    if (t.length < 1) {
      setHits([])
      return
    }
    setLoading(true)
    setSearchError(null)
    const timer = setTimeout(() => {
      const url = `${apiBase}${apiBase.includes("?") ? "&" : "?"}productos=1&q=${encodeURIComponent(t)}`
      fetchJson<{ ok: boolean; productos?: Record<string, unknown>[]; message?: string }>(url)
        .then((d) => {
          if (!d.ok) throw new Error(d.message ?? "Error al buscar")
          setHits(
            (d.productos ?? []).map((p) => ({
              id_producto: Number(p.id_producto),
              nombre: String(p.nombre),
              precio_costo:
                p.precio_costo != null ? Number(p.precio_costo) : undefined,
              marca: p.marca != null ? String(p.marca) : null,
              talla: p.talla != null ? String(p.talla) : null,
            }))
          )
        })
        .catch((e) => {
          setHits([])
          setSearchError(e instanceof Error ? e.message : "Error de búsqueda")
        })
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [q, apiBase])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Ej.: camisa, jeans, 4…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {selectedId != null && (
        <p className="text-xs text-primary font-medium">Seleccionado: producto #{selectedId}</p>
      )}
      {loading && <p className="text-xs text-muted-foreground">Buscando…</p>}
      {searchError && (
        <p className="text-xs text-destructive">{searchError}</p>
      )}
      {hits.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-48 overflow-y-auto">
          {hits.map((p) => (
            <li key={p.id_producto}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  onSelect(p)
                  setQ(p.nombre)
                  setHits([])
                }}
              >
                <span className="font-medium">#{p.id_producto} {p.nombre}</span>
                {p.marca && (
                  <span className="text-muted-foreground ml-1">· {p.marca}</span>
                )}
                {p.precio_costo != null && (
                  <span className="block text-xs text-muted-foreground">
                    Costo ref.: {p.precio_costo}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
