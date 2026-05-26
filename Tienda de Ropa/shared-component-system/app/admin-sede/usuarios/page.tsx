"use client"

import { useCallback, useEffect, useState } from "react"
import { DataTableView } from "@/components/erp/data-table-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Plus, Pencil } from "lucide-react"

export default function AdminUsuariosPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [empleados, setEmpleados] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editUser, setEditUser] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    id_empleado: "",
    username: "",
    password: "",
    nivel_acceso: "2",
  })

  const load = useCallback(() => {
    setLoading(true)
    fetch("/api/admin-sede/usuarios")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRows(d.usuarios ?? [])
          setEmpleados(d.empleados ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const crear = async () => {
    const res = await fetch("/api/admin-sede/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_empleado: Number(form.id_empleado),
        username: form.username,
        password: form.password,
        nivel_acceso: Number(form.nivel_acceso),
      }),
    })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else {
      setOpen(false)
      load()
    }
  }

  const editarNivel = async () => {
    if (!editUser) return
    const res = await fetch("/api/admin-sede/usuarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario: editUser.id_usuario,
        nivel_acceso: Number(form.nivel_acceso),
        estado: Number(editUser.Estado) === 1,
      }),
    })
    const data = await res.json()
    if (!data.ok) alert(data.message)
    else {
      setEditUser(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            sp_Crear_Usuario_Empleado · sp_Actualizar_Seguridad_Usuario
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-600">
              <Plus className="h-4 w-4 mr-2" /> Credenciales
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo usuario empleado</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Empleado</Label>
                <Select value={form.id_empleado} onValueChange={(v) => setForm({ ...form, id_empleado: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                  <SelectContent>
                    {empleados.map((e) => (
                      <SelectItem key={String(e.id_empleado)} value={String(e.id_empleado)}>
                        {String(e.Nombre_completo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email (username)</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label>Nivel (1–3)</Label>
                <Select value={form.nivel_acceso} onValueChange={(v) => setForm({ ...form, nivel_acceso: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Cliente/Vendedor</SelectItem>
                    <SelectItem value="2">2 Vendedor</SelectItem>
                    <SelectItem value="3">3 Admin sede</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={crear} className="w-full bg-brand-600">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={Number(r.id_usuario)} className="flex justify-between items-center border rounded-xl p-3">
              <span className="text-sm">
                {String(r.Nombre)} {String(r.Apellido)} — {String(r.Username)} (nivel {String(r.Nivel_acceso)})
              </span>
              {Number(r.Nivel_acceso) < 4 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditUser(r)
                    setForm({ ...form, nivel_acceso: String(r.Nivel_acceso) })
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Dueño (solo lectura)</span>
              )}
            </div>
          ))}
          <DataTableView
            rows={rows.map((r) => ({
              ...r,
              Estado: Number(r.Estado) === 1 ? "Activo" : "Inactivo",
            }))}
            columnKeys={["Nombre", "Apellido", "Username", "Nivel_acceso", "Estado"]}
          />
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar nivel de acceso</DialogTitle></DialogHeader>
          <Select value={form.nivel_acceso} onValueChange={(v) => setForm({ ...form, nivel_acceso: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={editarNivel} className="w-full mt-4 bg-brand-600">Guardar nivel</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
