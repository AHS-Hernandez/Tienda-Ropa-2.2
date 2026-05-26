import { queryRows } from "@/lib/db/query"

export interface ProductoCatalogoRow {
  id_producto: number
  nombre: string
  descripcion: string | null
  marca: string | null
  color: string | null
  talla: string | null
  precio_venta: number
  precio_costo?: number
  subcategoria: string
  categoria: string
  stock: number
  precio_final: number | null
  promocion: string | null
}

export async function getCatalogoProductos(
  idSede: number,
  options?: { categoria?: string; busqueda?: string; incluirCosto?: boolean }
): Promise<ProductoCatalogoRow[]> {
  const costoCol = options?.incluirCosto ? "c.Precio_costo AS precio_costo," : ""

  let sqlText = `
    SELECT
      c.id_producto,
      c.Nombre AS nombre,
      c.Descripcion AS descripcion,
      c.Marca AS marca,
      c.Color AS color,
      c.Talla AS talla,
      c.Precio_venta AS precio_venta,
      ${costoCol}
      c.Subcategoria AS subcategoria,
      c.Categoria AS categoria,
      ISNULL(s.Cantidad_Disponible, 0) AS stock,
      vo.Precio_Final_Oferta AS precio_final,
      vo.Promocion_Vigente AS promocion
    FROM Producto.vw_Catalogo_Maestro c
    LEFT JOIN Inventario.vw_Disponibilidad_Stock s
      ON s.id_producto = c.id_producto AND s.id_sede = @id_sede
    LEFT JOIN Marketing.vw_Validacion_Precios_Oferta vo
      ON vo.id_producto = c.id_producto
    WHERE 1=1
  `

  const params: Record<string, unknown> = { id_sede: idSede }

  if (options?.categoria) {
    sqlText += ` AND c.Categoria = @categoria`
    params.categoria = options.categoria
  }
  if (options?.busqueda) {
    sqlText += ` AND (
      c.Nombre LIKE @busqueda OR c.Marca LIKE @busqueda
      OR c.Color LIKE @busqueda OR c.Categoria LIKE @busqueda
    )`
    params.busqueda = `%${options.busqueda}%`
  }

  sqlText += ` ORDER BY c.Nombre`

  const rows = await queryRows<Record<string, unknown>>(sqlText, params)
  return rows.map((r) => ({
    id_producto: Number(r.id_producto),
    nombre: String(r.nombre),
    descripcion: r.descripcion != null ? String(r.descripcion) : null,
    marca: r.marca != null ? String(r.marca) : null,
    color: r.color != null ? String(r.color) : null,
    talla: r.talla != null ? String(r.talla) : null,
    precio_venta: Number(r.precio_venta),
    precio_costo: r.precio_costo != null ? Number(r.precio_costo) : undefined,
    subcategoria: String(r.subcategoria),
    categoria: String(r.categoria),
    stock: Number(r.stock),
    precio_final: r.precio_final != null ? Number(r.precio_final) : null,
    promocion: r.promocion != null ? String(r.promocion) : null,
  }))
}

export async function getCategorias(): Promise<{ id_categoria: number; nombre: string }[]> {
  const rows = await queryRows<{ id_categoria: number; Nombre: string }>(
    `SELECT id_categoria, Nombre FROM Producto.vw_Listado_Categorias ORDER BY Nombre`
  )
  return rows.map((r) => ({ id_categoria: r.id_categoria, nombre: r.Nombre }))
}
