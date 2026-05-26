import { getDbPool, sql } from "@/lib/db"
import { setDbSessionContext } from "@/lib/db/session-context"

export async function crearUsuarioEmpleado(
  idActor: number,
  params: {
    idEmpleado: number
    username: string
    password: string
    nivelAcceso: number
    idSede: number
  }
) {
  if (params.nivelAcceso >= 4) {
    throw new Error("No se puede crear usuarios de nivel 4 desde la aplicación.")
  }
  await setDbSessionContext(idActor)
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_empleado", sql.Int, params.idEmpleado)
    .input("Username", sql.NVarChar(50), params.username)
    .input("Password", sql.NVarChar(255), params.password)
    .input("Nivel_acceso", sql.Int, params.nivelAcceso)
    .input("id_sede", sql.Int, params.idSede)
    .execute("Seguridad.sp_Crear_Usuario_Empleado")
}

export async function actualizarSeguridadUsuario(
  idActor: number,
  params: {
    idUsuarioDestino: number
    nuevoNivel: number
    estado: boolean
  }
) {
  const pool = await getDbPool()
  const dest = await pool
    .request()
    .input("id", sql.Int, params.idUsuarioDestino)
    .query<{ Nivel_acceso: number }>(
      `SELECT Nivel_acceso FROM Seguridad.Usuario WHERE id_usuario = @id`
    )
  const nivelDestino = dest.recordset[0]?.Nivel_acceso
  if (nivelDestino === 4) {
    throw new Error("No se puede modificar usuarios de nivel 4 (dueño).")
  }
  if (params.nuevoNivel >= 4) {
    throw new Error("No se puede asignar nivel 4 desde la aplicación.")
  }

  await setDbSessionContext(idActor)
  await pool
    .request()
    .input("id_usuario_destino", sql.Int, params.idUsuarioDestino)
    .input("nuevo_nivel", sql.Int, params.nuevoNivel)
    .input("estado", sql.Bit, params.estado ? 1 : 0)
    .execute("Seguridad.sp_Actualizar_Seguridad_Usuario")
}
