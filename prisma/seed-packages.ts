import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding package management data...')

  // 1. Create Categories
  console.log('📦 Creating categories...')

  const categoryAkad = await prisma.package_categories.upsert({
    where: { slug: 'akad' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Akad',
      slug: 'akad',
      icon: '💍',
      display_order: 1,
      is_active: true,
      updated_at: new Date(),
    },
  })

  const categoryResepsi = await prisma.package_categories.upsert({
    where: { slug: 'resepsi' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Resepsi',
      slug: 'resepsi',
      icon: '🎉',
      display_order: 2,
      is_active: true,
      updated_at: new Date(),
    },
  })

  const categoryAkadResepsi = await prisma.package_categories.upsert({
    where: { slug: 'akad-resepsi' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Akad + Resepsi',
      slug: 'akad-resepsi',
      icon: '💍🎉',
      display_order: 3,
      is_active: true,
      updated_at: new Date(),
    },
  })

  const categoryDigital = await prisma.package_categories.upsert({
    where: { slug: 'digital-only' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Digital Only',
      slug: 'digital-only',
      icon: '📸',
      display_order: 4,
      is_active: true,
      updated_at: new Date(),
    },
  })

  console.log('✅ Categories created')

  // 2. Create Packages - AKAD
  console.log('📸 Creating Akad packages...')

  await prisma.packages.upsert({
    where: { id: 'sacred-vow' },
    update: {},
    create: {
      id: 'sacred-vow',
      name: 'Sacred Vow',
      description: 'Pilihan tepat untuk akad sederhana & intimate.',
      price: 1300000,
      category_id: categoryAkad.id,
      is_best_seller: false,
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'pure-promise' },
    update: {},
    create: {
      id: 'pure-promise',
      name: 'Pure Promise',
      description: 'Paket favorit untuk akad yang lebih lengkap & berkesan.',
      price: 2000000,
      category_id: categoryAkad.id,
      is_best_seller: true,
      is_active: true,
      display_order: 2,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'our-story' },
    update: {},
    create: {
      id: 'our-story',
      name: 'Our Story',
      description: 'Cocok untuk resepsi sederhana dengan dokumentasi inti.',
      price: 1800000,
      category_id: categoryResepsi.id,
      is_best_seller: false,
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'euphoria' },
    update: {},
    create: {
      id: 'euphoria',
      name: 'Euphoria',
      description: 'Paket paling seimbang untuk resepsi yang ramai & penuh momen.',
      price: 2300000,
      category_id: categoryResepsi.id,
      is_best_seller: true,
      is_active: true,
      display_order: 2,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'the-vow' },
    update: {},
    create: {
      id: 'the-vow',
      name: 'The Vow',
      description: 'Praktis untuk dua hari acara dengan dokumentasi menyeluruh.',
      price: 3000000,
      category_id: categoryAkadResepsi.id,
      is_best_seller: false,
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'after-the-vow' },
    update: {},
    create: {
      id: 'after-the-vow',
      name: 'After the Vow',
      description: 'Pilihan ideal untuk pasangan yang ingin dokumentasi lebih eksklusif.',
      price: 4000000,
      category_id: categoryAkadResepsi.id,
      is_best_seller: true,
      is_active: true,
      display_order: 2,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'after-the-vow-signature' },
    update: {},
    create: {
      id: 'after-the-vow-signature',
      name: 'After the Vow — Signature',
      description: 'Paket premium dengan tim dan hasil cetak terbaik.',
      price: 6000000,
      category_id: categoryAkadResepsi.id,
      is_best_seller: false,
      is_active: true,
      display_order: 3,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'quiet-vows' },
    update: {},
    create: {
      id: 'quiet-vows',
      name: 'Quiet Vows',
      description: 'Pilihan hemat untuk akad atau sesi singkat.',
      price: 1500000,
      category_id: categoryDigital.id,
      is_best_seller: false,
      is_active: true,
      display_order: 1,
      updated_at: new Date(),
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

  await prisma.packages.upsert({
    where: { id: 'timeless-frame' },
    update: {},
    create: {
      id: 'timeless-frame',
      name: 'Timeless Frame',
      description: 'Paket digital favorit dengan durasi lebih panjang.',
      price: 2400000,
      category_id: categoryDigital.id,
      is_best_seller: true,
      is_active: true,
      display_order: 2,
      updated_at: new Date(),
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
    { name: 'Extra Hours', price: 200000, display_order: 1 },
    { name: 'Extra Day', price: 1500000, display_order: 2 },
    { name: 'Extra Photographer', price: 1000000, display_order: 3 },
    { name: 'Assistant (Photo Handphone)', price: 300000, display_order: 4 },
    { name: 'Photo Scan Barcode', price: 1500000, display_order: 5 },
    { name: 'Magnetic Album (40 foto)', price: 800000, display_order: 6 },
    { name: 'Sameday Edit (Edit Cepat)', price: 1000000, display_order: 7 },
  ]

  for (const service of additionalServices) {
    await prisma.additional_services.upsert({
      where: { id: service.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: service.name.toLowerCase().replace(/\s+/g, '-'),
        name: service.name,
        price: service.price,
        is_active: true,
        display_order: service.display_order,
        updated_at: new Date(),
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
