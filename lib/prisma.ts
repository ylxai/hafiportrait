import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Cache PrismaClient globally to reduce connection churn in long-running processes.
globalForPrisma.prisma = prisma

// Keepalive ping to reduce intermittent connection closures on pooled DB/proxies.
// Only start once per process.
if (process.env.NODE_ENV === 'production' && !(globalThis as any).__prismaKeepaliveStarted) {
  ;(globalThis as any).__prismaKeepaliveStarted = true
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      // swallow; Prisma will reconnect on demand
    }
  }, 30_000).unref?.()
}

export default prisma
