
-- PASO 1: LOGINS A NIVEL DE SERVIDOR
-- Ejecutar en AMBOS servidores (Central y Sede)

-- Nivel 1: Cliente (compra online o en tienda)
CREATE LOGIN login_nivel1
    WITH PASSWORD    = 'Cli123',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;

-- Nivel 2: Vendedor (caja y piso)
CREATE LOGIN login_nivel2
    WITH PASSWORD    = 'Vend123',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;

-- Nivel 3: Administrador de sede
CREATE LOGIN login_nivel3
    WITH PASSWORD    = 'Admin123',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;

-- Nivel 4: Dueño / db_owner
-- SOLO EN CENTRAL: este login en Sede no se crea
-- o se crea pero sin db_owner (ver nota al final)
CREATE LOGIN login_nivel4
    WITH PASSWORD    = 'Dueno123',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;
GO


-- ================================================================
-- PASO 2: USUARIOS DENTRO DE LA BASE DE DATOS
-- Ejecutar en AMBOS servidores
-- USE [TiendaRopa] — asegúrate de estar en la BD correcta
-- ================================================================

USE TiendaRopa;
GO

CREATE USER usr_nivel1 FOR LOGIN login_nivel1;
CREATE USER usr_nivel2 FOR LOGIN login_nivel2;
CREATE USER usr_nivel3 FOR LOGIN login_nivel3;
CREATE USER usr_nivel4 FOR LOGIN login_nivel4;
GO


-- ================================================================
-- PASO 3: ROL de nivel 4 = db_owner
-- SOLO EN CENTRAL
-- En Sede el nivel 4 no existe operativamente,
-- pero si necesitas el login para el Linked Server
-- le das un rol más restringido (ver abajo)
-- ================================================================

ALTER ROLE db_owner ADD MEMBER usr_nivel4;

-- Control total por schema documentado
GRANT CONTROL ON SCHEMA::Persona        TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Seguridad      TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Producto       TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Compras        TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Ventas         TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Inventario     TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Marketing      TO usr_nivel4;
GRANT CONTROL ON SCHEMA::Configuracion  TO usr_nivel4;
GO


-- ================================================================
-- PASO 4: PERMISOS NIVEL 1 — Cliente
-- AMBOS servidores
-- ================================================================

-- Catálogo y precios con descuento (sin precio de costo nunca)
GRANT SELECT ON Producto.vw_Catalogo_Maestro            TO usr_nivel1;
GRANT SELECT ON Producto.vw_Listado_Categorias           TO usr_nivel1;
GRANT SELECT ON Producto.vw_Listado_Subcategorias        TO usr_nivel1;
GRANT SELECT ON Marketing.vw_Promociones_Activas_Hoy     TO usr_nivel1;
GRANT SELECT ON Marketing.vw_Explorador_Descuentos_Full  TO usr_nivel1;
GRANT SELECT ON Marketing.vw_Validacion_Precios_Oferta   TO usr_nivel1;
GRANT SELECT ON Inventario.vw_Disponibilidad_Stock       TO usr_nivel1;

-- Registro, login y recuperación
GRANT EXECUTE ON Seguridad.sp_Registro_Maestro_Cliente          TO usr_nivel1;
GRANT EXECUTE ON Seguridad.sp_Vincular_Cuenta_Cliente_Existente TO usr_nivel1;
GRANT EXECUTE ON Seguridad.sp_Login_Usuario                     TO usr_nivel1;
GRANT EXECUTE ON Seguridad.sp_Recuperacion_Perfil_Web           TO usr_nivel1;
GRANT EXECUTE ON Seguridad.sp_Obtener_Cliente_Por_Usuario       TO usr_nivel1;

-- Sus propios datos
GRANT EXECUTE ON Persona.sp_Modificar_Cliente         TO usr_nivel1;
GRANT SELECT  ON Persona.vw_Clientes_Autocompletado   TO usr_nivel1;

-- Compra online: crear borrador, agregar, cobrar
GRANT EXECUTE ON Ventas.sp_Crear_Venta_Borrador        TO usr_nivel1;
GRANT EXECUTE ON Ventas.sp_Agregar_Producto_Venta      TO usr_nivel1;
GRANT EXECUTE ON Ventas.sp_Procesar_Cobro_Venta        TO usr_nivel1;
GRANT EXECUTE ON Ventas.sp_Eliminar_Producto_Venta     TO usr_nivel1;
GRANT EXECUTE ON Ventas.sp_Anular_Venta_Borrador       TO usr_nivel1;

-- Ver sus facturas
GRANT SELECT ON Ventas.vw_Monitor_Ventas_Cabecera  TO usr_nivel1;
GRANT SELECT ON Ventas.vw_Factura_Detallada         TO usr_nivel1;

-- DENEGACIONES EXPLÍCITAS nivel 1
DENY SELECT  ON Producto.Producto                           TO usr_nivel1; -- nunca precio costo
DENY SELECT  ON Seguridad.vw_Usuarios_Sistema               TO usr_nivel1;
DENY SELECT  ON Seguridad.vw_Trazabilidad_Bitacora          TO usr_nivel1;
DENY SELECT  ON Persona.vw_Directorio_RRHH                  TO usr_nivel1;
DENY EXECUTE ON Inventario.sp_Ejecutar_Ajuste_Inventario    TO usr_nivel1;
DENY EXECUTE ON Seguridad.sp_Actualizar_Seguridad_Usuario   TO usr_nivel1;
DENY EXECUTE ON Seguridad.sp_Inactivar_Usuario              TO usr_nivel1;
DENY EXECUTE ON Seguridad.sp_Crear_Usuario_Empleado         TO usr_nivel1;
GO


-- ================================================================
-- PASO 5: PERMISOS NIVEL 2 — Vendedor
-- AMBOS servidores
-- ================================================================

-- Todo lo del nivel 1 más lo siguiente:
-- Catálogo y precios con descuento (sin precio de costo nunca)
GRANT SELECT ON Producto.vw_Catalogo_Maestro            TO usr_nivel2;
GRANT SELECT ON Producto.vw_Listado_Categorias           TO usr_nivel2;
GRANT SELECT ON Producto.vw_Listado_Subcategorias        TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Promociones_Activas_Hoy     TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Explorador_Descuentos_Full  TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Validacion_Precios_Oferta   TO usr_nivel2;
GRANT SELECT ON Inventario.vw_Disponibilidad_Stock       TO usr_nivel2;

-- Registro, login y recuperación
GRANT EXECUTE ON Seguridad.sp_Registro_Maestro_Cliente          TO usr_nivel2;
GRANT EXECUTE ON Seguridad.sp_Vincular_Cuenta_Cliente_Existente TO usr_nivel2;
GRANT EXECUTE ON Seguridad.sp_Login_Usuario                     TO usr_nivel2;
GRANT EXECUTE ON Seguridad.sp_Recuperacion_Perfil_Web           TO usr_nivel2;
GRANT EXECUTE ON Seguridad.sp_Obtener_Cliente_Por_Usuario       TO usr_nivel2;
-- Sus propios datos
GRANT EXECUTE ON Persona.sp_Modificar_Cliente         TO usr_nivel2;
GRANT SELECT  ON Persona.vw_Clientes_Autocompletado   TO usr_nivel2;

-- Compra online: crear borrador, agregar, cobrar
GRANT EXECUTE ON Ventas.sp_Crear_Venta_Borrador        TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Agregar_Producto_Venta      TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Procesar_Cobro_Venta        TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Eliminar_Producto_Venta     TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Anular_Venta_Borrador       TO usr_nivel2;

-- Ver sus facturas
GRANT SELECT ON Ventas.vw_Monitor_Ventas_Cabecera  TO usr_nivel2;
GRANT SELECT ON Ventas.vw_Factura_Detallada         TO usr_nivel2;

-- Clientes en tienda física
GRANT EXECUTE ON Persona.sp_Registrar_Cliente_Completo   TO usr_nivel2;
GRANT EXECUTE ON Persona.sp_Modificar_Cliente            TO usr_nivel2;
GRANT SELECT  ON Persona.vw_Directorio_Clientes          TO usr_nivel2;
GRANT SELECT  ON Persona.vw_Clientes_Autocompletado      TO usr_nivel2;
GRANT SELECT  ON Persona.fn_Buscar_Cliente               TO usr_nivel2;

-- Ventas presenciales completas
GRANT EXECUTE ON Ventas.sp_Crear_Venta_Borrador        TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Agregar_Producto_Venta      TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Procesar_Cobro_Venta        TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Marcar_Venta_Entregada      TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Eliminar_Producto_Venta     TO usr_nivel2;
GRANT EXECUTE ON Ventas.sp_Anular_Venta_Borrador       TO usr_nivel2;
GRANT SELECT  ON Ventas.vw_Monitor_Ventas_Cabecera     TO usr_nivel2;
GRANT SELECT  ON Ventas.vw_Factura_Detallada            TO usr_nivel2;

-- Stock e inventario de su sede
GRANT SELECT ON Inventario.vw_Disponibilidad_Stock  TO usr_nivel2;

-- Catálogo y marketing (lectura)
GRANT SELECT ON Producto.vw_Catalogo_Maestro            TO usr_nivel2;
GRANT SELECT ON Producto.vw_Listado_Categorias           TO usr_nivel2;
GRANT SELECT ON Producto.vw_Listado_Subcategorias        TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Promociones_Activas_Hoy     TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Explorador_Descuentos_Full  TO usr_nivel2;
GRANT SELECT ON Marketing.vw_Validacion_Precios_Oferta   TO usr_nivel2;

-- Login propio
GRANT EXECUTE ON Seguridad.sp_Login_Usuario           TO usr_nivel2;
GRANT EXECUTE ON Seguridad.sp_Recuperacion_Perfil_Web TO usr_nivel2;

-- DENEGACIONES EXPLÍCITAS nivel 2
DENY SELECT  ON Producto.Producto                           TO usr_nivel2; -- sin precio costo
DENY SELECT  ON Persona.vw_Directorio_RRHH                  TO usr_nivel2;
DENY EXECUTE ON Producto.sp_Actualizar_Precios_Producto     TO usr_nivel2;
DENY EXECUTE ON Producto.sp_Registrar_Producto              TO usr_nivel2;
DENY EXECUTE ON Producto.sp_Modificar_Ficha_Producto        TO usr_nivel2;
DENY EXECUTE ON Inventario.sp_Ejecutar_Ajuste_Inventario    TO usr_nivel2;
DENY EXECUTE ON Seguridad.sp_Actualizar_Seguridad_Usuario   TO usr_nivel2;
DENY EXECUTE ON Seguridad.sp_Inactivar_Usuario              TO usr_nivel2;
DENY EXECUTE ON Seguridad.sp_Crear_Usuario_Empleado         TO usr_nivel2;
GO


-- ================================================================
-- PASO 6: PERMISOS NIVEL 3 — Administrador de Sede
-- AMBOS servidores
-- ================================================================

-- Clientes y personas
GRANT EXECUTE ON Persona.sp_Registrar_Cliente_Completo   TO usr_nivel3;
GRANT EXECUTE ON Persona.sp_Modificar_Cliente            TO usr_nivel3;
GRANT SELECT  ON Persona.vw_Directorio_Clientes          TO usr_nivel3;
GRANT SELECT  ON Persona.vw_Clientes_Autocompletado      TO usr_nivel3;
GRANT SELECT  ON Persona.fn_Buscar_Cliente               TO usr_nivel3;

-- Empleados de su sede
GRANT EXECUTE ON Persona.sp_Contratar_Personal_Completo  TO usr_nivel3;
GRANT EXECUTE ON Persona.sp_Actualizar_Perfil_Laboral    TO usr_nivel3;
GRANT SELECT  ON Persona.vw_Directorio_RRHH              TO usr_nivel3;
GRANT SELECT  ON Seguridad.fn_Buscar_Personal_Seguridad  TO usr_nivel3;

-- Gestión de usuarios de su sede (niveles 1 y 2 solamente)
GRANT EXECUTE ON Seguridad.sp_Auto_Registro_Web           TO usr_nivel3;
GRANT EXECUTE ON Seguridad.sp_Actualizar_Seguridad_Usuario TO usr_nivel3;
GRANT EXECUTE ON Seguridad.sp_Inactivar_Usuario           TO usr_nivel3;
GRANT EXECUTE ON Seguridad.sp_Crear_Usuario_Empleado      TO usr_nivel3;
GRANT SELECT  ON Seguridad.vw_Usuarios_Sistema            TO usr_nivel3;
GRANT SELECT  ON Seguridad.vw_Trazabilidad_Bitacora       TO usr_nivel3;

-- Login propio
GRANT EXECUTE ON Seguridad.sp_Login_Usuario           TO usr_nivel3;
GRANT EXECUTE ON Seguridad.sp_Recuperacion_Perfil_Web TO usr_nivel3;

-- Ventas completas
GRANT EXECUTE ON Ventas.sp_Crear_Venta_Borrador        TO usr_nivel3;
GRANT EXECUTE ON Ventas.sp_Agregar_Producto_Venta      TO usr_nivel3;
GRANT EXECUTE ON Ventas.sp_Procesar_Cobro_Venta        TO usr_nivel3;
GRANT EXECUTE ON Ventas.sp_Marcar_Venta_Entregada      TO usr_nivel3;
GRANT EXECUTE ON Ventas.sp_Eliminar_Producto_Venta     TO usr_nivel3;
GRANT EXECUTE ON Ventas.sp_Anular_Venta_Borrador       TO usr_nivel3;
GRANT SELECT  ON Ventas.vw_Monitor_Ventas_Cabecera     TO usr_nivel3;
GRANT SELECT  ON Ventas.vw_Factura_Detallada            TO usr_nivel3;

-- Inventario de su sede
GRANT EXECUTE ON Inventario.sp_Ejecutar_Ajuste_Inventario TO usr_nivel3;
GRANT SELECT  ON Inventario.vw_Disponibilidad_Stock        TO usr_nivel3;
GRANT SELECT  ON Inventario.vw_Reporte_Ajustes             TO usr_nivel3;

-- Catálogo: puede registrar y modificar ficha, NO precios de costo
GRANT EXECUTE ON Producto.sp_Registrar_Producto        TO usr_nivel3;
GRANT EXECUTE ON Producto.sp_Modificar_Ficha_Producto  TO usr_nivel3;
GRANT EXECUTE ON Producto.sp_Agregar_Categoria         TO usr_nivel3;
GRANT EXECUTE ON Producto.sp_Agregar_Subcategoria      TO usr_nivel3;
GRANT SELECT  ON Producto.vw_Catalogo_Maestro           TO usr_nivel3;
GRANT SELECT  ON Producto.vw_Listado_Categorias         TO usr_nivel3;
GRANT SELECT  ON Producto.vw_Listado_Subcategorias      TO usr_nivel3;

-- Marketing: solo lectura
GRANT SELECT ON Marketing.vw_Promociones_Activas_Hoy     TO usr_nivel3;
GRANT SELECT ON Marketing.vw_Explorador_Descuentos_Full  TO usr_nivel3;
GRANT SELECT ON Marketing.vw_Validacion_Precios_Oferta   TO usr_nivel3;

-- DENEGACIONES EXPLÍCITAS nivel 3
DENY SELECT  ON Producto.Producto                       TO usr_nivel3; -- sin precio costo
DENY EXECUTE ON Producto.sp_Actualizar_Precios_Producto TO usr_nivel3;
DENY EXECUTE ON Marketing.sp_Registrar_Campana          TO usr_nivel3;
DENY EXECUTE ON Marketing.sp_Asignar_Alcance_Promocion  TO usr_nivel3;
DENY EXECUTE ON Marketing.sp_Finalizar_Promocion        TO usr_nivel3;
GO


-- ================================================================
-- SOLO CENTRAL — permisos adicionales de nivel 3
-- que en Sede no existen porque las tablas no están
-- ================================================================

-- Kardex maestro (solo Central tiene la vista con Compras)
GRANT SELECT ON Inventario.vw_Auditoria_Kardex_Maestro TO usr_nivel3;
GRANT SELECT ON Inventario.vw_Stock_Consolidado        TO usr_nivel3;
GO


-- ================================================================
-- SOLO CENTRAL — permisos adicionales de nivel 4
-- sobre objetos que solo existen en Central
-- (db_owner ya cubre todo, esto es documentación explícita)
-- ================================================================

GRANT SELECT  ON Compras.vw_Directorio_Proveedores          TO usr_nivel4;
GRANT SELECT  ON Compras.vw_Selector_Proveedores_Activos    TO usr_nivel4;
GRANT SELECT  ON Compras.vw_Compras_Totales                 TO usr_nivel4;
GRANT SELECT  ON Compras.vw_Detalle_Mercaderia              TO usr_nivel4;
GRANT SELECT  ON Compras.fn_Buscar_Proveedor                TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Registrar_Proveedor             TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Modificar_Datos_Proveedor       TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Inactivar_Proveedor             TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Emitir_Orden_Compra             TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Consolidar_Recepcion_Mercaderia TO usr_nivel4;
GRANT EXECUTE ON Compras.sp_Anular_Orden_Compra             TO usr_nivel4;
GRANT EXECUTE ON Inventario.sp_Transferir_Stock             TO usr_nivel4;
GRANT SELECT  ON Inventario.vw_Stock_Consolidado            TO usr_nivel4;
GRANT SELECT  ON Inventario.vw_Auditoria_Kardex_Maestro     TO usr_nivel4;
GRANT SELECT  ON Inventario.vw_Alertas_Stock_Bajo           TO usr_nivel4;
GRANT SELECT  ON Ventas.vw_Ventas_Hoy_Global                TO usr_nivel4; --luego
GRANT SELECT  ON Persona.vw_Directorio_RRHH_Global          TO usr_nivel4; --luego
GRANT SELECT  ON Persona.vw_Empleados_Global_TiempoReal     TO usr_nivel4; --luego
GRANT SELECT  ON Persona.vw_Clientes_Global_TiempoReal      TO usr_nivel4; --luego
GRANT SELECT  ON Configuracion.vw_Estado_Red                TO usr_nivel4;
GRANT EXECUTE ON Configuracion.sp_Registrar_Sincronizacion  TO usr_nivel4;
GRANT EXECUTE ON Marketing.sp_Registrar_Campana             TO usr_nivel4;
GRANT EXECUTE ON Marketing.sp_Asignar_Alcance_Promocion     TO usr_nivel4;
GRANT EXECUTE ON Marketing.sp_Finalizar_Promocion           TO usr_nivel4;
GRANT SELECT  ON Producto.Producto                          TO usr_nivel4; -- ve precio costo
GRANT SELECT  ON [Inventario].[vw_Stock_Sede_TiempoReal]           TO usr_nivel4;
GO


-- ================================================================
-- REVOKE — situaciones específicas de negocio
-- ================================================================

-- Si un vendedor es degradado a cliente
-- (ejemplo de uso, no se ejecuta automáticamente)
-- REVOKE EXECUTE ON Ventas.sp_Procesar_Cobro_Venta FROM usr_nivel2;

-- Si se quiere quitar acceso al catálogo a nivel 1
-- temporalmente por mantenimiento:
-- REVOKE SELECT ON Producto.vw_Catalogo_Maestro FROM usr_nivel1;

-- Restaurar con GRANT de nuevo:
-- GRANT SELECT ON Producto.vw_Catalogo_Maestro TO usr_nivel1;
--GO


-- ================================================================
-- NOTA IMPORTANTE PARA SEDE
-- ================================================================
-- En Sede NO ejecutar:
--   - El ALTER ROLE db_owner para usr_nivel4
--   - Los GRANT de schemas de Control de SCHEMA
--   - El bloque "SOLO CENTRAL permisos adicionales nivel 3"
--   - El bloque "SOLO CENTRAL permisos adicionales nivel 4"
--   - El CREATE LOGIN login_nivel4 es opcional en Sede:
--     solo créalo si lo necesitas para el Linked Server
--     con permisos mínimos (solo SELECT en tablas que Central consulta)
--
-- En Sede el nivel 4 no opera, así que:
--   - No crear usr_nivel4 en Sede
--   - El login_nivel4 en Sede solo existe para
--     que el Linked Server de Central pueda conectarse
-- ================================================================

-- ================================================================
-- VERIFICACIÓN FINAL
-- Ejecutar en ambos servidores para confirmar que todo quedó bien
-- ================================================================

-- Ver permisos de un usuario específico
SELECT
    dp.name                AS Usuario,
    o.name                 AS Objeto,
    p.permission_name      AS Permiso,
    p.state_desc           AS Estado
FROM sys.database_permissions p
INNER JOIN sys.database_principals dp
    ON p.grantee_principal_id = dp.principal_id
INNER JOIN sys.objects o
    ON p.major_id = o.object_id
WHERE dp.name IN ('usr_nivel1','usr_nivel2','usr_nivel3',
                  'usr_nivel4','usr_linkedserver')
ORDER BY dp.name, o.name, p.permission_name;
GO

-- Ver miembros de db_owner
SELECT
    r.name  AS Rol,
    m.name  AS Miembro
FROM sys.database_role_members rm
INNER JOIN sys.database_principals r
    ON rm.role_principal_id   = r.principal_id
INNER JOIN sys.database_principals m
    ON rm.member_principal_id = m.principal_id
WHERE r.name = 'db_owner';
GO

EXEC sp_addlinkedsrvlogin
    @rmtsrvname  = 'SEDE',
    @useself     = 'FALSE',
    @locallogin  = 'login_nivel4',    -- usuario que usa la app
    @rmtuser     = 'login_linkedserver',
    @rmtpassword = 'L1nk3d#S3rv3r2026!';

    SELECT s.name, l.local_principal_id, l.remote_name
FROM sys.linked_logins l
JOIN sys.servers s ON l.server_id = s.server_id
WHERE s.name = 'SEDE'

-- Verificar permisos sobre las vistas globales
SELECT dp.name, o.name, p.permission_name
FROM sys.database_permissions p
JOIN sys.objects o ON p.major_id = o.object_id
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
WHERE dp.name = 'usr_nivel4'
AND o.name LIKE '%Global%'

SELECT s.name, sp.name AS local_login, ll.remote_name
FROM sys.linked_logins ll
JOIN sys.servers s ON ll.server_id = s.server_id
LEFT JOIN sys.server_principals sp ON ll.local_principal_id = sp.principal_id
WHERE s.name = 'SEDE'