/**
 * Cleanup Script untuk Expired Tokens & Sessions
 * Run this script periodically (e.g., via cron job)
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupExpiredTokens() {
  console.log('🧹 Starting cleanup of expired tokens and sessions...')
  
  try {
    // 1. Cleanup expired refresh tokens
    const refreshTokensDeleted = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    console.log(`✓ Deleted ${refreshTokensDeleted.count} expired refresh tokens`)

    // 2. Cleanup expired guest sessions
    const guestSessionsDeleted = await prisma.guestSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    console.log(`✓ Deleted ${guestSessionsDeleted.count} expired guest sessions`)

    // 3. Cleanup old photo downloads (older than 90 days)
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 90)
    
    const downloadsDeleted = await prisma.photoDownload.deleteMany({
      where: {
        downloadedAt: {
          lt: oldDate
        }
      }
    })
    console.log(`✓ Deleted ${downloadsDeleted.count} old photo download records`)

    // 4. Cleanup old photo views (older than 90 days)
    const viewsDeleted = await prisma.photoView.deleteMany({
      where: {
        viewedAt: {
          lt: oldDate
        }
      }
    })
    console.log(`✓ Deleted ${viewsDeleted.count} old photo view records`)

    console.log('✅ Cleanup completed successfully')
    
    return {
      refreshTokens: refreshTokensDeleted.count,
      guestSessions: guestSessionsDeleted.count,
      photoDownloads: downloadsDeleted.count,
      photoViews: viewsDeleted.count
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup
if (require.main === module) {
  cleanupExpiredTokens()
    .then((stats) => {
      console.log('\n📊 Cleanup Statistics:', stats)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { cleanupExpiredTokens }
