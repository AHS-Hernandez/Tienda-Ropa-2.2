-- =============================================================================
-- Guía: Triggers de replicación (Triggers Replication.sql)
-- Ejecutar en CENTRAL — TiendaRopa — como sysadmin
-- =============================================================================
--
-- QUÉ HACEN
-- ---------
-- Después de cada INSERT/UPDATE/DELETE en Central, copian el mismo registro
-- al servidor SEDE vía linked server "SEDE" (10.224.111.77):
--
--   Producto.trg_Replicar_Categoria
--   Producto.trg_Replicar_Subcategoria
--   Producto.trg_Replicar_Producto      ← suele tardar ~20 s si el link falla
--   Marketing.trg_Replicar_Promocion
--
-- La app (owner) escribe solo en Central; el trigger empuja a Sede en la
-- MISMA transacción. Si SEDE no responde → timeout → error 400 en la app.
--
-- SI LOS DESACTIVAS (DISABLE)
-- -------------------------
-- ✓ Central: catálogo, compras, marketing funcionan al instante.
-- ✗ Sede: NO recibe productos/categorías/promos nuevos automáticamente.
--   - POS / catálogo en la BD de Sede queda desactualizado.
--   - Stock en Sede sigue siendo independiente (transferencias, recepciones).
--   - Vistas "Red en vivo" desde Central LEEN Sede; no dependen de estos triggers.
--
-- RECOMENDACIÓN
-- -------------
-- Desarrollo / linked inestable: Opción A (DISABLE) o Opción B (TRY/CATCH).
-- Producción con red OK: arreglar linked server + Opción B por seguridad.
--
-- =============================================================================

USE TiendaRopa;
GO

-- ── Opción A: solo desarrollo — desactivar replicación síncrona ─────────────
/*
DISABLE TRIGGER Producto.trg_Replicar_Categoria    ON Producto.Categoria;
DISABLE TRIGGER Producto.trg_Replicar_Subcategoria ON Producto.Subcategoria;
DISABLE TRIGGER Producto.trg_Replicar_Producto     ON Producto.Producto;
DISABLE TRIGGER Marketing.trg_Replicar_Promocion   ON Marketing.Promocion;
PRINT 'Triggers de replicación DESHABILITADOS (solo Central).';
*/

-- Para volver a activarlos:
/*
ENABLE TRIGGER Producto.trg_Replicar_Categoria    ON Producto.Categoria;
ENABLE TRIGGER Producto.trg_Replicar_Subcategoria ON Producto.Subcategoria;
ENABLE TRIGGER Producto.trg_Replicar_Producto     ON Producto.Producto;
ENABLE TRIGGER Marketing.trg_Replicar_Promocion   ON Marketing.Promocion;
PRINT 'Triggers de replicación HABILITADOS.';
*/

-- ── Opción B: replicar sin tumbar Central (recomendado) ─────────────────────
-- Si SEDE falla, el alta en Central IGUAL se guarda; queda log en tabla.

IF OBJECT_ID(N'dbo.Replicacion_Sede_Log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Replicacion_Sede_Log (
        id_log        INT IDENTITY(1,1) PRIMARY KEY,
        Fecha_hora    DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        Tabla_origen  NVARCHAR(128) NOT NULL,
        Operacion     NVARCHAR(10) NOT NULL,
        Detalle       NVARCHAR(MAX) NULL,
        Error_mensaje NVARCHAR(4000) NULL
    );
    PRINT 'Tabla dbo.Replicacion_Sede_Log creada.';
END
GO

CREATE OR ALTER TRIGGER Producto.trg_Replicar_Categoria
ON Producto.Categoria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
            DELETE FROM SEDE.TiendaRopa.Producto.Categoria
            WHERE id_categoria IN (SELECT id_categoria FROM deleted);

        IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
            INSERT INTO SEDE.TiendaRopa.Producto.Categoria (id_categoria, Nombre)
            SELECT id_categoria, Nombre FROM inserted;

        IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
            UPDATE s SET s.Nombre = i.Nombre
            FROM SEDE.TiendaRopa.Producto.Categoria s
            INNER JOIN inserted i ON s.id_categoria = i.id_categoria;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.Replicacion_Sede_Log (Tabla_origen, Operacion, Error_mensaje)
        VALUES (N'Producto.Categoria', N'TRIGGER', ERROR_MESSAGE());
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER Producto.trg_Replicar_Subcategoria
ON Producto.Subcategoria
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
            DELETE FROM SEDE.TiendaRopa.Producto.Subcategoria
            WHERE id_subcategoria IN (SELECT id_subcategoria FROM deleted);

        IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
            INSERT INTO SEDE.TiendaRopa.Producto.Subcategoria (id_subcategoria, id_categoria, Nombre)
            SELECT id_subcategoria, id_categoria, Nombre FROM inserted;

        IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
            UPDATE s SET s.Nombre = i.Nombre, s.id_categoria = i.id_categoria
            FROM SEDE.TiendaRopa.Producto.Subcategoria s
            INNER JOIN inserted i ON s.id_subcategoria = i.id_subcategoria;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.Replicacion_Sede_Log (Tabla_origen, Operacion, Error_mensaje)
        VALUES (N'Producto.Subcategoria', N'TRIGGER', ERROR_MESSAGE());
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER Producto.trg_Replicar_Producto
ON Producto.Producto
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
            DELETE FROM SEDE.TiendaRopa.Producto.Producto
            WHERE id_producto IN (SELECT id_producto FROM deleted);

        IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
            INSERT INTO SEDE.TiendaRopa.Producto.Producto
                (id_producto, id_subcategoria, Nombre, Descripcion, Marca, Color, Talla, Precio_venta)
            SELECT id_producto, id_subcategoria, Nombre, Descripcion, Marca, Color, Talla, Precio_venta
            FROM inserted;

        IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
            UPDATE s SET
                s.id_subcategoria = i.id_subcategoria,
                s.Nombre = i.Nombre,
                s.Descripcion = i.Descripcion,
                s.Marca = i.Marca,
                s.Color = i.Color,
                s.Talla = i.Talla,
                s.Precio_venta = i.Precio_venta
            FROM SEDE.TiendaRopa.Producto.Producto s
            INNER JOIN inserted i ON s.id_producto = i.id_producto;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.Replicacion_Sede_Log (Tabla_origen, Operacion, Error_mensaje)
        VALUES (N'Producto.Producto', N'TRIGGER', ERROR_MESSAGE());
    END CATCH
END;
GO

CREATE OR ALTER TRIGGER Marketing.trg_Replicar_Promocion
ON Marketing.Promocion
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
            DELETE FROM SEDE.TiendaRopa.Marketing.Promocion
            WHERE id_promocion IN (SELECT id_promocion FROM deleted);

        IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
            INSERT INTO SEDE.TiendaRopa.Marketing.Promocion
                (id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin)
            SELECT id_promocion, Nombre, Porcentaje, Monto, Fecha_inicio, Fecha_fin FROM inserted;

        IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
            UPDATE s SET
                s.Nombre = i.Nombre,
                s.Porcentaje = i.Porcentaje,
                s.Monto = i.Monto,
                s.Fecha_inicio = i.Fecha_inicio,
                s.Fecha_fin = i.Fecha_fin
            FROM SEDE.TiendaRopa.Marketing.Promocion s
            INNER JOIN inserted i ON s.id_promocion = i.id_promocion;
    END TRY
    BEGIN CATCH
        INSERT INTO dbo.Replicacion_Sede_Log (Tabla_origen, Operacion, Error_mensaje)
        VALUES (N'Marketing.Promocion', N'TRIGGER', ERROR_MESSAGE());
    END CATCH
END;
GO

-- ── Opción C: timeout del linked server (puede NO existir en tu edición) ───
-- Si obtiene Msg 15600 "invalid parameter or option", IGNORE esta sección.
-- En muchos entornos solo funcionan: rpc, rpc out, data access, connect timeout.
--
-- Diagnóstico:
--   SELECT name, is_linked FROM sys.servers WHERE name = N'SEDE';
--   EXEC sp_helpserver @server = N'SEDE';
--
-- Probar connect timeout (suele estar soportado):
/*
USE master;
GO
EXEC sp_serveroption @server = N'SEDE', @optname = N'connect timeout', @optvalue = N'60';
GO
*/
--
-- query timeout (si su versión lo acepta; si falla con 15600, no usar):
/*
EXEC sp_serveroption @server = N'SEDE', @optname = N'query timeout', @optvalue = N'false';
*/
--
-- Solución que SÍ funciona siempre: Opción B (TRY/CATCH arriba) o DISABLE en dev.

-- ── Ver errores de replicación pendientes ───────────────────────────────────
-- SELECT TOP 50 * FROM dbo.Replicacion_Sede_Log ORDER BY Fecha_hora DESC;

PRINT 'OK: triggers con TRY/CATCH — Central no falla si SEDE no responde.';
PRINT 'Revise dbo.Replicacion_Sede_Log si hay filas nuevas.';
