import sql from "mssql"

const globalForDb = globalThis as unknown as {
  sqlPool: sql.ConnectionPool | undefined
  sqlPoolPromise: Promise<sql.ConnectionPool> | undefined
}

function getConfig(): sql.config {
  const server = process.env.DB_SERVER
  const database = process.env.DB_DATABASE ?? "TiendaRopa"
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD

  if (!server || !user || !password) {
    throw new Error(
      "Faltan variables de entorno DB_SERVER, DB_USER y DB_PASSWORD para conectar a SQL Server."
    )
  }

  return {
    server,
    database,
    user,
    password,
    // 60s: las vistas globales via linked server pueden ser lentas.
    // El default del driver mssql es 15s, demasiado ajustado.
    requestTimeout: 60_000,
    connectionTimeout: 15_000,
    options: {
      encrypt: process.env.DB_ENCRYPT !== "false",
      trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  }
}

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (globalForDb.sqlPool?.connected) {
    return globalForDb.sqlPool
  }

  if (!globalForDb.sqlPoolPromise) {
    const pool = new sql.ConnectionPool(getConfig())
    globalForDb.sqlPoolPromise = pool.connect().then((connected) => {
      globalForDb.sqlPool = connected
      return connected
    })
  }

  return globalForDb.sqlPoolPromise
}

export { sql }
