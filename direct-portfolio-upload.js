const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Foto-foto yang akan diupload
const photos = [
  {
    filename: 'DSC_7704.JPG',
    category: 'Wedding',
    description: 'Wedding Photography - Beautiful couple moment'
  },
  {
    filename: 'DSC_7712.JPG', 
    category: 'Wedding',
    description: 'Wedding Photography - Elegant ceremony'
  }
];

// Simulasi URL untuk Cloudflare R2 (atau bisa pakai local path)
const baseUrl = 'https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev/portfolio';

async function uploadPhotosToDatabase() {
  console.log('📸 Adding photos to portfolio database...\n');
  
  try {
    for (const photo of photos) {
      const photoId = crypto.randomUUID();
      const originalUrl = `${baseUrl}/${photo.filename}`;
      const thumbnailUrl = `${baseUrl}/thumbnails/${photo.filename}`;
      
      console.log(`📷 Adding ${photo.filename}...`);
      
      await prisma.portfolio_photos.create({
        data: {
          id: photoId,
          filename: photo.filename,
          original_url: originalUrl,
          thumbnail_url: thumbnailUrl,
          category: photo.category,
          description: photo.description,
          is_featured: false,
          display_order: Math.floor(Math.random() * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
      
      console.log(`✅ ${photo.filename} added to database`);
      console.log(`   Original: ${originalUrl}`);
      console.log(`   Thumbnail: ${thumbnailUrl}\n`);
    }
    
    console.log('🎉 All photos successfully added to portfolio!');
    
    // Show count
    const count = await prisma.portfolio_photos.count();
    console.log(`📊 Total portfolio photos: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

uploadPhotosToDatabase();