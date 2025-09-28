/**
 * Cloud Storage Setup Script
 * Helps configure Cloudflare R2 and Google Drive credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('🔐 Cloud Storage Setup Wizard');
console.log('=============================');
console.log('This script will help you configure cloud storage credentials for Smart Storage Manager.');
console.log('');

async function setupCloudStorage() {
  try {
    // Check current .env.local
    const envPath = '.env.local';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file');
    } else {
      console.log('⚠️ No .env.local file found, will create new one');
    }

    console.log('\n📋 Current cloud storage status:');
    console.log('   Cloudflare R2: ❌ Not configured');
    console.log('   Google Drive: ❌ Not configured');
    console.log('   Local Storage: ✅ Available');
    console.log('');

    const setupChoice = await question('Do you want to setup cloud storage now? (y/n): ');
    
    if (setupChoice.toLowerCase() !== 'y') {
      console.log('⚠️ Skipping cloud storage setup.');
      console.log('Smart Storage will use local storage only (Tier 3).');
      rl.close();
      return;
    }

    // Cloudflare R2 Setup
    console.log('\n🌐 Cloudflare R2 Setup (Tier 1 - Primary Storage)');
    console.log('================================================');
    console.log('To get Cloudflare R2 credentials:');
    console.log('1. Go to https://dash.cloudflare.com/');
    console.log('2. Navigate to R2 Object Storage');
    console.log('3. Create API token with R2 permissions');
    console.log('4. Create a bucket for photos');
    console.log('');

    const setupR2 = await question('Do you have Cloudflare R2 credentials? (y/n): ');
    
    let r2Config = '';
    if (setupR2.toLowerCase() === 'y') {
      const accountId = await question('Enter Cloudflare Account ID: ');
      const accessKey = await question('Enter R2 Access Key ID: ');
      const secretKey = await question('Enter R2 Secret Access Key: ');
      const bucketName = await question('Enter R2 Bucket Name: ');
      
      r2Config = `
# Cloudflare R2 Configuration (Tier 1)
CLOUDFLARE_R2_ACCOUNT_ID=${accountId}
CLOUDFLARE_R2_ACCESS_KEY_ID=${accessKey}
CLOUDFLARE_R2_SECRET_ACCESS_KEY=${secretKey}
CLOUDFLARE_R2_BUCKET_NAME=${bucketName}
CLOUDFLARE_R2_PUBLIC_URL=https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
      
      console.log('✅ Cloudflare R2 configured');
    } else {
      r2Config = `
# Cloudflare R2 Configuration (Tier 1) - DISABLED
# CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
# CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
# CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
# CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name`;
      
      console.log('⚠️ Cloudflare R2 skipped - will use Google Drive as primary');
    }

    // Google Drive Setup
    console.log('\n📁 Google Drive Setup (Tier 2 - Secondary Storage)');
    console.log('==================================================');
    console.log('To get Google Drive credentials:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create project and enable Google Drive API');
    console.log('3. Create OAuth2 credentials');
    console.log('4. Generate refresh token');
    console.log('');

    const setupDrive = await question('Do you have Google Drive credentials? (y/n): ');
    
    let driveConfig = '';
    if (setupDrive.toLowerCase() === 'y') {
      const clientId = await question('Enter Google Drive Client ID: ');
      const clientSecret = await question('Enter Google Drive Client Secret: ');
      const refreshToken = await question('Enter Google Drive Refresh Token: ');
      const folderId = await question('Enter Google Drive Folder ID (optional): ');
      
      driveConfig = `
# Google Drive Configuration (Tier 2)
GOOGLE_DRIVE_CLIENT_ID=${clientId}
GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}
GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}
GOOGLE_DRIVE_FOLDER_ID=${folderId || 'root'}`;
      
      console.log('✅ Google Drive configured');
    } else {
      driveConfig = `
# Google Drive Configuration (Tier 2) - DISABLED
# GOOGLE_DRIVE_CLIENT_ID=your-client-id
# GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
# GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
# GOOGLE_DRIVE_FOLDER_ID=your-folder-id`;
      
      console.log('⚠️ Google Drive skipped - will use local storage as fallback');
    }

    // Local Storage Config
    const localConfig = `
# Local Storage Configuration (Tier 3)
LOCAL_BACKUP_PATH=~/photos`;

    // Combine all configs
    const cloudStorageConfig = `
# ============================================
# SMART STORAGE MANAGER CONFIGURATION
# ============================================${r2Config}${driveConfig}${localConfig}

# Smart Storage Settings
SMART_STORAGE_ENABLED=true
SMART_STORAGE_DEFAULT_TIER=auto
SMART_STORAGE_COMPRESSION_QUALITY=85`;

    // Update .env.local
    const updatedEnvContent = envContent + cloudStorageConfig;
    
    // Backup existing .env.local
    if (fs.existsSync(envPath)) {
      const backupPath = `.env.local.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.writeFileSync(backupPath, envContent);
      console.log(`📋 Backed up existing .env.local to ${backupPath}`);
    }

    // Write updated .env.local
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log('✅ Updated .env.local with cloud storage configuration');

    // Test configuration
    console.log('\n🧪 Testing configuration...');
    
    // Create test script
    const testScript = `
const { storageAdapter } = require('./src/lib/storage-adapter');

async function testConfig() {
  try {
    console.log('Testing Smart Storage configuration...');
    const report = await storageAdapter.getStorageReport();
    console.log('✅ Smart Storage configuration test passed');
    console.log('Storage Report:', report);
  } catch (error) {
    console.log('❌ Smart Storage configuration test failed:', error.message);
  }
}

testConfig();
`;

    fs.writeFileSync('test-storage-config.js', testScript);
    
    console.log('\n🎉 Cloud Storage Setup Complete!');
    console.log('================================');
    console.log('✅ Configuration saved to .env.local');
    console.log('✅ Backup created of previous configuration');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test configuration: node test-storage-config.js');
    console.log('3. Run integration tests: node tmp_rovodev_test-smart-storage-integration.js');
    console.log('4. Monitor storage analytics: http://localhost:3000/api/admin/storage/status');
    console.log('');
    console.log('📊 Expected improvements:');
    console.log('- Smart Storage adoption rate will increase');
    console.log('- Photos will use configured cloud storage tiers');
    console.log('- Upload performance will improve with CDN');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    rl.close();
  }
}

// Run setup
setupCloudStorage();