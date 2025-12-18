#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Konfigurasi R2
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

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

// Utility functions
function isValidImageFile(filename) {
  const ext = path.extname(filename);
  return SUPPORTED_EXTENSIONS.includes(ext);
}

function promptUser(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

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
      Bucket: R2_CONFIG.bucket,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
    };
    
    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    throw new Error(`R2 Upload failed: ${error.message}`);
  }
}

async function createDatabaseRecord(filename, originalUrl, thumbnailUrl, category, description, isFeatured) {
  try {
    const photoId = crypto.randomUUID();
    
    const record = await prisma.portfolio_photos.create({
      data: {
        id: photoId,
        filename: filename,
        original_url: originalUrl,
        thumbnail_url: thumbnailUrl,
        category: category,
        description: description || null,
        is_featured: isFeatured || false,
        display_order: Math.floor(Math.random() * 1000),
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    
    return record;
  } catch (error) {
    throw new Error(`Database error: ${error.message}`);
  }
}

async function uploadSingleFile(filePath, interactive = true) {
  try {
    console.log(`\n📸 Processing: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    if (!isValidImageFile(filePath)) {
      throw new Error(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    }
    
    const filename = path.basename(filePath);
    const tempThumbnail = path.join(__dirname, `temp_thumb_${filename}`);
    
    // Interactive prompts for metadata
    let category = 'Wedding';
    let description = '';
    let isFeatured = false;
    
    if (interactive) {
      console.log('\n📝 Please provide photo details:');
      category = await promptUser(`Category (Wedding/Portrait/Event) [Wedding]: `) || 'Wedding';
      description = await promptUser(`Description (optional): `);
      const featuredInput = await promptUser(`Featured photo? (y/n) [n]: `);
      isFeatured = featuredInput.toLowerCase() === 'y';
    }
    
    console.log(`   📤 Uploading original to R2...`);
    // Upload original
    const originalKey = `portfolio/${filename}`;
    const originalResult = await uploadToR2(filePath, originalKey);
    const originalUrl = `${R2_CONFIG.publicUrl}/${originalKey}`;
    
    console.log(`   ✅ Original uploaded: ${originalUrl}`);
    
    console.log(`   🖼️  Creating thumbnail...`);
    // Create and upload thumbnail
    const thumbnailSuccess = await createThumbnail(filePath, tempThumbnail);
    if (!thumbnailSuccess) {
      throw new Error('Failed to create thumbnail');
    }
    
    console.log(`   📤 Uploading thumbnail...`);
    const thumbnailKey = `portfolio/thumbnails/${filename}`;
    const thumbnailResult = await uploadToR2(tempThumbnail, thumbnailKey);
    const thumbnailUrl = `${R2_CONFIG.publicUrl}/${thumbnailKey}`;
    
    // Cleanup temp thumbnail
    fs.unlinkSync(tempThumbnail);
    
    console.log(`   ✅ Thumbnail uploaded: ${thumbnailUrl}`);
    
    console.log(`   💾 Creating database record...`);
    // Create database record
    const dbRecord = await createDatabaseRecord(
      filename, 
      originalUrl, 
      thumbnailUrl, 
      category, 
      description, 
      isFeatured
    );
    
    console.log(`   ✅ Database record created with ID: ${dbRecord.id}`);
    console.log(`   🎉 ${filename} successfully uploaded!\n`);
    
    return {
      success: true,
      filename,
      originalUrl,
      thumbnailUrl,
      category,
      description,
      isFeatured,
      recordId: dbRecord.id
    };
    
  } catch (error) {
    console.log(`   ❌ Error uploading ${path.basename(filePath)}: ${error.message}\n`);
    return {
      success: false,
      filename: path.basename(filePath),
      error: error.message
    };
  }
}

async function batchUpload(folderPath) {
  try {
    console.log(`\n📁 Scanning folder: ${folderPath}`);
    
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }
    
    const files = fs.readdirSync(folderPath)
      .filter(file => isValidImageFile(file))
      .map(file => path.join(folderPath, file));
    
    if (files.length === 0) {
      console.log('❌ No valid image files found in folder');
      return;
    }
    
    console.log(`📸 Found ${files.length} image files`);
    
    // Batch metadata prompts
    console.log('\n📝 Batch upload settings:');
    const category = await promptUser(`Category for all photos (Wedding/Portrait/Event) [Wedding]: `) || 'Wedding';
    const useAutoDescription = await promptUser(`Auto-generate descriptions? (y/n) [y]: `);
    const autoDesc = useAutoDescription.toLowerCase() !== 'n';
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = path.basename(file);
      
      console.log(`\n[${i + 1}/${files.length}] Processing: ${filename}`);
      
      try {
        const description = autoDesc ? `${category} Photography - ${filename}` : '';
        
        // Upload without interactive prompts
        const tempThumbnail = path.join(__dirname, `temp_thumb_${filename}`);
        
        console.log(`   📤 Uploading original to R2...`);
        const originalKey = `portfolio/${filename}`;
        await uploadToR2(file, originalKey);
        const originalUrl = `${R2_CONFIG.publicUrl}/${originalKey}`;
        
        console.log(`   🖼️  Creating thumbnail...`);
        const thumbnailSuccess = await createThumbnail(file, tempThumbnail);
        if (!thumbnailSuccess) throw new Error('Failed to create thumbnail');
        
        const thumbnailKey = `portfolio/thumbnails/${filename}`;
        await uploadToR2(tempThumbnail, thumbnailKey);
        const thumbnailUrl = `${R2_CONFIG.publicUrl}/${thumbnailKey}`;
        
        fs.unlinkSync(tempThumbnail);
        
        console.log(`   💾 Creating database record...`);
        const dbRecord = await createDatabaseRecord(
          filename, 
          originalUrl, 
          thumbnailUrl, 
          category, 
          description, 
          false
        );
        
        console.log(`   ✅ ${filename} uploaded successfully!`);
        
        results.push({
          success: true,
          filename,
          originalUrl,
          thumbnailUrl
        });
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({
          success: false,
          filename,
          error: error.message
        });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n🎊 Batch upload completed!`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed files:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Batch upload error: ${error.message}`);
  }
}

function showHelp() {
  console.log(`
🎨 Hafiportrait Portfolio Upload Tool

Usage:
  node portfolio-upload.js --upload <filename>     Upload single file
  node portfolio-upload.js --batch <folder>       Upload all images in folder
  node portfolio-upload.js --help                 Show this help

Examples:
  node portfolio-upload.js --upload photo1.jpg
  node portfolio-upload.js --batch ~/my-photos/
  node portfolio-upload.js --batch ./wedding-shoot/

Supported formats: JPG, JPEG, PNG
Categories: Wedding, Portrait, Event
`);
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    showHelp();
    return;
  }
  
  const command = args[0];
  const target = args[1];
  
  if (!target) {
    console.log('❌ Please specify a file or folder');
    showHelp();
    return;
  }
  
  console.log('🚀 Hafiportrait Portfolio Upload Tool\n');
  
  try {
    switch (command) {
      case '--upload':
        await uploadSingleFile(target, true);
        break;
        
      case '--batch':
        await batchUpload(target);
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        break;
    }
  } catch (error) {
    console.log(`❌ Fatal error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Enable stdin for interactive prompts
if (require.main === module) {
  process.stdin.setEncoding('utf8');
  main().catch(console.error);
}

module.exports = { uploadSingleFile, batchUpload };