"use client"

import { useEffect, useState } from "react"
import { Star, ChevronDown, ChevronUp, Pencil, Trash2, Loader2, Lock, ThumbsUp, ThumbsDown, MessageCircle, Send, Check, X, EyeOff, Eye, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResenaForm } from "@/components/erp/resena-form"

interface RespuestaResena {
  _id: string
  autor: string
  autor_rol: "cliente" | "vendedor" | "admin-sede" | "admin-global"
  texto: string
  fecha: string
  editada: boolean
  es_mia: boolean
  likes: number
  dislikes: number
  voto_propio: "like" | "dislike" | null
}

interface Resena {
  _id: string
  rating: number
  titulo: string
  texto: string
  fecha: string
  estado?: "publicada" | "oculta"
  nombre_cliente?: string
  likes: number
  dislikes: number
  voto_propio: "like" | "dislike" | null
  respuestas: RespuestaResena[]
}

interface RespuestaConEstado extends RespuestaResena {
  estado?: "publicada" | "oculta"
}

interface Resumen {
  promedio: number
  total: number
  distribucion: Record<string, number>
}

interface ResenaMia {
  _id: string
  id_producto: number
  rating: number
  titulo: string
  texto: string
}

interface Elegibilidad {
  compro: boolean
  id_venta: number | null
  mi_resena: ResenaMia | null
}

interface ProductResenasProps {
  idProducto: number
  nombreProducto?: string
  className?: string
}

type EstadoVoto = { likes: number; dislikes: number; voto_propio: "like" | "dislike" | null }

const ROL_BADGE: Record<RespuestaResena["autor_rol"], string> = {
  cliente: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  vendedor: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "admin-sede": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "admin-global": "bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

const ROL_LABEL: Record<RespuestaResena["autor_rol"], string> = {
  cliente: "Cliente",
  vendedor: "Vendedor",
  "admin-sede": "Tienda",
  "admin-global": "Dueño",
}

function RespuestaItem({
  idResena,
  respuesta,
  esAdmin,
  onCambio,
}: {
  idResena: string
  respuesta: RespuestaConEstado
  esAdmin: boolean
  onCambio: (r: RespuestaConEstado | null) => void
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(respuesta.texto)
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState(false)

  const guardar = async () => {
    const limpio = texto.trim()
    if (!limpio) return
    setGuardando(true)
    try {
      const res = await fetch(
        `/api/cliente/resenas/${idResena}/respuestas/${respuesta._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: limpio }),
        }
      )
      const data = await res.json()
      if (data.ok) {
        onCambio({ ...respuesta, texto: limpio, editada: true })
        setEditando(false)
      } else {
        alert(data.message ?? "No se pudo editar")
      }
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async () => {
    if (!confirm("¿Eliminar esta respuesta?")) return
    setBorrando(true)
    try {
      const res = await fetch(
        `/api/cliente/resenas/${idResena}/respuestas/${respuesta._id}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (data.ok) onCambio(null)
      else alert(data.message ?? "No se pudo eliminar")
    } finally {
      setBorrando(false)
    }
  }

  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const toggleOcultar = async () => {
    const nuevo = respuesta.estado === "oculta" ? "publicada" : "oculta"
    setCambiandoEstado(true)
    try {
      const res = await fetch(
        `/api/cliente/resenas/${idResena}/respuestas/${respuesta._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevo }),
        }
      )
      const data = await res.json()
      if (data.ok) onCambio({ ...respuesta, estado: nuevo })
      else alert(data.message ?? "No se pudo cambiar el estado")
    } finally {
      setCambiandoEstado(false)
    }
  }

  const [votando, setVotando] = useState<"like" | "dislike" | null>(null)
  const votar = async (voto: "like" | "dislike") => {
    if (votando) return
    setVotando(voto)
    try {
      const res = await fetch(
        `/api/cliente/resenas/${idResena}/respuestas/${respuesta._id}/voto`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voto }),
        }
      )
      const data = await res.json()
      if (data.ok) {
        onCambio({
          ...respuesta,
          likes: data.likes,
          dislikes: data.dislikes,
          voto_propio: data.voto_propio,
        })
      } else {
        alert(data.message ?? "No se pudo votar")
      }
    } finally {
      setVotando(null)
    }
  }

  return (
    <div className={cn(
      "ml-6 mt-2 rounded-lg border p-2.5 space-y-1.5",
      respuesta.estado === "oculta"
        ? "border-amber-500/40 bg-amber-500/5 opacity-70"
        : "border-border bg-background"
    )}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground">{respuesta.autor}</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", ROL_BADGE[respuesta.autor_rol])}>
          {ROL_LABEL[respuesta.autor_rol]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {new Date(respuesta.fecha).toLocaleDateString("es-BO")}
          {respuesta.editada && " · editada"}
        </span>
        {!editando && (respuesta.es_mia || esAdmin) && (
          <div className="ml-auto flex items-center gap-1">
            {respuesta.estado === "oculta" && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Oculta
              </span>
            )}
            {respuesta.es_mia && (
              <button
                onClick={() => setEditando(true)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Editar"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {esAdmin && (
              <button
                onClick={toggleOcultar}
                disabled={cambiandoEstado}
                className="rounded p-1 text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
                title={respuesta.estado === "oculta" ? "Volver a publicar" : "Ocultar"}
              >
                {cambiandoEstado ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : respuesta.estado === "oculta" ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>
            )}
            {(respuesta.es_mia || esAdmin) && (
              <button
                onClick={borrar}
                disabled={borrando}
                className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                title="Eliminar"
              >
                {borrando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </button>
            )}
          </div>
        )}
      </div>
      {editando ? (
        <div className="space-y-1.5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={2}
            maxLength={1000}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Guardar
            </button>
            <button
              onClick={() => { setEditando(false); setTexto(respuesta.texto) }}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{respuesta.texto}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => votar("like")}
              disabled={!!votando}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-50",
                respuesta.voto_propio === "like"
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-600"
                  : "border-border bg-background text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-600"
              )}
              title="Útil"
            >
              {votando === "like" ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <ThumbsUp className="h-2.5 w-2.5" />
              )}
              <span>{respuesta.likes}</span>
            </button>
            <button
              onClick={() => votar("dislike")}
              disabled={!!votando}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-50",
                respuesta.voto_propio === "dislike"
                  ? "border-rose-500 bg-rose-500/15 text-rose-600"
                  : "border-border bg-background text-muted-foreground hover:border-rose-500/40 hover:text-rose-600"
              )}
              title="No útil"
            >
              {votando === "dislike" ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <ThumbsDown className="h-2.5 w-2.5" />
              )}
              <span>{respuesta.dislikes}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ResenaCard({
  resena,
  esAdmin,
  onVotoActualizado,
  onRespuestasActualizadas,
  onResenaEstadoCambio,
  onResenaEliminada,
}: {
  resena: Resena
  esAdmin: boolean
  onVotoActualizado: (estado: EstadoVoto) => void
  onRespuestasActualizadas: (respuestas: RespuestaResena[]) => void
  onResenaEstadoCambio: (estado: "publicada" | "oculta") => void
  onResenaEliminada: () => void
}) {
  const [enviando, setEnviando] = useState<"like" | "dislike" | null>(null)
  const [respondiendo, setRespondiendo] = useState(false)
  const [textoResp, setTextoResp] = useState("")
  const [guardandoResp, setGuardandoResp] = useState(false)
  const [modActuando, setModActuando] = useState(false)

  // Admin: ocultar/mostrar la resena padre
  const toggleOcultarResena = async () => {
    const nuevo: "publicada" | "oculta" = resena.estado === "oculta" ? "publicada" : "oculta"
    setModActuando(true)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      })
      const data = await res.json()
      if (data.ok) onResenaEstadoCambio(nuevo)
      else alert(data.message ?? "No se pudo cambiar el estado")
    } finally {
      setModActuando(false)
    }
  }

  // Admin: eliminar resena completa
  const eliminarResenaAdmin = async () => {
    if (!confirm("¿Eliminar esta reseña con todas sus respuestas?")) return
    setModActuando(true)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.ok) onResenaEliminada()
      else alert(data.message ?? "No se pudo eliminar")
    } finally {
      setModActuando(false)
    }
  }

  const votar = async (voto: "like" | "dislike") => {
    if (enviando) return
    setEnviando(voto)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}/voto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voto }),
      })
      const data = await res.json()
      if (data.ok) {
        onVotoActualizado({
          likes: data.likes,
          dislikes: data.dislikes,
          voto_propio: data.voto_propio,
        })
      } else {
        alert(data.message ?? "No se pudo registrar el voto")
      }
    } finally {
      setEnviando(null)
    }
  }

  const enviarRespuesta = async () => {
    const limpio = textoResp.trim()
    if (!limpio) return
    setGuardandoResp(true)
    try {
      const res = await fetch(`/api/cliente/resenas/${resena._id}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: limpio }),
      })
      const data = await res.json()
      if (data.ok) {
        onRespuestasActualizadas([...resena.respuestas, { ...data.respuesta, es_mia: true }])
        setTextoResp("")
        setRespondiendo(false)
      } else {
        alert(data.message ?? "No se pudo responder")
      }
    } finally {
      setGuardandoResp(false)
    }
  }

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-2",
      resena.estado === "oculta"
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-border bg-muted/30"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stars rating={resena.rating} />
          {resena.estado === "oculta" && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              <EyeOff className="h-2.5 w-2.5" />
              Oculta
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {esAdmin && (
            <>
              <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                <ShieldCheck className="h-2.5 w-2.5" />
                Moderar
              </span>
              <button
                onClick={toggleOcultarResena}
                disabled={modActuando}
                className="rounded p-1 text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
                title={resena.estado === "oculta" ? "Volver a publicar" : "Ocultar"}
              >
                {modActuando ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : resena.estado === "oculta" ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={eliminarResenaAdmin}
                disabled={modActuando}
                className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                title="Eliminar reseña"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(resena.fecha).toLocaleDateString("es-BO")}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">{resena.titulo}</p>
      <p className="text-sm text-muted-foreground">{resena.texto}</p>
      <div className="flex items-center justify-between pt-1">
        {resena.nombre_cliente && (
          <p className="text-xs text-muted-foreground">— {resena.nombre_cliente}</p>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setRespondiendo((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            title="Responder"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{resena.respuestas.length}</span>
          </button>
          <button
            onClick={() => votar("like")}
            disabled={!!enviando}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              resena.voto_propio === "like"
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-600"
                : "border-border bg-background text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-600"
            )}
            title="Útil"
          >
            {enviando === "like" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsUp className="h-3 w-3" />
            )}
            <span>{resena.likes}</span>
          </button>
          <button
            onClick={() => votar("dislike")}
            disabled={!!enviando}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              resena.voto_propio === "dislike"
                ? "border-rose-500 bg-rose-500/15 text-rose-600"
                : "border-border bg-background text-muted-foreground hover:border-rose-500/40 hover:text-rose-600"
            )}
            title="No útil"
          >
            {enviando === "dislike" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ThumbsDown className="h-3 w-3" />
            )}
            <span>{resena.dislikes}</span>
          </button>
        </div>
      </div>

      {/* Lista de respuestas */}
      {resena.respuestas.map((resp) => (
        <RespuestaItem
          key={resp._id}
          idResena={resena._id}
          respuesta={resp}
          esAdmin={esAdmin}
          onCambio={(nueva) => {
            if (nueva === null) {
              onRespuestasActualizadas(resena.respuestas.filter((r) => r._id !== resp._id))
            } else {
              onRespuestasActualizadas(
                resena.respuestas.map((r) => (r._id === resp._id ? nueva : r))
              )
            }
          }}
        />
      ))}

      {/* Formulario de respuesta */}
      {respondiendo && (
        <div className="ml-6 mt-2 space-y-1.5">
          <textarea
            value={textoResp}
            onChange={(e) => setTextoResp(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={2}
            maxLength={1000}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center gap-1.5">
            <button
              onClick={enviarRespuesta}
              disabled={guardandoResp || !textoResp.trim()}
              className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardandoResp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Responder
            </button>
            <button
              onClick={() => { setRespondiendo(false); setTextoResp("") }}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5",
            s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  )
}

export function ProductResenas({ idProducto, nombreProducto = "este producto", className }: ProductResenasProps) {
  const [open, setOpen] = useState(false)
  const [resenas, setResenas] = useState<Resena[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [elegibilidad, setElegibilidad] = useState<Elegibilidad | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // estado del formulario de reseña propio
  const [escribiendo, setEscribiendo] = useState(false)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const cargar = () => {
    setLoading(true)
    return fetch(`/api/cliente/resenas?id_producto=${idProducto}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setResenas(data.resenas)
          setResumen(data.resumen)
          setElegibilidad(data.elegibilidad ?? null)
          setEsAdmin(Boolean(data.es_admin))
          setLoaded(true)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open || loaded) return
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loaded, idProducto])

  const miResena = elegibilidad?.mi_resena ?? null

  const eliminarMiResena = async () => {
    if (!miResena) return
    if (!confirm("¿Eliminar tu reseña? Esta acción no se puede deshacer.")) return
    setEliminando(true)
    try {
      const res = await fetch("/api/cliente/resenas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: miResena._id }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message)
      setLoaded(false)
      await cargar()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    } finally {
      setEliminando(false)
    }
  }

  const trasGuardar = async () => {
    setEscribiendo(false)
    setEditando(false)
    setLoaded(false)
    await cargar()
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header — siempre visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Reseñas</span>
          {resumen && resumen.total > 0 ? (
            <div className="flex items-center gap-1.5">
              <Stars rating={resumen.promedio} />
              <span className="text-sm font-medium text-foreground">{resumen.promedio}</span>
              <span className="text-xs text-muted-foreground">({resumen.total})</span>
            </div>
          ) : loaded ? (
            <span className="text-xs text-muted-foreground">Sin reseñas aún</span>
          ) : null}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Contenido expandido */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando reseñas...</p>
          )}

          {/* === Acción del cliente: reseñar / editar / mensaje === */}
          {loaded && elegibilidad && (
            <div>
              {/* Ya tiene reseña propia */}
              {miResena && !editando && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">Tu reseña</span>
                      <Stars rating={miResena.rating} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditando(true)}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        title="Editar reseña"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={eliminarMiResena}
                        disabled={eliminando}
                        className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Eliminar reseña"
                      >
                        {eliminando ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{miResena.titulo}</p>
                  <p className="text-sm text-muted-foreground">{miResena.texto}</p>
                </div>
              )}

              {/* Editando reseña existente */}
              {miResena && editando && (
                <ResenaForm
                  idProducto={idProducto}
                  nombreProducto={nombreProducto}
                  mode="edit"
                  resenaId={miResena._id}
                  initialRating={miResena.rating}
                  initialTitulo={miResena.titulo}
                  initialTexto={miResena.texto}
                  onSuccess={trasGuardar}
                  onCancel={() => setEditando(false)}
                />
              )}

              {/* No tiene reseña pero compró → puede escribir */}
              {!miResena && elegibilidad.compro && (
                escribiendo ? (
                  <ResenaForm
                    idProducto={idProducto}
                    idVenta={elegibilidad.id_venta ?? undefined}
                    nombreProducto={nombreProducto}
                    onSuccess={trasGuardar}
                    onCancel={() => setEscribiendo(false)}
                  />
                ) : (
                  <button
                    onClick={() => setEscribiendo(true)}
                    className="w-full rounded-lg border border-primary bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Escribir una reseña
                  </button>
                )
              )}

              {/* No compró → mensajito */}
              {!miResena && !elegibilidad.compro && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>Solo puedes reseñar productos que hayas comprado.</span>
                </div>
              )}
            </div>
          )}

          {/* Histograma */}
          {resumen && resumen.total > 0 && (
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = resumen.distribucion[String(star)] ?? 0
                const pct = resumen.total > 0 ? Math.round((count / resumen.total) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-right text-muted-foreground">{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Lista de reseñas */}
          {resenas.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Este producto aún no tiene reseñas.</p>
          )}

          <div className="space-y-3">
            {resenas.map((r) => (
              <ResenaCard
                key={r._id}
                resena={r}
                esAdmin={esAdmin}
                onVotoActualizado={(estado) => {
                  setResenas((prev) =>
                    prev.map((x) => (x._id === r._id ? { ...x, ...estado } : x))
                  )
                }}
                onRespuestasActualizadas={(nuevas) => {
                  setResenas((prev) =>
                    prev.map((x) => (x._id === r._id ? { ...x, respuestas: nuevas } : x))
                  )
                }}
                onResenaEstadoCambio={(nuevoEstado) => {
                  setResenas((prev) =>
                    prev.map((x) => (x._id === r._id ? { ...x, estado: nuevoEstado } : x))
                  )
                }}
                onResenaEliminada={() => {
                  setResenas((prev) => prev.filter((x) => x._id !== r._id))
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
