SELECT
    s.name + '.' + t.name          AS tabla,
    i.name                          AS indice,
    u.user_seeks                    AS seeks,
    u.user_scans                    AS scans,
    u.user_lookups                  AS lookups,
    u.user_updates                  AS actualizaciones,
    u.last_user_seek                AS ultimo_seek,
    u.last_user_scan                AS ultimo_scan
FROM sys.indexes i
INNER JOIN sys.tables       t  ON i.object_id  = t.object_id
INNER JOIN sys.schemas      s  ON t.schema_id  = s.schema_id
LEFT  JOIN sys.dm_db_index_usage_stats u
                               ON i.object_id  = u.object_id
                              AND i.index_id   = u.index_id
                              AND u.database_id = DB_ID()
WHERE i.type_desc    = 'NONCLUSTERED'
  AND i.is_primary_key = 0
  AND i.name LIKE 'IX[_]%'
ORDER BY ISNULL(u.user_seeks,0) + ISNULL(u.user_scans,0) DESC;