import { getDbPool, sql } from "@/lib/db"
import { setDbSessionContext } from "@/lib/db/session-context"

export interface RegistroClienteInput {
  nombre: string
  apellido: string
  ci: string
  telefono: string
  email: string
  direccion: string
  password: string
  nit?: string
  idSede?: number
}

export async function registroMaestroCliente(
  input: RegistroClienteInput
): Promise<void> {
  const pool = await getDbPool()
  const idSede = input.idSede ?? Number(process.env.DEFAULT_SEDE_ID ?? 1)

  const actorRow = await pool
    .request()
    .query<{ id_usuario: number }>(
      `SELECT TOP 1 id_usuario FROM Seguridad.Usuario ORDER BY id_usuario`
    )
  const actorId = actorRow.recordset[0]?.id_usuario
  if (actorId) await setDbSessionContext(actorId)

  await pool
    .request()
    .input("Nombre", sql.NVarChar(100), input.nombre.trim())
    .input("Apellido", sql.NVarChar(100), input.apellido.trim())
    .input("CI", sql.NVarChar(50), input.ci.trim())
    .input("Telefono", sql.NVarChar(50), input.telefono.trim())
    .input("Email", sql.NVarChar(100), input.email.trim().toLowerCase())
    .input("Direccion", sql.NVarChar(sql.MAX), input.direccion.trim())
    .input("Password", sql.NVarChar(255), input.password)
    .input("Nit", sql.NVarChar(50), input.nit?.trim() || null)
    .input("id_sede", sql.Int, idSede)
    .execute("Seguridad.sp_Registro_Maestro_Cliente")
}
