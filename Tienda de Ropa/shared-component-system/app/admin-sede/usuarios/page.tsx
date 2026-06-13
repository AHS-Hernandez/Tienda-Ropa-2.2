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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchJson } from "@/lib/api/fetch-json"
import { rowField, rowStr } from "@/lib/api/row-field"
import { Loader2, Plus, Search } from "lucide-react"

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([])
  const [empleados, setEmpleados] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const [openCrear, setOpenCrear] = useState(false)
  const [crearForm, setCrearForm] = useState({
    id_empleado: "",
    username: "",
    password: "",
  })

  const [editQ, setEditQ] = useState("")
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [editNivel, setEditNivel] = useState("2")
  const [editActivo, setEditActivo] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetchJson<{ ok: boolean; usuarios?: Record<string, unknown>[]; empleados?: Record<string, unknown>[] }>(
      "/api/admin-sede/usuarios"
    )
      .then((d) => {
        if (d.ok) {
          setUsuarios(d.usuarios ?? [])
          setEmpleados(d.empleados ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const crear = async () => {
    setSaving(true)
    try {
      const data = await fetchJson<{ ok: boolean; message?: string }>(
        "/api/admin-sede/usuarios",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_empleado: Number(crearForm.id_empleado),
            username: crearForm.username,
            password: crearForm.password,
            nivel_acceso: 2,
          }),
        }
      )
      if (!data.ok) throw new Error(data.message)
      setOpenCrear(false)
      setCrearForm({ id_empleado: "", username: "", password: "" })
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const guardarEdicion = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      const data = await fetchJson<{ ok: boolean; message?: string }>(
        "/api/admin-sede/usuarios",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_usuario: rowField(editRow, "id_usuario"),
            nivel_acceso: Number(editNivel),
            estado: editActivo,
          }),
        }
      )
      if (!data.ok) throw new Error(data.message)
      setEditRow(null)
      setEditQ("")
      load()
      alert("Usuario actualizado")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const editHits =
    editQ.trim().length > 0
      ? usuarios.filter((u) => {
          if (Number(u.Nivel_acceso) >= 4) return false
          const q = editQ.toLowerCase()
          return (
            rowStr(u, "Username").toLowerCase().includes(q) ||
            rowStr(u, "Nombre").toLowerCase().includes(q) ||
            rowStr(u, "Apellido").toLowerCase().includes(q)
          )
        })
      : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Busque un usuario para editarlo. Solo puede crear vendedores (nivel 2).
          </p>
        </div>
        <Dialog open={openCrear} onOpenChange={setOpenCrear}>
          <DialogTrigger asChild>
            <Button className="bg-brand-600">
              <Plus className="h-4 w-4 mr-2" /> Credenciales empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo usuario vendedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Empleado</Label>
                <Select
                  value={crearForm.id_empleado}
                  onValueChange={(v) => setCrearForm({ ...crearForm, id_empleado: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((e) => (
                      <SelectItem
                        key={rowStr(e, "id_empleado")}
                        value={rowStr(e, "id_empleado")}
                      >
                        {rowStr(e, "Nombre_completo")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email (username)</Label>
                <Input
                  value={crearForm.username}
                  onChange={(e) => setCrearForm({ ...crearForm, username: e.target.value })}
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={crearForm.password}
                  onChange={(e) => setCrearForm({ ...crearForm, password: e.target.value })}
                />
              </div>
              <Button onClick={crear} disabled={saving} className="w-full bg-brand-600">
                Crear vendedor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="editar">
        <TabsList>
          <TabsTrigger value="editar">Buscar y editar</TabsTrigger>
          <TabsTrigger value="lista">Lista rápida</TabsTrigger>
        </TabsList>

        <TabsContent value="editar" className="space-y-4 mt-4">
          <div className="rounded-xl border p-4 space-y-3 max-w-lg">
            <Label>Buscar usuario</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nombre, apellido o correo…"
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
                        setEditNivel(String(rowField(u, "Nivel_acceso") ?? "2"))
                        setEditActivo(Number(u.Estado) === 1)
                      }}
                    >
                      <span className="font-medium">
                        {rowStr(u, "Nombre")} {rowStr(u, "Apellido")}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {rowStr(u, "Username")} · niv. {rowStr(u, "Nivel_acceso")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {editQ.trim() && editHits.length === 0 && !editRow && (
              <p className="text-sm text-muted-foreground">Sin coincidencias.</p>
            )}
          </div>

          {editRow && (
            <div className="rounded-xl border p-4 space-y-3 max-w-lg bg-muted/30">
              <h2 className="font-semibold">
                {rowStr(editRow, "Nombre")} {rowStr(editRow, "Apellido")}
              </h2>
              <p className="text-sm text-muted-foreground">{rowStr(editRow, "Username")}</p>
              <div>
                <Label>Nivel (solo 2 vendedor)</Label>
                <Select value={editNivel} onValueChange={setEditNivel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 — Vendedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editActivo}
                  onChange={(e) => setEditActivo(e.target.checked)}
                />
                Usuario activo
              </label>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-brand-600"
                  onClick={guardarEdicion}
                  disabled={saving}
                >
                  Guardar
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
              columnKeys={["Nombre", "Apellido", "Username", "Nivel_acceso", "Estado"]}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
