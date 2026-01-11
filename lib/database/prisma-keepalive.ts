import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

let started = false

/**
 * Periodically pings the database to keep pooled connections warm.
 * This helps reduce intermittent "kind: Closed" churn on some hosting/proxy setups.
 */
export function startPrismaKeepalive(intervalMs: number = 30_000) {
  if (started) return
  started = true

  const timer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (err) {
      logger.warn('Prisma keepalive failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }, intervalMs)

  // Allow process to exit
  timer.unref?.()
}
