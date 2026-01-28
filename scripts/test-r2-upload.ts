import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

async function testUpload() {
  const testFile = fs.readFileSync('foto/HFI_2663.jpg');
  const testKey = 'test-upload-' + Date.now() + '.jpg';
  
  console.log('Uploading test file to R2...');
  console.log('Key:', testKey);
  
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: testKey,
    Body: testFile,
    ContentType: 'image/jpeg',
  }));
  
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/"/g, '') + '/' + testKey;
  console.log('✅ Upload success!');
  console.log('URL:', publicUrl);
  
  // Test access
  const response = await fetch(publicUrl);
  console.log('HTTP Status:', response.status);
}

testUpload().catch(console.error);
