export function getSqlErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const mssql = error as Error & { originalError?: { message?: string } }
    const msg = mssql.originalError?.message ?? mssql.message
    const match = msg.match(/(?:RAISERROR|Error):\s*(.+?)(?:\r\n|$)/i)
    return match?.[1]?.trim() ?? msg
  }
  return "Error desconocido en base de datos."
}
