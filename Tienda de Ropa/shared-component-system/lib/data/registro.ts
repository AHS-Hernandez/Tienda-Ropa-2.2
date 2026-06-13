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

/** Cliente ya en Persona/Cliente: solo correo + contraseña → cuenta web nivel 1 */
export async function activarUsuarioClienteExistente(params: {
  email: string
  password: string
  idSede?: number
  idActor?: number
}): Promise<void> {
  const pool = await getDbPool()
  if (params.idActor) await setDbSessionContext(params.idActor)

  const req = pool
    .request()
    .input("Email", sql.NVarChar(100), params.email.trim().toLowerCase())
    .input("Password", sql.NVarChar(255), params.password)

  if (params.idSede != null) {
    req.input("id_sede", sql.Int, params.idSede)
  } else {
    req.input("id_sede", sql.Int, null)
  }

  await req.execute("Seguridad.sp_Activar_Usuario_Cliente_Existente")
}

export async function buscarPersonaPorEmail(
  email: string,
  idSede?: number
): Promise<Record<string, unknown> | null> {
  const { queryOne } = await import("@/lib/db/query")
  let sqlText = `SELECT TOP 1
      p.id_persona,
      p.id_sede,
      p.Nombre,
      p.Apellido,
      p.CI,
      p.Email,
      p.Telefono,
      c.id_cliente,
      CASE WHEN u.id_usuario IS NOT NULL THEN 1 ELSE 0 END AS tiene_cuenta
    FROM Persona.Persona p
    LEFT JOIN Persona.Cliente c ON c.id_persona = p.id_persona
    LEFT JOIN Seguridad.Usuario u ON u.id_persona = p.id_persona
    WHERE LOWER(LTRIM(RTRIM(p.Email))) = LOWER(LTRIM(RTRIM(@email)))`
  const params: Record<string, unknown> = { email: email.trim() }
  if (idSede != null) {
    sqlText += ` AND p.id_sede = @id_sede`
    params.id_sede = idSede
  }
  return queryOne(sqlText, params)
}
