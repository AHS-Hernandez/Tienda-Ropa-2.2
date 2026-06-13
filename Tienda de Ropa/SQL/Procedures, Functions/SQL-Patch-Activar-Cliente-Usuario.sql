USE TiendaRopa;
GO

-- Ejecutar también: Procedures, Functions\sp_Activar_Usuario_Cliente_Existente.sql

IF OBJECT_ID(N'Seguridad.sp_Activar_Usuario_Cliente_Existente', N'P') IS NOT NULL
BEGIN
    GRANT EXECUTE ON Seguridad.sp_Activar_Usuario_Cliente_Existente TO usr_nivel1;
    GRANT EXECUTE ON Seguridad.sp_Activar_Usuario_Cliente_Existente TO usr_nivel2;
    GRANT EXECUTE ON Seguridad.sp_Activar_Usuario_Cliente_Existente TO usr_nivel3;
    GRANT EXECUTE ON Seguridad.sp_Activar_Usuario_Cliente_Existente TO usr_nivel4;

    IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'login_nivel4')
        GRANT EXECUTE ON Seguridad.sp_Activar_Usuario_Cliente_Existente TO login_nivel4;

    PRINT 'OK: GRANT sp_Activar_Usuario_Cliente_Existente';
END
ELSE
    PRINT 'FALTA: ejecutar sp_Activar_Usuario_Cliente_Existente.sql primero';
GO
