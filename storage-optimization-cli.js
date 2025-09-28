#!/usr/bin/env node

/**
 * Storage Optimization CLI
 * CLI tool untuk Google Drive authentication dan storage management
 * Referenced from: src/lib/google-drive-storage.js
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const readline = require('readline');
require('dotenv').config({ path: '.env.production' });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// OAuth2 Configuration
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const TOKEN_PATH = './google-drive-tokens.json';

class StorageOptimizationCLI {
  constructor() {
    this.auth = null;
  }

  async authenticate() {
    log('🔑 GOOGLE DRIVE AUTHENTICATION', colors.bright);
    log('===============================', colors.bright);

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      log('❌ Missing Google Drive credentials in .env.local', colors.red);
      log('Required: GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET', colors.red);
      return false;
    }

    log('✅ Credentials found in environment', colors.green);

    // Create OAuth2 client with localhost redirect
    const redirectUri = 'http://localhost:8080';
    this.auth = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Check for existing tokens
    try {
      const tokenData = await fs.readFile(TOKEN_PATH, 'utf8');
      const tokens = JSON.parse(tokenData);
      
      this.auth.setCredentials(tokens);
      
      // Test the tokens
      const drive = google.drive({ version: 'v3', auth: this.auth });
      await drive.about.get({ fields: 'user' });
      
      log('✅ Existing tokens are valid', colors.green);
      return true;
    } catch (error) {
      log('⚠️ No valid tokens found, starting authorization flow...', colors.yellow);
    }

    // Get new tokens
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    log('\n🌐 Authorization Steps:', colors.cyan);
    log('1. Open this URL in your browser:', colors.blue);
    log(`   ${authUrl}`, colors.green);
    log('2. Complete the authorization flow', colors.blue);
    log('3. Copy the authorization code from the URL parameter', colors.blue);
    log('   (Look for: http://localhost:8080/?code=XXXX)', colors.yellow);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      rl.question('\n🔐 Enter authorization code (from URL): ', (code) => {
        rl.close();
        resolve(code.trim());
      });
    });

    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);

      // Save tokens
      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      log(`✅ Tokens saved to ${TOKEN_PATH}`, colors.green);

      // Test the new tokens
      const drive = google.drive({ version: 'v3', auth: this.auth });
      const aboutInfo = await drive.about.get({ fields: 'user,storageQuota' });
      
      log('🎉 Authentication successful!', colors.green);
      log(`   User: ${aboutInfo.data.user.displayName}`, colors.blue);
      log(`   Email: ${aboutInfo.data.user.emailAddress}`, colors.blue);

      // Update environment file suggestion
      if (tokens.refresh_token) {
        log('\n📝 Add this to your .env.local:', colors.cyan);
        log(`GOOGLE_DRIVE_REFRESH_TOKEN="${tokens.refresh_token}"`, colors.green);
      }

      return true;
    } catch (error) {
      log(`❌ Authentication failed: ${error.message}`, colors.red);
      return false;
    }
  }

  async status() {
    log('📊 GOOGLE DRIVE STATUS', colors.bright);
    log('======================', colors.bright);

    try {
      const GoogleDriveStorage = require('./src/lib/google-drive-storage.js');
      const storage = new GoogleDriveStorage();
      
      await storage.initialize();
      
      const storageInfo = await storage.getStorageInfo();
      if (storageInfo) {
        log('✅ Google Drive connected', colors.green);
        log(`   Used: ${storageInfo.usedGB} GB (${storageInfo.usagePercent}%)`, colors.blue);
        log(`   Available: ${storageInfo.availableGB} GB`, colors.blue);
        log(`   Total: ${storageInfo.limitGB} GB`, colors.blue);
      }

      // Check recent uploads
      const files = await storage.listFiles(null, { pageSize: 5 });
      if (files && files.length > 0) {
        log(`\n📁 Recent uploads (${files.length}):`, colors.cyan);
        files.forEach((file, index) => {
          log(`   ${index + 1}. ${file.name}`, colors.blue);
        });
      }

    } catch (error) {
      log(`❌ Status check failed: ${error.message}`, colors.red);
    }
  }

  async test() {
    log('🧪 GOOGLE DRIVE TEST', colors.bright);
    log('====================', colors.bright);

    try {
      const GoogleDriveStorage = require('./src/lib/google-drive-storage.js');
      const storage = new GoogleDriveStorage();
      
      await storage.initialize();
      
      // Test upload
      const testContent = `Storage Optimization CLI Test\nTimestamp: ${new Date().toISOString()}`;
      const testBuffer = Buffer.from(testContent, 'utf8');
      const testFileName = `cli_test_${Date.now()}.txt`;
      
      log(`📤 Testing upload: ${testFileName}`, colors.blue);
      
      const result = await storage.uploadPhoto(testBuffer, testFileName, {
        eventId: 'cli-test',
        albumName: 'Test'
      });
      
      if (result) {
        log('✅ Upload test successful', colors.green);
        log(`   File ID: ${result.fileId}`, colors.blue);
        log(`   View: ${result.webViewLink}`, colors.blue);
        
        // Cleanup
        await storage.deleteFile(result.fileId);
        log('🗑️ Test file cleaned up', colors.green);
      }

    } catch (error) {
      log(`❌ Test failed: ${error.message}`, colors.red);
    }
  }

  showHelp() {
    log('📖 STORAGE OPTIMIZATION CLI', colors.bright);
    log('===========================', colors.bright);
    log('Available commands:', colors.cyan);
    log('  auth   - Authenticate with Google Drive', colors.blue);
    log('  status - Show Google Drive status', colors.blue);
    log('  test   - Test Google Drive connection', colors.blue);
    log('  help   - Show this help message', colors.blue);
    log('', colors.reset);
    log('Examples:', colors.cyan);
    log('  node storage-optimization-cli.js auth', colors.green);
    log('  node storage-optimization-cli.js status', colors.green);
    log('  node storage-optimization-cli.js test', colors.green);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const cli = new StorageOptimizationCLI();

  switch (command) {
    case 'auth':
      await cli.authenticate();
      break;
    case 'status':
      await cli.status();
      break;
    case 'test':
      await cli.test();
      break;
    case 'help':
    default:
      cli.showHelp();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = StorageOptimizationCLI;