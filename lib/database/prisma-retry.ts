export interface PrismaRetryOptions {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function isConnectionClosedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = (err as any).message ? String((err as any).message) : ''
  const name = (err as any).name ? String((err as any).name) : ''

  // Observed in logs: "Error in PostgreSQL connection: Error { kind: Closed, cause: None }"
  return (
    msg.includes('kind: Closed') ||
    msg.includes('PostgreSQL connection') ||
    (msg.includes('Connection') && msg.includes('closed')) ||
    (name.toLowerCase().includes('prisma') &&
      msg.toLowerCase().includes('closed'))
  )
}

/**
 * Retry helper for Prisma operations that may fail due to transient DB connection closures.
 * Returns the operation result or throws the last error.
 */
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  opts: PrismaRetryOptions = {}
): Promise<T> {
  const retries = opts.retries ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 250
  const maxDelayMs = opts.maxDelayMs ?? 2000

  let attempt = 0
  while (true) {
    try {
      return await operation()
    } catch (err) {
      attempt++
      const canRetry = attempt <= retries && isConnectionClosedError(err)
      if (!canRetry) throw err

      // Avoid calling prisma.$disconnect() here.
      // In serverless/pooled environments, forcing disconnect can amplify connection churn.
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1))
      await sleep(delay)
    }
  }
}
