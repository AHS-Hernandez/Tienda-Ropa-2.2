# SQL y configuración

## Error FK_Bitacora_Usuario al ejecutar el patch

El trigger `Persona.trg_Bitacora_Persona` asumía `id_usuario = 1`. Si ese usuario no existe, falla.

**Solución:** ejecutar primero `SQL/SQL-Fix-Bitacora.sql` (o el final de `SQL-Patch-Frontend.sql` con el `CREATE OR ALTER TRIGGER`).

`SQL-Patch-Frontend.sql` (bloque vendedor/cliente) es **re-ejecutable**: si el CI `5566778` ya existe, reutiliza esa persona y solo crea Empleado/Usuario faltantes. No hace falta limpiar a mano por un intento fallido anterior.

## Ejecutar en SQL Server (orden recomendado)

1. Esquema base (`SQL/*.sql` según su instalación).
2. **`SQL/Datos prueba.sql`** — catálogo, stock, owner/admin/cliente.
3. **`SQL/SQL-Fix-Bitacora.sql`** (si falla FK en bitácora).
4. **`SQL/SQL-Patch-Frontend.sql`** — vistas dashboard, carrito, vendedor@test.com.
5. **`SQL/SQL-Fix-Stock-Venta.sql`** — carrito/POS validan stock por sede.
6. **`SQL/SQL-Fix-Alertas-Stock.sql`** — alertas incluyen productos agotados (stock 0).

## Vistas Linked Server (mismos nombres)

1. En **SEDE** (`10.224.111.77`): **`SQL/SQL-Sede-Login-LinkedServer.sql`** — crea `login_linkedserver` (si no existe, falla Msg 18456).
2. En **CENTRAL** (`10.224.111.230`): **`SQL/SQL-Fix-LinkedServer-SSL.sql`** — usa `@datasrc` + `encrypt=optional;trustservercertificate=yes` (no poner `Data Source=` en `@provstr`).
3. En Central: **`SQL/Views Linked Server.sql`**

Si aparece *Invalid connection string attribute*: actualice el script (no mezclar `Data Source` dentro de `@provstr`).

Vistas:

- `Inventario.vw_Stock_Sede_TiempoReal`
- `Ventas.vw_Ventas_Hoy_Global`
- `Persona.vw_Empleados_Global_TiempoReal`
- `Persona.vw_Clientes_Global_TiempoReal`

Si el linked server no está disponible, el API usa **fallback local** automáticamente.

## Carrito: Ambiguous column name id_persona

Corregido en la app (`lib/data/cart.ts`). Si persiste, reinicie `next dev`.

## Búsqueda de clientes (POS)

Ejecutar **`SQL/SQL-Fix-Buscar-Cliente.sql`** para buscar por nombre, CI, NIT o email con coincidencia parcial.

## `.env.local`

```
DB_SERVER=...
DB_DATABASE=TiendaRopa
DB_USER=...
DB_PASSWORD=...
DB_TRUST_CERT=true
AUTH_SECRET=...
```

## Carrito / POS

En **Central (TiendaRopa)** ejecutar:

1. **`SQL/SQL-Fix-Venta-Trigger-Sede.sql`** — error *No puedes registrar ventas de otra sede* (trigger usaba sede equivocada).
2. **`SQL/SQL-Fix-Stock-Venta.sql`** — stock por sede + acumular cantidad al agregar de nuevo.

Guía linked server: **`SQL/PASOS-LINKED-SERVER.md`**

Cliente debe tener fila en `Persona.Cliente` (mismo `id_persona` que `Seguridad.Usuario`). La app intenta `sp_Convertir_Persona_En_Cliente` si falta.

## Registro web

El formulario llama **`Seguridad.sp_Registro_Maestro_Cliente`** (no mock). Ejecutar en SQL:

```sql
GRANT EXECUTE ON Seguridad.sp_Registro_Maestro_Cliente TO login_nivel4;
```

(ya incluido en `SQL/SQL-Patch-Frontend.sql`).

## Usuarios de prueba (`SQL/Datos prueba.sql` + patch)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| owner@test.com | Abc123! | Dueño (4) |
| admin@test.com | Abc123! | Admin sede (3) |
| vendedor@test.com | Abc123! | Vendedor (2) |
| cliente@test.com | Abc123! | Cliente (1) |

## Sin botones de inactivar

La UI no llama `sp_Inactivar_Usuario` ni `sp_Inactivar_Proveedor`.
