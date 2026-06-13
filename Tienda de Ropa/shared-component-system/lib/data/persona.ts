import { queryRows, queryOne } from "@/lib/db/query"

export async function buscarClientes(texto: string): Promise<Record<string, unknown>[]> {
  return queryRows(
    `SELECT * FROM Persona.fn_Buscar_Cliente(@texto)`,
    { texto }
  )
}

/** Búsqueda restringida a la sede del vendedor (local). */
export async function buscarClientesSede(
  texto: string,
  idSede: number
): Promise<Record<string, unknown>[]> {
  const q = texto.trim()
  if (!q) return []
  return queryRows(
    `SELECT
      c.id_cliente,
      CONCAT(p.Nombre, ' ', p.Apellido) AS Nombre_completo,
      p.CI,
      c.Nit_ci_facturacion,
      p.Email,
      p.Telefono
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p ON c.id_persona = p.id_persona
    WHERE p.id_sede = @id_sede
      AND (
        p.Nombre LIKE @busqueda
        OR p.Apellido LIKE @busqueda
        OR CONCAT(p.Nombre, ' ', p.Apellido) LIKE @busqueda
        OR p.CI LIKE @busqueda
        OR c.Nit_ci_facturacion LIKE @busqueda
        OR p.Email LIKE @busqueda
      )
    ORDER BY p.Apellido, p.Nombre`,
    { id_sede: idSede, busqueda: `%${q}%` }
  )
}

export async function getClienteDetalle(
  idCliente: number,
  idSede: number
): Promise<Record<string, unknown> | null> {
  return queryOne(
    `SELECT
      c.id_cliente,
      p.id_persona,
      p.id_sede,
      p.Nombre,
      p.Apellido,
      p.CI,
      p.Telefono,
      p.Email,
      p.Direccion,
      c.Nit_ci_facturacion
    FROM Persona.Cliente c
    INNER JOIN Persona.Persona p ON c.id_persona = p.id_persona
    WHERE c.id_cliente = @id_cliente AND p.id_sede = @id_sede`,
    { id_cliente: idCliente, id_sede: idSede }
  )
}

export async function getDirectorioClientes(
  idSede?: number
): Promise<Record<string, unknown>[]> {
  if (idSede) {
    return queryRows(
      `SELECT * FROM Persona.vw_Directorio_Clientes WHERE id_sede = @id_sede ORDER BY Nombre_completo`,
      { id_sede: idSede }
    )
  }
  return queryRows(
    `SELECT * FROM Persona.vw_Directorio_Clientes ORDER BY Nombre_completo`
  )
}

export async function getDirectorioRRHH(
  idSede?: number
): Promise<Record<string, unknown>[]> {
  if (idSede) {
    return queryRows(
      `SELECT * FROM Persona.vw_Directorio_RRHH WHERE id_sede = @id_sede ORDER BY Nombre_completo`,
      { id_sede: idSede }
    )
  }
  return queryRows(
    `SELECT * FROM Persona.vw_Directorio_RRHH ORDER BY id_sede, Nombre_completo`
  )
}

export async function registrarClienteCompleto(
  idActor: number,
  params: {
  nombre: string
  apellido: string
  ci: string
  telefono: string
  email: string
  direccion: string
  nit: string
  idSede: number
}): Promise<void> {
  const { getDbPool, sql } = await import("@/lib/db")
  const { setDbSessionContext } = await import("@/lib/db/session-context")
  await setDbSessionContext(idActor)
  const pool = await getDbPool()
  await pool
    .request()
    .input("Nombre", sql.NVarChar(100), params.nombre)
    .input("Apellido", sql.NVarChar(100), params.apellido)
    .input("CI", sql.NVarChar(50), params.ci)
    .input("Telefono", sql.NVarChar(50), params.telefono)
    .input("Email", sql.NVarChar(100), params.email)
    .input("Direccion", sql.NVarChar(sql.MAX), params.direccion)
    .input("Nit", sql.NVarChar(50), params.nit)
    .input("id_sede", sql.Int, params.idSede)
    .execute("Persona.sp_Registrar_Cliente_Completo")
}

export async function modificarCliente(params: {
  idCliente: number
  telefono?: string
  email?: string
  direccion?: string
  nit?: string
}): Promise<void> {
  const { getDbPool, sql } = await import("@/lib/db")
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_cliente", sql.Int, params.idCliente)
    .input("Telefono", sql.NVarChar(50), params.telefono ?? null)
    .input("Email", sql.NVarChar(100), params.email ?? null)
    .input("Direccion", sql.NVarChar(sql.MAX), params.direccion ?? null)
    .input("Nit", sql.NVarChar(50), params.nit ?? null)
    .execute("Persona.sp_Modificar_Cliente")
}

/** Mismos datos personales que cliente + campos laborales → sp_Contratar_Personal_Completo */
export async function contratarPersonalCompleto(
  idActor: number,
  params: {
  nombre: string
  apellido: string
  ci: string
  telefono: string
  email: string
  direccion: string
  fechaContratacion: string
  salario: number
  idSede: number
}): Promise<number> {
  const { getDbPool, sql } = await import("@/lib/db")
  const { setDbSessionContext } = await import("@/lib/db/session-context")
  await setDbSessionContext(idActor)
  const pool = await getDbPool()
  await pool
    .request()
    .input("Nombre", sql.NVarChar(100), params.nombre)
    .input("Apellido", sql.NVarChar(100), params.apellido)
    .input("CI", sql.NVarChar(50), params.ci)
    .input("Telefono", sql.NVarChar(50), params.telefono)
    .input("Email", sql.NVarChar(100), params.email)
    .input("Direccion", sql.NVarChar(sql.MAX), params.direccion)
    .input("Fecha_contratacion", sql.Date, params.fechaContratacion)
    .input("Salario", sql.Decimal(10, 2), params.salario)
    .input("id_sede", sql.Int, params.idSede)
    .execute("Persona.sp_Contratar_Personal_Completo")

  const row = await queryOne<{ id_empleado: number }>(
    `SELECT e.id_empleado
     FROM Persona.Empleado e
     INNER JOIN Persona.Persona p ON e.id_persona = p.id_persona
     WHERE p.CI = @ci AND p.id_sede = @id_sede`,
    { ci: params.ci, id_sede: params.idSede }
  )
  if (!row?.id_empleado) {
    throw new Error("Empleado contratado pero no se pudo obtener id_empleado")
  }
  return row.id_empleado
}

export async function getEmpleadoDetalle(
  idEmpleado: number,
  idSede?: number
): Promise<Record<string, unknown> | null> {
  let sqlText = `SELECT
      e.id_empleado,
      p.id_persona,
      p.id_sede,
      p.Nombre,
      p.Apellido,
      CONCAT(p.Nombre, ' ', p.Apellido) AS Nombre_completo,
      p.CI,
      p.Telefono,
      p.Email,
      p.Direccion,
      e.Fecha_contratacion,
      e.Salario_base
    FROM Persona.Empleado e
    INNER JOIN Persona.Persona p ON e.id_persona = p.id_persona
    WHERE e.id_empleado = @id_empleado`
  const params: Record<string, unknown> = { id_empleado: idEmpleado }
  if (idSede != null) {
    sqlText += ` AND p.id_sede = @id_sede`
    params.id_sede = idSede
  }
  return queryOne(sqlText, params)
}

export async function actualizarPerfilLaboral(params: {
  idEmpleado: number
  salario: number
}): Promise<void> {
  const { getDbPool, sql } = await import("@/lib/db")
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_empleado", sql.Int, params.idEmpleado)
    .input("Salario", sql.Decimal(10, 2), params.salario)
    .execute("Persona.sp_Actualizar_Perfil_Laboral")
}

export async function desactivarEmpleado(idEmpleado: number): Promise<void> {
  const { getDbPool, sql } = await import("@/lib/db")
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_empleado", sql.Int, idEmpleado)
    .execute("Persona.sp_Desactivar_Empleado")
}
