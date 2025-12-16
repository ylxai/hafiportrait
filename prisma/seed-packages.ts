import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding package management data...')

  // 1. Create Categories
  console.log('📦 Creating categories...')
  
  const categoryAkad = await prisma.packageCategory.upsert({
    where: { slug: 'akad' },
    update: {},
    create: {
      name: 'Akad',
      slug: 'akad',
      icon: '💍',
      displayOrder: 1,
      isActive: true,
    },
  })

  const categoryResepsi = await prisma.packageCategory.upsert({
    where: { slug: 'resepsi' },
    update: {},
    create: {
      name: 'Resepsi',
      slug: 'resepsi',
      icon: '🎉',
      displayOrder: 2,
      isActive: true,
    },
  })

  const categoryAkadResepsi = await prisma.packageCategory.upsert({
    where: { slug: 'akad-resepsi' },
    update: {},
    create: {
      name: 'Akad + Resepsi',
      slug: 'akad-resepsi',
      icon: '💍🎉',
      displayOrder: 3,
      isActive: true,
    },
  })

  const categoryDigital = await prisma.packageCategory.upsert({
    where: { slug: 'digital-only' },
    update: {},
    create: {
      name: 'Digital Only',
      slug: 'digital-only',
      icon: '📸',
      displayOrder: 4,
      isActive: true,
    },
  })

  console.log('✅ Categories created')

  // 2. Create Packages - AKAD
  console.log('📸 Creating Akad packages...')
  
  await prisma.package.upsert({
    where: { id: 'sacred-vow' },
    update: {},
    create: {
      id: 'sacred-vow',
      name: 'Sacred Vow',
      description: 'Pilihan tepat untuk akad sederhana & intimate.',
      price: 1300000,
      categoryId: categoryAkad.id,
      isBestSeller: false,
      isActive: true,
      displayOrder: 1,
      features: [
        '1 Photographer',
        '1 hari kerja',
        '40 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
      ],
    },
  })

  await prisma.package.upsert({
    where: { id: 'pure-promise' },
    update: {},
    create: {
      id: 'pure-promise',
      name: 'Pure Promise',
      description: 'Paket favorit untuk akad yang lebih lengkap & berkesan.',
      price: 2000000,
      categoryId: categoryAkad.id,
      isBestSeller: true,
      isActive: true,
      displayOrder: 2,
      features: [
        '1 Photographer & 1 Assistant Photographer',
        '1 hari kerja',
        '80 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 cetak besar 14R + frame',
      ],
    },
  })

  // 3. Create Packages - RESEPSI
  console.log('🎉 Creating Resepsi packages...')
  
  await prisma.package.upsert({
    where: { id: 'our-story' },
    update: {},
    create: {
      id: 'our-story',
      name: 'Our Story',
      description: 'Cocok untuk resepsi sederhana dengan dokumentasi inti.',
      price: 1800000,
      categoryId: categoryResepsi.id,
      isBestSeller: false,
      isActive: true,
      displayOrder: 1,
      features: [
        '1 Photographer & 1 Assistant Photographer',
        '1 hari kerja',
        '40 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 cetak besar 14R + frame',
      ],
    },
  })

  await prisma.package.upsert({
    where: { id: 'euphoria' },
    update: {},
    create: {
      id: 'euphoria',
      name: 'Euphoria',
      description: 'Paket paling seimbang untuk resepsi yang ramai & penuh momen.',
      price: 2300000,
      categoryId: categoryResepsi.id,
      isBestSeller: true,
      isActive: true,
      displayOrder: 2,
      features: [
        '1 Photographer & 1 Assistant Photographer',
        '1 hari kerja',
        '80 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 cetak besar 14R + frame',
      ],
    },
  })

  // 4. Create Packages - AKAD + RESEPSI
  console.log('💍🎉 Creating Akad + Resepsi packages...')
  
  await prisma.package.upsert({
    where: { id: 'the-vow' },
    update: {},
    create: {
      id: 'the-vow',
      name: 'The Vow',
      description: 'Praktis untuk dua hari acara dengan dokumentasi menyeluruh.',
      price: 3000000,
      categoryId: categoryAkadResepsi.id,
      isBestSeller: false,
      isActive: true,
      displayOrder: 1,
      features: [
        '1 Photographer & 1 Assistant Photographer',
        '2 hari kerja',
        '80 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 cetak besar 14R + frame',
      ],
    },
  })

  await prisma.package.upsert({
    where: { id: 'after-the-vow' },
    update: {},
    create: {
      id: 'after-the-vow',
      name: 'After the Vow',
      description: 'Pilihan ideal untuk pasangan yang ingin dokumentasi lebih eksklusif.',
      price: 4000000,
      categoryId: categoryAkadResepsi.id,
      isBestSeller: true,
      isActive: true,
      displayOrder: 2,
      features: [
        '1 Photographer & 1 Assistant Photographer',
        '2 hari kerja',
        '80 cetak foto 5R (pilihan)',
        'Album magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 Photo Box',
        'Cetak besar 14R Jumbo + frame',
      ],
    },
  })

  await prisma.package.upsert({
    where: { id: 'after-the-vow-signature' },
    update: {},
    create: {
      id: 'after-the-vow-signature',
      name: 'After the Vow — Signature',
      description: 'Paket premium dengan tim dan hasil cetak terbaik.',
      price: 6000000,
      categoryId: categoryAkadResepsi.id,
      isBestSeller: false,
      isActive: true,
      displayOrder: 3,
      features: [
        '2 Photographer & 1 Assistant Photographer',
        '2 hari kerja',
        '120 cetak foto 5R (pilihan)',
        'Album hard cover magnetik (tempel)',
        'File foto tanpa batas',
        'Softcopy di flashdisk',
        '1 cetak besar 16R Jumbo + frame',
      ],
    },
  })

  // 5. Create Packages - DIGITAL ONLY
  console.log('📸 Creating Digital Only packages...')
  
  await prisma.package.upsert({
    where: { id: 'quiet-vows' },
    update: {},
    create: {
      id: 'quiet-vows',
      name: 'Quiet Vows',
      description: 'Pilihan hemat untuk akad atau sesi singkat.',
      price: 1500000,
      categoryId: categoryDigital.id,
      isBestSeller: false,
      isActive: true,
      displayOrder: 1,
      features: [
        '1 Photographer',
        '6 jam kerja',
        'Unlimited shoot',
        '80 edited photos',
        'Tanpa cetak & album',
        'File Google Drive + Flashdisk',
      ],
    },
  })

  await prisma.package.upsert({
    where: { id: 'timeless-frame' },
    update: {},
    create: {
      id: 'timeless-frame',
      name: 'Timeless Frame',
      description: 'Paket digital favorit dengan durasi lebih panjang.',
      price: 2400000,
      categoryId: categoryDigital.id,
      isBestSeller: true,
      isActive: true,
      displayOrder: 2,
      features: [
        '1 Photographer',
        'Sameday (Akad & Resepsi)',
        '8 Jam Kerja',
        'Unlimited shoot',
        '120 edited photos',
        'Tanpa cetak & album',
        'File Google Drive + Flashdisk',
      ],
    },
  })

  // 6. Create Additional Services
  console.log('➕ Creating additional services...')
  
  const additionalServices = [
    { name: 'Extra Hours', price: 200000, displayOrder: 1 },
    { name: 'Extra Day', price: 1500000, displayOrder: 2 },
    { name: 'Extra Photographer', price: 1000000, displayOrder: 3 },
    { name: 'Assistant (Photo Handphone)', price: 300000, displayOrder: 4 },
    { name: 'Photo Scan Barcode', price: 1500000, displayOrder: 5 },
    { name: 'Magnetic Album (40 foto)', price: 800000, displayOrder: 6 },
    { name: 'Sameday Edit (Edit Cepat)', price: 1000000, displayOrder: 7 },
  ]

  for (const service of additionalServices) {
    await prisma.additionalService.upsert({
      where: { id: service.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: service.name.toLowerCase().replace(/\s+/g, '-'),
        name: service.name,
        price: service.price,
        isActive: true,
        displayOrder: service.displayOrder,
      },
    })
  }

  console.log('✅ Additional services created')

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
