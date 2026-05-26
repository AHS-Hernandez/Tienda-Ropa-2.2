import { getDbPool, sql } from "@/lib/db"

/** Establece SESSION_CONTEXT para SPs que validan id_usuario del actor. */
export async function setDbSessionContext(idUsuario: number): Promise<void> {
  const pool = await getDbPool()
  await pool
    .request()
    .input("id", sql.Int, idUsuario)
    .query(
      `EXEC sys.sp_set_session_context @key = N'id_usuario', @value = @id`
    )
}
