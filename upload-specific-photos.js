const { uploadSingleFile } = require('./portfolio-upload.js');
const path = require('path');

// Foto spesifik yang akan diupload (selain HFI_2677.JPG yang sudah diupload)
const photosToUpload = [
  'HFI_2631.JPG',
  'HFI_2640.JPG', 
  'HFI_2647.JPG',
  'HFI_2655.JPG'
];

async function uploadSpecificPhotos() {
  console.log('🎨 Uploading specific photos from ~/foto/\n');
  
  const results = [];
  
  for (let i = 0; i < photosToUpload.length; i++) {
    const filename = photosToUpload[i];
    const filePath = path.join(process.env.HOME, 'foto', filename);
    
    console.log(`[${i + 1}/${photosToUpload.length}] Uploading ${filename}...`);
    
    try {
      // Upload without interactive mode by creating a mock file with metadata
      const AWS = require('aws-sdk');
      const fs = require('fs');
      const sharp = require('sharp');
      const { PrismaClient } = require('@prisma/client');
      const crypto = require('crypto');

      const prisma = new PrismaClient();

      // R2 Config
      const R2_CONFIG = {
        endpoint: 'https://0a21532cc7638a2a70023eadd7ca9165.r2.cloudflarestorage.com',
        accessKeyId: 'c8919ca89140cf24f68bde8f76dffa48',
        secretAccessKey: '2592753bdea15840b6e7e9bc13449b0a7b5290490e264274cd52c8456d426f5a',
        region: 'auto',
        bucket: 'photos',
        publicUrl: 'https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev'
      };

      const s3 = new AWS.S3({
        endpoint: R2_CONFIG.endpoint,
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
        region: R2_CONFIG.region,
        signatureVersion: 'v4',
      });

      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ File not found: ${filePath}`);
        continue;
      }

      const tempThumbnail = path.join(__dirname, `temp_thumb_${filename}`);
      
      // Upload original
      console.log(`   📤 Uploading original...`);
      const originalKey = `portfolio/${filename}`;
      const fileContent = fs.readFileSync(filePath);
      
      await s3.upload({
        Bucket: R2_CONFIG.bucket,
        Key: originalKey,
        Body: fileContent,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000',
      }).promise();
      
      const originalUrl = `${R2_CONFIG.publicUrl}/${originalKey}`;
      console.log(`   ✅ Original uploaded: ${originalUrl}`);
      
      // Create thumbnail
      console.log(`   🖼️  Creating thumbnail...`);
      await sharp(filePath)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(tempThumbnail);
      
      // Upload thumbnail
      const thumbnailKey = `portfolio/thumbnails/${filename}`;
      const thumbnailContent = fs.readFileSync(tempThumbnail);
      
      await s3.upload({
        Bucket: R2_CONFIG.bucket,
        Key: thumbnailKey,
        Body: thumbnailContent,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000',
      }).promise();
      
      const thumbnailUrl = `${R2_CONFIG.publicUrl}/${thumbnailKey}`;
      console.log(`   ✅ Thumbnail uploaded: ${thumbnailUrl}`);
      
      // Cleanup temp file
      fs.unlinkSync(tempThumbnail);
      
      // Create database record
      console.log(`   💾 Creating database record...`);
      const photoId = crypto.randomUUID();
      
      await prisma.portfolio_photos.create({
        data: {
          id: photoId,
          filename: filename,
          original_url: originalUrl,
          thumbnail_url: thumbnailUrl,
          category: 'Wedding',
          description: `Wedding Photography - ${filename}`,
          is_featured: false,
          display_order: Math.floor(Math.random() * 1000),
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
      
      console.log(`   ✅ Database record created`);
      console.log(`   🎉 ${filename} uploaded successfully!\n`);
      
      await prisma.$disconnect();
      
      results.push({ success: true, filename });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.push({ success: false, filename, error: error.message });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`🎊 Upload completed!`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed files:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.filename}: ${r.error}`);
    });
  }
}

uploadSpecificPhotos().catch(console.error);