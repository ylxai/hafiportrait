const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Konfigurasi R2 dari environment
const R2_ENDPOINT = 'https://0a21532cc7638a2a70023eadd7ca9165.r2.cloudflarestorage.com';
const R2_ACCESS_KEY = 'c8919ca89140cf24f68bde8f76dffa48';
const R2_SECRET_KEY = '2592753bdea15840b6e7e9bc13449b0a7b5290490e264274cd52c8456d426f5a';
const R2_BUCKET = 'photos';

// Konfigurasi AWS SDK untuk R2
const s3 = new AWS.S3({
  endpoint: R2_ENDPOINT,
  accessKeyId: R2_ACCESS_KEY,
  secretAccessKey: R2_SECRET_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

// File yang akan diupload
const files = [
  'DSC_7704.JPG',
  'DSC_7712.JPG'
];

async function createThumbnail(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.log(`❌ Error creating thumbnail: ${error.message}`);
    return false;
  }
}

async function uploadToR2(localPath, r2Key, contentType = 'image/jpeg') {
  try {
    const fileContent = fs.readFileSync(localPath);
    
    const params = {
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // 1 year cache
    };
    
    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.log(`❌ Upload error: ${error.message}`);
    return null;
  }
}

async function uploadPhotos() {
  console.log('🚀 Starting upload to Cloudflare R2...\n');
  
  for (const filename of files) {
    try {
      const localPath = path.join(__dirname, filename);
      
      if (!fs.existsSync(localPath)) {
        console.log(`❌ File not found: ${filename}`);
        continue;
      }
      
      console.log(`📸 Processing ${filename}...`);
      
      // 1. Upload original image
      const originalKey = `portfolio/${filename}`;
      console.log(`   📤 Uploading original...`);
      const originalResult = await uploadToR2(localPath, originalKey);
      
      if (originalResult) {
        console.log(`   ✅ Original uploaded: ${originalKey}`);
      } else {
        console.log(`   ❌ Failed to upload original`);
        continue;
      }
      
      // 2. Create and upload thumbnail
      const thumbnailPath = path.join(__dirname, `thumb_${filename}`);
      const thumbnailKey = `portfolio/thumbnails/${filename}`;
      
      console.log(`   🖼️  Creating thumbnail...`);
      const thumbSuccess = await createThumbnail(localPath, thumbnailPath);
      
      if (thumbSuccess) {
        console.log(`   📤 Uploading thumbnail...`);
        const thumbnailResult = await uploadToR2(thumbnailPath, thumbnailKey);
        
        if (thumbnailResult) {
          console.log(`   ✅ Thumbnail uploaded: ${thumbnailKey}`);
        } else {
          console.log(`   ❌ Failed to upload thumbnail`);
        }
        
        // Cleanup temporary thumbnail
        fs.unlinkSync(thumbnailPath);
      }
      
      console.log(`   🎉 ${filename} processing completed!\n`);
      
    } catch (error) {
      console.log(`❌ Error processing ${filename}: ${error.message}\n`);
    }
  }
  
  console.log('🎊 Upload process completed!');
  console.log(`🔗 Files available at: https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev/`);
}

uploadPhotos();