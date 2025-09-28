#!/usr/bin/env node

/**
 * 🚀 Cloudflare Pages Setup Script for HafiPortrait
 * 
 * This script helps setup Cloudflare Pages deployment
 * Based on env-cloudflare.md configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Cloudflare Pages for HafiPortrait...\n');

// Read environment variables from env-cloudflare.md
function readCloudflareEnv() {
  try {
    const envFile = fs.readFileSync('env-cloudflare.md', 'utf8');
    const envVars = {};
    
    // Extract environment variables from markdown
    const lines = envFile.split('\n');
    let inCodeBlock = false;
    
    lines.forEach(line => {
      if (line.trim().startsWith('```bash')) {
        inCodeBlock = true;
        return;
      }
      if (line.trim() === '```') {
        inCodeBlock = false;
        return;
      }
      
      if (inCodeBlock && line.includes('=') && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Error reading env-cloudflare.md:', error.message);
    return {};
  }
}

// Generate Cloudflare Pages configuration
function generateCloudflareConfig() {
  const envVars = readCloudflareEnv();
  
  const config = {
    name: 'hafiportrait',
    production_branch: 'main',
    build: {
      command: 'npm run build:cloudflare',
      destination: 'out',
      root_dir: '/',
      environment_variables: envVars
    },
    preview: {
      environment_variables: {
        ...envVars,
        NODE_ENV: 'preview',
        NEXT_PUBLIC_ENV_MODE: 'preview'
      }
    }
  };
  
  return config;
}

// Create wrangler.toml for Cloudflare Pages
function createWranglerConfig() {
  const config = `name = "hafiportrait"
compatibility_date = "2024-01-18"

[env.production]
name = "hafiportrait"

[env.preview]
name = "hafiportrait-preview"

# Pages configuration
pages_build_output_dir = "out"

# Environment variables will be set via Cloudflare Dashboard
# See env-cloudflare.md for complete list
`;

  fs.writeFileSync('wrangler.toml', config);
  console.log('✅ Created wrangler.toml');
}

// Create Cloudflare Pages deployment guide
function createDeploymentGuide() {
  const guide = `# 🚀 Cloudflare Pages Deployment Guide - HafiPortrait

## 📋 Setup Steps

### 1. **Create Cloudflare Pages Project**
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Pages** section
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your GitHub repository
6. Configure build settings:
   - **Project name**: \`hafiportrait\`
   - **Production branch**: \`main\`
   - **Framework preset**: \`Next.js\`
   - **Build command**: \`npm run build:cloudflare\`
   - **Build output directory**: \`out\`

### 2. **Configure Environment Variables**
Go to **Pages > hafiportrait > Settings > Environment variables**

Copy all variables from \`env-cloudflare.md\`:

\`\`\`bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_APP_URL=https://hafiportrait.pages.dev
NEXT_TELEMETRY_DISABLED=1

# Authentication
JWT_SECRET=hafiportrait-production-jwt-secret-32chars-minimum
SESSION_SECRET=hafiportrait-production-session-secret-32chars

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://azspktldiblhrwebzmwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c3BrdGxkaWJsaHJ3ZWJ6bXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDQwNDQsImV4cCI6MjA2OTUyMDA0NH0.uKHB4K9hxUDTc0ZkwidCJv_Ev-oa99AflFvrFt_8MG8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c3BrdGxkaWJsaHJ3ZWJ6bXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0NDA0NCwiZXhwIjoyMDY5NTIwMDQ0fQ.hk8vOgFoW3PJZxhw40sHiNyvNxbD4_c4x6fqBynvlmE

# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCOUNT_ID=b14090010faed475102a62eca152b67f
CLOUDFLARE_R2_ACCESS_KEY_ID=51c66dbac26827b84132186428eb3492
CLOUDFLARE_R2_SECRET_ACCESS_KEY=65fe1143600bd9ef97a5c76b4ae924259779e0d0815ce44f09a1844df37fe3f1
CLOUDFLARE_R2_BUCKET_NAME=hafiportrait-photos
CLOUDFLARE_R2_CUSTOM_DOMAIN=photos.hafiportrait.photography
CLOUDFLARE_R2_PUBLIC_URL=https://photos.hafiportrait.photography
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_ENDPOINT=https://b14090010faed475102a62eca152b67f.r2.cloudflarestorage.com

# Socket.IO VPS Server
NEXT_PUBLIC_USE_SOCKETIO=true
NEXT_PUBLIC_SOCKETIO_URL=http://147.251.255.227:4001
SOCKETIO_PORT=4001

# Security
CORS_ORIGIN=https://hafiportrait.pages.dev
ALLOWED_ORIGINS=https://hafiportrait.pages.dev,https://hafiportrait.photography
NEXT_PUBLIC_ALLOW_ALL_ORIGINS=false
\`\`\`

### 3. **Setup Custom Domain**
1. Go to **Pages > hafiportrait > Custom domains**
2. Click **Set up a custom domain**
3. Enter: \`hafiportrait.photography\`
4. Cloudflare will automatically configure DNS records
5. Wait for SSL certificate provisioning

### 4. **Deploy**
1. Push code to GitHub main branch
2. Cloudflare Pages will automatically build and deploy
3. Monitor build logs in Cloudflare Dashboard

## 🔗 **URLs After Setup**
- **Cloudflare Pages**: \`https://hafiportrait.pages.dev\`
- **Custom Domain**: \`https://hafiportrait.photography\`
- **Socket.IO Server**: \`http://147.251.255.227:4001\` (VPS)

## ✅ **Verification Checklist**
- [ ] Cloudflare Pages project created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Custom domain added and SSL active
- [ ] First deployment successful
- [ ] Socket.IO connection working
- [ ] Database connection working
- [ ] R2 storage working

## 🚨 **Important Notes**
1. **Static Export**: App will be built as static files (no server-side rendering)
2. **API Routes**: Will be converted to static JSON files where possible
3. **Socket.IO**: Runs on separate VPS server (already configured)
4. **Images**: Will be unoptimized for static export compatibility

## 🔧 **Build Commands**
\`\`\`bash
# Local test build for Cloudflare
npm run build:cloudflare

# Test static export
npm run build:static
\`\`\`

## 📞 **Support**
If you encounter issues:
1. Check Cloudflare Pages build logs
2. Verify environment variables are set correctly
3. Test Socket.IO connection: \`http://147.251.255.227:4001\`
4. Check DNS propagation for custom domain
`;

  fs.writeFileSync('CLOUDFLARE_PAGES_SETUP_GUIDE.md', guide);
  console.log('✅ Created CLOUDFLARE_PAGES_SETUP_GUIDE.md');
}

// Create .cfpagesignore file
function createCfPagesIgnore() {
  const ignore = `# Cloudflare Pages ignore file
node_modules/
.git/
.env*
*.log
.DS_Store
.vscode/
.idea/
coverage/
.nyc_output/
docs/
scripts/
monitoring/
DSLR-System/
*.md
!README.md
`;

  fs.writeFileSync('.cfpagesignore', ignore);
  console.log('✅ Created .cfpagesignore');
}

// Main setup function
function main() {
  try {
    console.log('📋 Reading configuration from env-cloudflare.md...');
    const envVars = readCloudflareEnv();
    console.log(`✅ Found ${Object.keys(envVars).length} environment variables\n`);
    
    console.log('🔧 Creating Cloudflare configuration files...');
    createWranglerConfig();
    createCfPagesIgnore();
    createDeploymentGuide();
    
    console.log('\n🎉 Cloudflare Pages setup complete!\n');
    
    console.log('📋 Next steps:');
    console.log('1. Read CLOUDFLARE_PAGES_SETUP_GUIDE.md for detailed instructions');
    console.log('2. Go to Cloudflare Dashboard > Pages');
    console.log('3. Create new project and connect to GitHub');
    console.log('4. Configure environment variables from env-cloudflare.md');
    console.log('5. Setup custom domain: hafiportrait.photography');
    console.log('6. Deploy and test!\n');
    
    console.log('🔗 Useful commands:');
    console.log('- pnpm run build:cloudflare  # Test build locally');
    console.log('- pnpm run build:static      # Test static export');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
main();