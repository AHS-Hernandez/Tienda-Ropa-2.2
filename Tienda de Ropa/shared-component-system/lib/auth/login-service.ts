import { getDbPool, sql } from "@/lib/db"
import {
  ROLE_HOME_PATH,
  nivelToRole,
  type NivelAcceso,
} from "@/lib/auth/constants"
import type { LoginError, LoginResult, SessionUser } from "@/lib/auth/types"

interface LoginRow {
  id_usuario: number
  id_persona: number
  Username: string
  NombreCompleto: string
  Nivel_acceso: number
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<LoginResult | LoginError> {
  try {
    const pool = await getDbPool()

    const loginResult = await pool
      .request()
      .input("Username", sql.NVarChar(100), username.trim())
      .input("Password", sql.NVarChar(255), password)
      .execute<LoginRow>("Seguridad.sp_Login_Usuario")

    const row = loginResult.recordset[0]
    if (!row) {
      return { ok: false, message: "Usuario o contraseña incorrectos." }
    }

    const role = nivelToRole(row.Nivel_acceso)
    if (!role) {
      return { ok: false, message: "Nivel de acceso no válido." }
    }

    const sedeResult = await pool
      .request()
      .input("id_usuario", sql.Int, row.id_usuario)
      .query<{ id_sede: number }>(
        "SELECT id_sede FROM Seguridad.Usuario WHERE id_usuario = @id_usuario"
      )

    const id_sede = sedeResult.recordset[0]?.id_sede ?? 1

    const user: SessionUser = {
      id_usuario: row.id_usuario,
      id_persona: row.id_persona,
      id_sede,
      username: row.Username,
      nombreCompleto: row.NombreCompleto,
      nivelAcceso: row.Nivel_acceso as NivelAcceso,
      role,
    }

    return {
      ok: true,
      user,
      redirectTo: ROLE_HOME_PATH[role],
    }
  } catch (error) {
    console.error("[authenticateUser]", error)
    const message =
      error instanceof Error && error.message.includes("variables de entorno")
        ? "Servidor de base de datos no configurado. Revise el archivo .env.local."
        : "No se pudo conectar al sistema. Intente más tarde."
    return { ok: false, message }
  }
}
