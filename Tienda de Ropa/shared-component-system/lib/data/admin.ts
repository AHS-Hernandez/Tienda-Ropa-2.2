import { queryRows } from "@/lib/db/query"

export async function getUsuariosSistema(
  idSede?: number
): Promise<Record<string, unknown>[]> {
  if (idSede) {
    return queryRows(
      `SELECT * FROM Seguridad.vw_Usuarios_Sistema
       WHERE id_sede = @id_sede ORDER BY Apellido, Nombre`,
      { id_sede: idSede }
    )
  }
  return queryRows(
    `SELECT * FROM Seguridad.vw_Usuarios_Sistema ORDER BY id_sede, Apellido, Nombre`
  )
}

export async function getBitacora(idSede?: number): Promise<Record<string, unknown>[]> {
  if (idSede) {
    return queryRows(
      `SELECT TOP 200 * FROM Seguridad.vw_Trazabilidad_Bitacora
       WHERE id_sede = @id_sede ORDER BY Fecha_hora DESC`,
      { id_sede: idSede }
    )
  }
  return queryRows(
    `SELECT TOP 300 * FROM Seguridad.vw_Trazabilidad_Bitacora ORDER BY Fecha_hora DESC`
  )
}

export async function getEstadoRed(): Promise<Record<string, unknown>[]> {
  return queryRows(`SELECT * FROM Configuracion.vw_Estado_Red ORDER BY Sede`)
}

export async function getComprasTotales(): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Compras.vw_Compras_Totales ORDER BY Fecha_Emision DESC`
  )
}

export async function getPromociones(): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Marketing.vw_Explorador_Descuentos_Full ORDER BY Campana`
  )
}

export async function buscarProveedores(
  texto: string
): Promise<Record<string, unknown>[]> {
  return queryRows(`SELECT * FROM Compras.fn_Buscar_Proveedor(@texto)`, { texto })
}

export async function getProveedores(): Promise<Record<string, unknown>[]> {
  try {
    const rows = await queryRows(
      `SELECT
        id_proveedor,
        Razon_social,
        Nit,
        Contacto_nombre,
        Telefono,
        Email,
        Direccion
      FROM Compras.Proveedor
      ORDER BY Razon_social`
    )
    return rows
  } catch {
    try {
      return await queryRows(
        `SELECT * FROM Compras.vw_Directorio_Proveedores ORDER BY Razon_social`
      )
    } catch {
      return []
    }
  }
}

export async function getComprasTotalesSafe(): Promise<Record<string, unknown>[]> {
  try {
    return await getComprasTotales()
  } catch {
    return queryRows(
      `SELECT
        OC.id_compra,
        OC.Fecha AS Fecha_Emision,
        PV.Razon_social AS Proveedor,
        PV.Nit AS NIT_Proveedor,
        OC.Estado,
        OC.Total_compra
      FROM Compras.Orden_Compra OC
      INNER JOIN Compras.Proveedor PV ON OC.id_proveedor = PV.id_proveedor
      ORDER BY OC.Fecha DESC`
    )
  }
}
