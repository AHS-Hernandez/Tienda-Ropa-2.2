# Inventario preliminar: Páginas y APIs por rol

Este documento lista las páginas (app) y endpoints API relevantes para los roles `vendedor`, `admin-sede` y `owner` encontrados en el repositorio, y las funciones principales de la capa de datos que consumen.

## Vendedor

- Páginas:
  - `app/vendedor/layout.tsx`
  - `app/vendedor/pos/page.tsx`
  - `app/vendedor/ventas/page.tsx`
  - `app/vendedor/stock/page.tsx`
  - `app/vendedor/clientes/page.tsx`

- APIs (ruta de archivo):
  - `app/api/vendedor/ventas/route.ts` — acciones: GET, POST, DELETE. Funciones clave: `getMonitorVentas`, `crearVentaBorrador`, `ensureBorradorVenta`, `agregarProductoVenta`, `procesarCobroVenta`, `getCarritoCompleto`, `vaciarBorrador`, `eliminarLineaVenta` (desde `lib/data/*`).
  - `app/api/vendedor/stock/route.ts` — GET. Función: `getStockSede`.
  - `app/api/vendedor/clientes/route.ts` — GET/POST. Funciones: `buscarClientesSede`, `getClienteDetalle`, `registrarClienteCompleto`, `modificarCliente`, `activarUsuarioClienteExistente`, `buscarPersonaPorEmail`.
  - `app/api/vendedor/catalogo/route.ts` — GET. Función: `getCatalogoProductos`.

## Admin-sede

- Páginas:
  - `app/admin-sede/layout.tsx`
  - `app/admin-sede/dashboard/page.tsx`
  - `app/admin-sede/inventario/page.tsx`
  - `app/admin-sede/usuarios/page.tsx`
  - `app/admin-sede/empleados/page.tsx`
  - `app/admin-sede/reportes/page.tsx`
  - `app/admin-sede/ajustes/page.tsx`

- APIs:
  - `app/api/admin-sede/ventas/route.ts` — (ver archivo).
  - `app/api/admin-sede/inventario/route.ts` — GET/POST. Funciones: `getReporteAjustes`, `ejecutarAjusteInventario`, `buscarProductosCompra`.
  - `app/api/admin-sede/usuarios/route.ts` — GET/POST/PUT. Funciones: `getUsuariosSistema`, `getDirectorioRRHH`, `crearUsuarioEmpleado`, `actualizarSeguridadUsuario`.
  - `app/api/admin-sede/empleados/route.ts` — (ver archivo).
  - `app/api/admin-sede/dashboard/route.ts` — (ver archivo).
  - `app/api/admin-sede/stock/route.ts` — (ver archivo).

## Owner (dueño)

- Páginas:
  - `app/owner/layout.tsx`
  - `app/owner/dashboard/page.tsx`
  - `app/owner/usuarios/page.tsx`
  - `app/owner/stock/page.tsx`
  - `app/owner/sedes/page.tsx`
  - `app/owner/compras/page.tsx`
  - `app/owner/catalogo-maestro/page.tsx`
  - `app/owner/bitacora/page.tsx`
  - `app/owner/marketing/page.tsx`

- APIs:
  - `app/api/owner/dashboard/route.ts` — GET. Funciones: `getVentasUltimos7Dias`, `getVentasPorCategoria7Dias`, `getVentasHoyCentral`, `countStockCriticoCentral`, `getEstadoRed`, `getBitacora`.
  - `app/api/owner/usuarios/route.ts` — (ver archivo).
  - `app/api/owner/stock/route.ts` — (ver archivo).
  - `app/api/owner/sedes/route.ts` — (ver archivo).
  - `app/api/owner/compras/route.ts` — (ver archivo).
  - `app/api/owner/bitacora/route.ts` — (ver archivo).
  - `app/api/owner/global-live/route.ts` — (ver archivo) — indica features de estado en tiempo real.

## Observaciones y próximos pasos sugeridos

- Muchas rutas API usan `requireApiSession([...roles])` en `lib/auth/api` para validar sesión y roles; la lógica central de seguridad está en `lib/auth` y `middleware.ts`.
- La capa de datos (`lib/data/*`) encapsula el acceso a la base de datos; varios endpoints delegan a funciones que probablemente llamen a stored procedures. Para cambios funcionales, revisar esas funciones y los SP en `SQL/Procedures, Functions/`.
- Sugerencia inmediata: crear `env.example` con variables usadas (`AUTH_SECRET`, `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `DB_ENCRYPT`, `DB_TRUST_CERT`) y un mapa detallado API → función → SP.

Si quieres, ahora genero `env.example` y hago un mapeo más exhaustivo (leer cada `route.ts` y extraer las funciones exactas de `lib/data` y los SP asociados).
