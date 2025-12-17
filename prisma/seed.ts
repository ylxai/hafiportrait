import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Starting seed...')

  // Create admin user - Nandika
  const adminPassword = await hashPassword('Hantu@112233')
  const admin = await prisma.users.upsert({
    where: { email: 'nandika@hafiportrait.com' },
    update: {
      password_hash: adminPassword,
      name: 'Nandika',
    },
    create: {
      email: 'nandika@hafiportrait.com',
      password_hash: adminPassword,
      name: 'Nandika',
      role: 'ADMIN',
      updated_at: new Date(),
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create sample client user
  const clientPassword = await hashPassword('client123')
  const client = await prisma.users.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password_hash: clientPassword,
      name: 'John & Jane Doe',
      role: 'CLIENT',
      updated_at: new Date(),
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
