import { getVentaBorradorId } from "@/lib/cart/borrador-cookie"
import type { SessionUser } from "@/lib/auth/types"
import { getDbPool, sql } from "@/lib/db"
import {
  agregarProductoVenta,
  crearVentaBorrador,
  eliminarLineaVenta,
  getCabeceraVenta,
  getLineasVenta,
  obtenerIdClientePorUsuario,
  procesarCobroVenta,
  anularVentaBorrador,
} from "@/lib/data/ventas"

export async function resolveClienteId(
  session: SessionUser,
  idClienteOverride?: number
): Promise<number> {
  if (idClienteOverride) return idClienteOverride

  let id = await obtenerIdClientePorUsuario(session.id_usuario)
  if (id) return id

  const pool = await getDbPool()
  const persona = await pool
    .request()
    .input("id_usuario", sql.Int, session.id_usuario)
    .query<{ id_persona: number; CI: string }>(
      `SELECT p.id_persona, p.CI FROM Seguridad.Usuario u
       INNER JOIN Persona.Persona p ON u.id_persona = p.id_persona
       WHERE u.id_usuario = @id_usuario`
    )

  const row = persona.recordset[0]
  if (!row) {
    throw new Error(
      "Su usuario no está vinculado a un cliente. Regístrese con sp_Registro_Maestro_Cliente o contacte a la tienda."
    )
  }

  await pool
    .request()
    .input("id_persona", sql.Int, row.id_persona)
    .input("Nit", sql.NVarChar(50), row.CI)
    .execute("Persona.sp_Convertir_Persona_En_Cliente")

  id = await obtenerIdClientePorUsuario(session.id_usuario)
  if (!id) {
    throw new Error("No se pudo vincular su cuenta como cliente.")
  }
  return id
}

export async function ensureBorradorVenta(
  session: SessionUser,
  idCliente: number
): Promise<number> {
  let idVenta = await getVentaBorradorId()

  if (idVenta) {
    const cab = await getCabeceraVenta(idVenta)
    if (cab?.estado === "Borrador") return idVenta
  }

  return crearVentaBorrador(idCliente, session.id_usuario, session.id_sede)
}

export async function getCarritoCompleto(idVenta: number) {
  const [cabecera, lineas] = await Promise.all([
    getCabeceraVenta(idVenta),
    getLineasVenta(idVenta),
  ])
  return { cabecera, lineas }
}

export async function vaciarBorrador(idVenta: number) {
  await anularVentaBorrador(idVenta)
}

export {
  agregarProductoVenta,
  eliminarLineaVenta,
  procesarCobroVenta,
}
