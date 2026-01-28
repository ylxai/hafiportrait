/**
 * Migration Script: Local Storage to Cloudflare R2
 * 
 * This script:
 * 1. Uploads all files from local storage to R2
 * 2. Updates photo URLs in database (using Prisma)
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-r2.ts --dry-run    # Preview only
 *   npx tsx scripts/migrate-to-r2.ts              # Execute migration
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Configuration
const LOCAL_STORAGE_PATH = process.env.STORAGE_BASE_PATH || '/home/eouser/storage';
const LOCAL_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || 'https://hafiportrait.photography/storage';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
const R2_BUCKET = process.env.R2_BUCKET || 'photos';

const DRY_RUN = process.argv.includes('--dry-run');

// Debug env
console.log('ENV Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  R2_ENDPOINT:', process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing');
console.log('  R2_PUBLIC_URL:', R2_PUBLIC_URL || '❌ Missing');

if (!process.env.DATABASE_URL || !process.env.R2_ENDPOINT) {
  console.error('\n❌ Required environment variables missing!');
  process.exit(1);
}

// Initialize R2 Client
const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

// Initialize Prisma
const prisma = new PrismaClient();

// Stats
let stats = {
  filesFound: 0,
  filesUploaded: 0,
  filesSkipped: 0,
  filesFailed: 0,
  dbRecordsUpdated: 0,
  dbRecordsFailed: 0,
};

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * Check if file exists in R2
 */
async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a single file to R2
 */
async function uploadFileToR2(localPath: string, r2Key: string): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    }));

    return true;
  } catch (error) {
    console.error(`  ❌ Failed to upload ${r2Key}:`, error);
    return false;
  }
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Convert local path to R2 key
 * /home/eouser/storage/events/xxx/photos/file.jpg -> events/xxx/photos/file.jpg
 */
function localPathToR2Key(localPath: string): string {
  const relativePath = localPath.replace(LOCAL_STORAGE_PATH + '/', '');
  return relativePath;
}

/**
 * Convert local URL to R2 URL
 */
function localUrlToR2Url(localUrl: string): string {
  return localUrl.replace(LOCAL_PUBLIC_URL, R2_PUBLIC_URL);
}

/**
 * Step 1: Upload all local files to R2
 */
async function uploadAllFilesToR2(): Promise<void> {
  console.log('\n📤 STEP 1: Uploading files to R2...\n');
  
  const eventsPath = path.join(LOCAL_STORAGE_PATH, 'events');
  
  if (!fs.existsSync(eventsPath)) {
    console.log('❌ Events folder not found:', eventsPath);
    return;
  }

  const allFiles = getAllFiles(eventsPath);
  stats.filesFound = allFiles.length;
  
  console.log(`Found ${allFiles.length} files to upload\n`);

  for (let i = 0; i < allFiles.length; i++) {
    const localPath = allFiles[i];
    const r2Key = localPathToR2Key(localPath);
    const progress = `[${i + 1}/${allFiles.length}]`;

    // Check if already exists in R2
    const exists = await fileExistsInR2(r2Key);
    
    if (exists) {
      console.log(`${progress} ⏭️  Skip (exists): ${r2Key}`);
      stats.filesSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`${progress} 🔍 Would upload: ${r2Key}`);
      stats.filesUploaded++;
    } else {
      const success = await uploadFileToR2(localPath, r2Key);
      if (success) {
        console.log(`${progress} ✅ Uploaded: ${r2Key}`);
        stats.filesUploaded++;
      } else {
        stats.filesFailed++;
      }
    }
  }
}

/**
 * Step 2: Update database URLs using Prisma
 */
async function updateDatabaseUrls(): Promise<void> {
  console.log('\n📝 STEP 2: Updating database URLs...\n');

  // Get all photos with local URLs
  const photos = await prisma.photos.findMany({
    where: {
      OR: [
        { original_url: { contains: LOCAL_PUBLIC_URL } },
        { thumbnail_url: { contains: LOCAL_PUBLIC_URL } },
      ],
    },
    select: {
      id: true,
      original_url: true,
      thumbnail_url: true,
    },
  });

  if (photos.length === 0) {
    console.log('✅ No photos with local URLs found');
  } else {
    console.log(`Found ${photos.length} photos to update\n`);

    for (const photo of photos) {
      const newUrl = photo.original_url ? localUrlToR2Url(photo.original_url) : photo.original_url;
      const newThumbnailUrl = photo.thumbnail_url ? localUrlToR2Url(photo.thumbnail_url) : photo.thumbnail_url;

      if (DRY_RUN) {
        console.log(`🔍 Would update photo ${photo.id}:`);
        console.log(`   url: ${photo.original_url}`);
        console.log(`   ->  ${newUrl}`);
        stats.dbRecordsUpdated++;
      } else {
        try {
          await prisma.photos.update({
            where: { id: photo.id },
            data: {
              original_url: newUrl,
              thumbnail_url: newThumbnailUrl,
            },
          });
          console.log(`✅ Updated photo ${photo.id}`);
          stats.dbRecordsUpdated++;
        } catch (error) {
          console.error(`❌ Failed to update photo ${photo.id}:`, error);
          stats.dbRecordsFailed++;
        }
      }
    }
  }

  // Also update hero_slideshow
  console.log('\n📝 Checking hero_slideshow table...\n');
  
  try {
    const heroSlides = await prisma.hero_slideshow.findMany({
      where: {
        image_url: { contains: LOCAL_PUBLIC_URL },
      },
    });

    if (heroSlides.length > 0) {
      console.log(`Found ${heroSlides.length} hero slides to update\n`);
      
      for (const slide of heroSlides) {
        const newImageUrl = localUrlToR2Url(slide.image_url);
        
        if (DRY_RUN) {
          console.log(`🔍 Would update hero slide ${slide.id}: ${slide.image_url} -> ${newImageUrl}`);
        } else {
          await prisma.hero_slideshow.update({
            where: { id: slide.id },
            data: { image_url: newImageUrl },
          });
          console.log(`✅ Updated hero slide ${slide.id}`);
        }
      }
    } else {
      console.log('✅ No hero slides with local URLs found');
    }
  } catch (error) {
    console.log('⚠️  hero_slideshow table check skipped (may not exist)');
  }
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   MIGRATION: Local Storage → Cloudflare R2');
  console.log('═══════════════════════════════════════════════════════');
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
  }

  console.log('Configuration:');
  console.log(`  Local Path:    ${LOCAL_STORAGE_PATH}`);
  console.log(`  Local URL:     ${LOCAL_PUBLIC_URL}`);
  console.log(`  R2 Bucket:     ${R2_BUCKET}`);
  console.log(`  R2 Public URL: ${R2_PUBLIC_URL}`);

  // Step 1: Upload files
  await uploadAllFilesToR2();

  // Step 2: Update database
  await updateDatabaseUrls();

  // Disconnect Prisma
  await prisma.$disconnect();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Files found:        ${stats.filesFound}`);
  console.log(`  Files uploaded:     ${stats.filesUploaded}`);
  console.log(`  Files skipped:      ${stats.filesSkipped}`);
  console.log(`  Files failed:       ${stats.filesFailed}`);
  console.log(`  DB records updated: ${stats.dbRecordsUpdated}`);
  console.log(`  DB records failed:  ${stats.dbRecordsFailed}`);
  console.log('═══════════════════════════════════════════════════════');

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Run without --dry-run to execute migration.');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\n📌 NEXT STEPS:');
    console.log('   1. Update .env.production: USE_LOCAL_STORAGE=false');
    console.log('   2. Restart PM2: pm2 restart all');
    console.log('   3. Test the application');
    console.log('   4. Keep local files as backup for 1 month');
  }
}

// Run
main().catch((error) => {
  console.error('Migration failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
