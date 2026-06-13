import { getDbPool, sql } from "@/lib/db"
import { toPositiveInt } from "@/lib/api/parse-int"
import { queryRows, queryOne } from "@/lib/db/query"

export async function listPromociones() {
  return queryRows(`SELECT * FROM Marketing.vw_Explorador_Descuentos_Full ORDER BY Campana`)
}

export async function listCategoriasAlcance() {
  return queryRows(
    `SELECT id_categoria, Nombre FROM Producto.vw_Listado_Categorias ORDER BY Nombre`
  )
}

export async function listSubcategoriasAlcance() {
  return queryRows(
    `SELECT id_subcategoria, Nombre, id_categoria, Categoria
     FROM Producto.vw_Listado_Subcategorias ORDER BY Categoria, Nombre`
  )
}

export async function listProductosAlcance() {
  return queryRows(
    `SELECT id_producto, Nombre, Categoria, Subcategoria
     FROM Producto.vw_Catalogo_Maestro ORDER BY Nombre`
  )
}

export async function listPromocionesCabecera() {
  return queryRows(
    `SELECT id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin
     FROM Marketing.Promocion ORDER BY id_promocion DESC`
  )
}

export async function listPromocionesActivas() {
  return queryRows(`SELECT * FROM Marketing.vw_Promociones_Activas_Hoy ORDER BY Nombre`)
}

export async function registrarCampana(params: {
  nombre: string
  porcentaje: number | null
  monto: number | null
  fechaInicio: string
  fechaFin: string
}): Promise<number> {
  const pool = await getDbPool()
  const req = pool
    .request()
    .input("nombre", sql.NVarChar(100), params.nombre)
    .input("porcentaje", sql.Decimal(5, 2), params.porcentaje)
    .input("monto", sql.Decimal(10, 2), params.monto)
    .input("fecha_inicio", sql.Date, params.fechaInicio)
    .input("fecha_fin", sql.Date, params.fechaFin)
    .output("id_promocion_generado", sql.Int)

  const result = await req.execute("Marketing.sp_Registrar_Campana")

  let id = result.output.id_promocion_generado as number | undefined
  if (!id || id <= 0) {
    const row = await queryOne<{ id: number }>(
      `SELECT TOP 1 id_promocion AS id FROM Marketing.Promocion ORDER BY id_promocion DESC`
    )
    id = row?.id
  }
  if (!id) throw new Error("No se generó id de promoción")
  return id
}

export async function modificarCampana(params: {
  idPromocion: number
  nombre: string
  porcentaje: number | null
  monto: number | null
  fechaInicio: string
  fechaFin: string
}) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_promocion", sql.Int, params.idPromocion)
    .input("nombre", sql.NVarChar(100), params.nombre)
    .input("porcentaje", sql.Decimal(5, 2), params.porcentaje)
    .input("monto", sql.Decimal(10, 2), params.monto)
    .input("fecha_inicio", sql.Date, params.fechaInicio)
    .input("fecha_fin", sql.Date, params.fechaFin)
    .execute("Marketing.sp_Modificar_Campana")
}

export async function finalizarCampana(idPromocion: number) {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id_promocion", sql.Int, idPromocion)
    .execute("Marketing.sp_Finalizar_Promocion")
}

export async function asignarAlcance(params: {
  idPromocion: number
  idProducto?: number | null
  idCategoria?: number | null
  idSubcategoria?: number | null
  montoMinimo?: number
}) {
  const idProducto = toPositiveInt(params.idProducto)
  const idCategoria = toPositiveInt(params.idCategoria)
  const idSubcategoria = toPositiveInt(params.idSubcategoria)

  if (!idProducto && !idCategoria && !idSubcategoria) {
    throw new Error(
      "Alcance inválido: seleccione producto, categoría o subcategoría."
    )
  }

  const pool = await getDbPool()
  await pool
    .request()
    .input("id_promocion", sql.Int, params.idPromocion)
    .input("id_producto", sql.Int, idProducto)
    .input("id_categoria", sql.Int, idCategoria)
    .input("id_subcategoria", sql.Int, idSubcategoria)
    .input("monto_minimo", sql.Decimal(10, 2), params.montoMinimo ?? 0)
    .execute("Marketing.sp_Asignar_Alcance_Promocion")
}

export async function limpiarAlcances(idPromocion: number) {
  await queryRows(
    `DELETE FROM Marketing.Promocion_Aplicacion WHERE id_promocion = @id`,
    { id: idPromocion }
  )
}
