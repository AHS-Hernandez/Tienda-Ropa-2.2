"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchJson } from "@/lib/api/fetch-json"
import { rowField, rowStr } from "@/lib/api/row-field"
import { Loader2, Search } from "lucide-react"

export default function OwnerUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const [editQ, setEditQ] = useState("")
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [nivel, setNivel] = useState("2")
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetchJson<{ ok: boolean; usuarios?: Record<string, unknown>[] }>(
      "/api/owner/usuarios"
    )
      .then((d) => d.ok && setUsuarios(d.usuarios ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const guardar = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      const data = await fetchJson<{ ok: boolean; message?: string }>(
        "/api/owner/usuarios",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_usuario: rowField(editRow, "id_usuario"),
            nivel_acceso: Number(nivel),
            estado: Number(editRow.Estado) === 1,
          }),
        }
      )
      if (!data.ok) throw new Error(data.message)
      setEditRow(null)
      setEditQ("")
      load()
      alert("Nivel actualizado")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const editHits =
    editQ.trim().length > 0
      ? usuarios.filter((u) => {
          const n = Number(u.Nivel_acceso)
          if (n >= 4) return false
          const q = editQ.toLowerCase()
          return (
            rowStr(u, "Username").toLowerCase().includes(q) ||
            rowStr(u, "Nombre").toLowerCase().includes(q) ||
            rowStr(u, "Apellido").toLowerCase().includes(q) ||
            rowStr(u, "id_sede").includes(q)
          )
        })
      : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios globales</h1>
        <p className="text-sm text-muted-foreground">
          Busque por nombre o correo, pulse el usuario y edite el nivel (1–3). Dueño (4) no
          editable.
        </p>
      </div>

      <Tabs defaultValue="editar">
        <TabsList>
          <TabsTrigger value="editar">Buscar y editar</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="editar" className="space-y-4 mt-4">
          <div className="rounded-xl border p-4 space-y-3 max-w-lg">
            <Label>Buscar usuario</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre, correo o sede…"
                value={editQ}
                onChange={(e) => {
                  setEditQ(e.target.value)
                  if (!e.target.value.trim()) setEditRow(null)
                }}
              />
            </div>
            {editHits.length > 0 && !editRow && (
              <ul className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                {editHits.map((u) => (
                  <li key={String(rowField(u, "id_usuario"))}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setEditRow(u)
                        setNivel(String(rowField(u, "Nivel_acceso") ?? "2"))
                      }}
                    >
                      <span className="font-medium">
                        Sede {rowStr(u, "id_sede")} — {rowStr(u, "Nombre")}{" "}
                        {rowStr(u, "Apellido")}
                      </span>
                      <span className="text-muted-foreground ml-2 block text-xs">
                        {rowStr(u, "Username")} · nivel {rowStr(u, "Nivel_acceso")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {editRow && (
            <div className="rounded-xl border p-4 space-y-3 max-w-lg bg-muted/30">
              <h2 className="font-semibold">
                {rowStr(editRow, "Nombre")} {rowStr(editRow, "Apellido")}
              </h2>
              <p className="text-sm text-muted-foreground">{rowStr(editRow, "Username")}</p>
              <div>
                <Label>Nivel de acceso</Label>
                <Select value={nivel} onValueChange={setNivel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Cliente</SelectItem>
                    <SelectItem value="2">2 — Vendedor</SelectItem>
                    <SelectItem value="3">3 — Admin sede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-brand-600"
                  onClick={guardar}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar nivel"}
                </Button>
                <Button variant="outline" onClick={() => setEditRow(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          ) : (
            <DataTableView
              rows={usuarios.map((r) => ({
                ...r,
                Estado: Number(r.Estado) === 1 ? "Activo" : "Inactivo",
              }))}
              columnKeys={[
                "id_sede",
                "Nombre",
                "Apellido",
                "Username",
                "Nivel_acceso",
                "Estado",
              ]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
