# 02 — Implementación SQL

## Objetos creados

La base de datos productiva incorpora más de **cien objetos ejecutables**, organizados de la siguiente forma:

| Tipo | Cantidad aproximada | Ubicación |
| --- | --- | --- |
| Tablas con integridad referencial | 27 | `SQL/Creates.sql` |
| Procedimientos almacenados | 40+ | `SQL/Procedures, Functions/` |
| Funciones (escalares y de tabla) | 4 | `SQL/Procedures, Functions/fn_*.sql` |
| Triggers (auditoría, validación, replicación) | 15+ | `SQL/Triggers/` |
| Vistas (operativas y globales) | 22 | `SQL/Views/` |
| Logins de servidor y usuarios de BD | 5 niveles | `SQL/Seguridad/` |

## Procedimientos almacenados representativos

Los SPs encapsulan las operaciones críticas del dominio, garantizando que **toda la lógica de negocio quede en la base** y no se reimplemente en la capa de aplicación.

### Ventas

| Procedimiento | Función |
| --- | --- |
| `sp_Crear_Venta_Borrador` | Abre un carrito para un cliente; previene duplicados borrador por cliente |
| `sp_Agregar_Producto_Venta` | Añade línea al borrador con recálculo automático de totales |
| `sp_Eliminar_Producto_Venta` | Quita línea del borrador y recalcula |
| `sp_Procesar_Cobro_Venta` | Confirma la venta, asigna `Nro_factura`, descuenta stock y registra kardex |
| `sp_Marcar_Venta_Entregada` | Transiciona la venta al estado final de entrega |
| `sp_Anular_Venta_Borrador` | Cierra borradores abandonados |

### Inventario y abastecimiento

| Procedimiento | Función |
| --- | --- |
| `sp_Emitir_Orden_Compra` | Genera orden de compra a proveedor (solo Central) |
| `sp_Consolidar_Recepcion_Mercaderia` | Recibe mercadería, alimenta stock central y registra kardex |
| `sp_Transferir_Stock` | Mueve unidades entre sedes con kardex en ambos extremos |
| `sp_Ejecutar_Ajuste_Inventario` | Aplica ajustes (merma, hallazgo, corrección) con autorización |
| `sp_Anular_Orden_Compra` | Cancela órdenes no recibidas |

### Personas y seguridad

| Procedimiento | Función |
| --- | --- |
| `sp_Registrar_Cliente_Completo` | Crea persona y cliente en una sola transacción |
| `sp_Contratar_Personal_Completo` | Alta de empleado + creación opcional de usuario |
| `sp_Login_Usuario` | Autenticación con bitácora de acceso |
| `sp_Crear_Usuario_Empleado` | Asigna credenciales a un empleado existente |
| `sp_Activar_Usuario_Cliente_Existente` | Convierte un cliente sin usuario en usuario web |
| `sp_Inactivar_Usuario` | Desactivación lógica (mantiene la auditoría) |

### Marketing

| Procedimiento | Función |
| --- | --- |
| `sp_Registrar_Campana` | Crea promoción con vigencia |
| `sp_Asignar_Alcance_Promocion` | Define a qué productos/categorías aplica |
| `sp_Finalizar_Promocion` | Termina una campaña vigente |
| `fn_Calcular_Descuento_Producto` | Devuelve el descuento aplicable a un producto en un momento dado |

## Triggers

| Trigger | Propósito |
| --- | --- |
| `trg_Bitacora_Persona` | Audita inserciones, actualizaciones y borrados en `Persona` |
| `trg_Cola_Stock_Umbral` | Encola cambios de umbrales para replicación a sedes |
| `trg_Cola_Replicacion_*` | Triggers en tablas replicadas (Categoría, Subcategoría, Producto, Promoción) |
| `trg_Username_Unico` | Garantiza que `Username = Email` y evita duplicados |
| `trg_Venta_Trigger_Sede` | Valida que toda venta pertenezca a una sede activa |

El patrón de los triggers de replicación serializa `inserted` o `deleted` a JSON con `FOR JSON PATH, WITHOUT_ARRAY_WRAPPER` y lo inserta en `Configuracion.Cola_Replicacion` con su operación (`I` / `U` / `D`). El consumidor (`sp_Procesar_Cola_Replicacion`) los aplica al linked server SEDE.

## Vistas

Se distinguen tres categorías:

1. **Vistas operativas locales** — apoyan los formularios y reportes que cada sede consulta sobre sus propios datos. Ejemplos: `vw_Catalogo_Maestro`, `vw_Directorio_Clientes`, `vw_Factura_Detallada`, `vw_Disponibilidad_Stock`.
2. **Vistas de control y auditoría** — exponen información agregada para administración: `vw_Trazabilidad_Bitacora`, `vw_Reporte_Ajustes`, `vw_Estado_Red`, `vw_Stock_Bajo`.
3. **Vistas globales con linked server** — consolidan en vivo Central + Sede: `vw_Ventas_Global`, `vw_Ventas_Detalle_Global`, `vw_Stock_Sede_TiempoReal`, `vw_Empleados_Global_TiempoReal`, `vw_Clientes_Global_TiempoReal`. Cada una emite un `UNION ALL` entre el fragmento local y `SEDE.TiendaRopa.<esquema>.<tabla>`.

## Modelo de permisos por nivel

El sistema implementa **cuatro niveles de acceso** materializados como logins de SQL Server + usuarios mapeados por rol funcional.

| Nivel | Rol funcional | Permisos resumidos |
| --- | --- | --- |
| 1 | Cliente | Lectura de catálogo, lectura y escritura de sus propias reseñas y pedidos |
| 2 | Vendedor | Lectura/escritura sobre ventas y stock de su sede |
| 3 | Admin de Sede | Lectura/escritura sobre toda la operación de su sede; sin acceso a otras sedes |
| 4 | Admin Global (Dueño) | Lectura global vía linked server; escritura sobre catálogo maestro, sedes y campañas |

Los scripts `SQL/Seguridad/Seguridad.sql`, `SQL/Seguridad/Datos Configuracion.sql` y `SQL/Seguridad/SQL-Grant-LinkedServer-login_nivel4.sql` materializan estos permisos. El login dedicado `login_linkedserver` se utiliza únicamente para la comunicación entre nodos y posee permisos restringidos al mínimo necesario para las vistas globales y la replicación.

## Estado de los scripts

Todos los scripts de creación de objetos son **idempotentes** o se ejecutan en orden documentado. Los scripts de parche y corrección (`FIX-*.sql`, `SQL-Fix-*.sql`) están separados para que la línea base permanezca limpia y los ajustes posteriores sean trazables.
