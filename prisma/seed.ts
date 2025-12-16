import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create admin user - Nandika
  const adminPassword = await hashPassword('Hantu@112233')
  const admin = await prisma.user.upsert({
    where: { email: 'nandika@hafiportrait.com' },
    update: {
      passwordHash: adminPassword,
      name: 'Nandika',
    },
    create: {
      email: 'nandika@hafiportrait.com',
      passwordHash: adminPassword,
      name: 'Nandika',
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create sample client user
  const clientPassword = await hashPassword('client123')
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: clientPassword,
      name: 'John & Jane Doe',
      role: 'CLIENT',
    },
  })

  console.log('✅ Created client user:', client.email)

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
