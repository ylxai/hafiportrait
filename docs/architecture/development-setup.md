# Development Setup - Hafiportrait Photography Platform

**Last Updated:** December 2024  
**Version:** 1.0 - Next.js 15 Fullstack

---

## Overview

Dokumen ini menjelaskan setup development environment untuk Hafiportrait, termasuk local development, VPS development server, dan best practices untuk development workflow.

---

## Development Environments

### 1. Local Development
**Purpose:** Local coding, unit testing, quick iterations  
**Access:** localhost only  
**Database:** NeonDB development branch atau local PostgreSQL  
**Cost:** Free (except NeonDB if using paid tier)

### 2. VPS Development Server
**Purpose:** Integration testing, client demos, mobile device testing  
**Access:** Public URL (e.g., dev.hafiportrait.com)  
**Database:** NeonDB development branch  
**Cost:** ~$24-36/month (VPS)

### 3. Production (Vercel)
**Purpose:** Live production environment  
**Access:** hafiportrait.com  
**Database:** NeonDB production  
**Cost:** Variable based on usage

---

## Local Development Setup

### Prerequisites

```bash
# Check versions
node --version    # Should be v20.x
pnpm --version    # Should be v8.x
git --version     # Should be v2.40+

# Install Node.js 20 LTS (if needed)
# Using nvm:
nvm install 20
nvm use 20

# Install pnpm (if needed)
npm install -g pnpm

# Install Docker (for Redis)
# Download from: https://www.docker.com/products/docker-desktop
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/hafiportrait/hafiportrait.git
cd hafiportrait

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local

# 4. Edit .env.local dengan text editor
# - NeonDB connection string
# - Cloudflare R2 credentials
# - NextAuth secret
nano .env.local  # or use VS Code: code .env.local
```

### Environment Variables (.env.local)

```bash
# Database - NeonDB (Development Branch)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/hafiportrait_dev?sslmode=require"

# Direct connection untuk migrations
DIRECT_URL="postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/hafiportrait_dev?sslmode=require"

# Redis (Local Docker)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-min-32-characters-long-change-me"

# Cloudflare R2 (Development Bucket)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="hafiportrait-photos-dev"
R2_PUBLIC_URL="https://dev-photos.hafiportrait.com"

# Socket.IO
SOCKET_IO_ENABLED="true"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# Features
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_CDN_URL="https://dev-photos.hafiportrait.com"

# Optional: WhatsApp (can be empty for local dev)
WHATSAPP_API_URL=""
WHATSAPP_API_KEY=""
WHATSAPP_PHONE_NUMBER=""

# Optional: Monitoring (can be empty for local dev)
SENTRY_DSN=""
```

### Start Redis (Docker)

```bash
# Start Redis container
docker run -d \
  --name hafiportrait-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it hafiportrait-redis redis-cli ping
# Should return: PONG
```

### Database Setup

```bash
# 1. Generate Prisma Client
pnpm prisma generate

# 2. Run migrations
pnpm prisma migrate dev --name init

# 3. (Optional) Seed database dengan sample data
pnpm prisma db seed

# 4. (Optional) Open Prisma Studio untuk view data
pnpm prisma studio
# Opens at: http://localhost:5555
```

### Start Development Server

```bash
# Start Next.js development server
pnpm dev

# Server runs at:
# - Application: http://localhost:3000
# - API: http://localhost:3000/api
# - Socket.IO: http://localhost:3000/api/socket
```

### Verify Installation

```bash
# Open browser and test:
# 1. Homepage: http://localhost:3000
# 2. API health: http://localhost:3000/api/health
# 3. Admin login: http://localhost:3000/admin/login

# Test API endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-12-XX...","checks":{...}}
```

---

## VPS Development Setup

### VPS Requirements

**Recommended Providers:**
- DigitalOcean (Droplets)
- Hetzner (Cloud)
- Vultr (Cloud Compute)
- Linode (Linodes)

**Specifications:**
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 80GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Cost:** ~$24-36/month

### Initial Server Setup

```bash
# 1. SSH to VPS
ssh root@your-vps-ip

# 2. Update system
apt update && apt upgrade -y

# 3. Create non-root user
adduser hafiportrait
usermod -aG sudo hafiportrait

# 4. Setup SSH key authentication (recommended)
mkdir -p /home/hafiportrait/.ssh
cp ~/.ssh/authorized_keys /home/hafiportrait/.ssh/
chown -R hafiportrait:hafiportrait /home/hafiportrait/.ssh
chmod 700 /home/hafiportrait/.ssh
chmod 600 /home/hafiportrait/.ssh/authorized_keys

# 5. Switch to new user
su - hafiportrait
```

### Install Dependencies

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version

# Install pnpm
sudo npm install -g pnpm

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Install Nginx (Reverse Proxy)
sudo apt-get install -y nginx

# Install Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Clone and Setup Application

```bash
# 1. Clone repository
cd /home/hafiportrait
git clone https://github.com/hafiportrait/hafiportrait.git
cd hafiportrait

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.development
nano .env.development

# 4. Generate Prisma client
pnpm prisma generate

# 5. Run database migrations
pnpm prisma migrate deploy

# 6. (Optional) Seed database
pnpm prisma db seed

# 7. Build application
pnpm build
```

### Environment Variables (.env.development)

```bash
# Database - NeonDB (Development Branch)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hafiportrait_dev?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hafiportrait_dev?sslmode=require"

# Redis (Local)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="https://dev.hafiportrait.com"
NEXTAUTH_SECRET="production-grade-secret-min-32-chars-very-secure-change-me"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="hafiportrait-photos-dev"
R2_PUBLIC_URL="https://dev-photos.hafiportrait.com"

# Socket.IO
SOCKET_IO_ENABLED="true"
SOCKET_IO_CORS_ORIGIN="https://dev.hafiportrait.com"
NEXT_PUBLIC_SOCKET_URL="https://dev.hafiportrait.com"

# WhatsApp API (Development)
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_API_KEY="your-dev-api-key"
WHATSAPP_PHONE_NUMBER="+6281234567890"

# Features
NEXT_PUBLIC_API_URL="https://dev.hafiportrait.com/api"
NEXT_PUBLIC_CDN_URL="https://dev-photos.hafiportrait.com"

# Monitoring
SENTRY_DSN="your-sentry-dsn-for-dev"
```

### PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'hafiportrait-dev',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOFPM2

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions printed by the command

# Check application status
pm2 status
pm2 logs hafiportrait-dev

# PM2 useful commands:
# pm2 restart hafiportrait-dev
# pm2 stop hafiportrait-dev
# pm2 delete hafiportrait-dev
# pm2 monit
```

### Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hafiportrait-dev

# Paste the following configuration:
```

```nginx
# /etc/nginx/sites-available/hafiportrait-dev

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dev.hafiportrait.com;
    
    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.hafiportrait.com;
    
    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/dev.hafiportrait.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/dev.hafiportrait.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support for Socket.IO
    location /api/socket {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Client max body size (for photo uploads)
    client_max_body_size 50M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hafiportrait-dev /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d dev.hafiportrait.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Verify auto-renewal
sudo certbot renew --dry-run

# Certificates auto-renew via cron
```

### DNS Configuration

**Point your subdomain to VPS IP:**

```
# DNS Records (at your domain registrar)
Type: A
Name: dev
Value: your-vps-ip-address
TTL: 3600
```

Wait for DNS propagation (5-60 minutes), then test:

```bash
# Test DNS resolution
nslookup dev.hafiportrait.com

# Test HTTPS
curl -I https://dev.hafiportrait.com
```

### Firewall Configuration

```bash
# Install UFW (if not already installed)
sudo apt-get install -y ufw

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Development Workflow

### Daily Development Workflow

```bash
# Local Development:
# 1. Pull latest changes
git pull origin main

# 2. Install new dependencies (if any)
pnpm install

# 3. Run migrations (if any)
pnpm prisma migrate dev

# 4. Start dev server
pnpm dev

# 5. Make changes, test locally

# 6. Commit and push
git add .
git commit -m "feat: description of changes"
git push origin feature-branch

# 7. Create Pull Request on GitHub
```

### Deploy to VPS Dev Server

```bash
# SSH to VPS
ssh hafiportrait@your-vps-ip

# Navigate to project
cd ~/hafiportrait

# Pull latest changes
git pull origin main

# Install dependencies (if updated)
pnpm install

# Run migrations (if any)
pnpm prisma migrate deploy

# Rebuild application
pnpm build

# Restart PM2
pm2 restart hafiportrait-dev

# Check logs
pm2 logs hafiportrait-dev --lines 100

# Monitor application
pm2 monit
```

### Automated Deployment Script

```bash
# Create deployment script
cat > deploy-dev.sh << 'EOFDEPLOY'
#!/bin/bash

echo "🚀 Starting deployment to dev server..."

# Pull latest code
echo "📦 Pulling latest changes..."
git pull origin main || exit 1

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install || exit 1

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate deploy || exit 1

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
pnpm prisma generate || exit 1

# Build application
echo "🔨 Building application..."
pnpm build || exit 1

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart hafiportrait-dev || exit 1

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status hafiportrait-dev

echo ""
echo "📝 Recent logs:"
pm2 logs hafiportrait-dev --lines 20 --nostream
EOFDEPLOY

# Make executable
chmod +x deploy-dev.sh

# Usage:
./deploy-dev.sh
```

---

## Database Management

### Prisma Studio (Visual Database Editor)

```bash
# Local development
pnpm prisma studio
# Opens at: http://localhost:5555

# VPS (via SSH tunnel)
ssh -L 5555:localhost:5555 hafiportrait@your-vps-ip
# Then on VPS:
cd ~/hafiportrait
pnpm prisma studio
# Access from local browser: http://localhost:5555
```

### Database Migrations

```bash
# Create new migration (local dev)
pnpm prisma migrate dev --name add_new_field

# Apply migrations (production/VPS)
pnpm prisma migrate deploy

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# View migration status
pnpm prisma migrate status
```

### Database Seeding

```bash
# Seed database dengan sample data
pnpm prisma db seed

# Custom seed script
node prisma/seed.ts
```

### Database Backups

```bash
# Backup NeonDB (via pg_dump)
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql "$DATABASE_URL" < backup_20241215_120000.sql

# NeonDB also has built-in point-in-time recovery
# Access via NeonDB Console
```

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/components/PhotoGrid.test.tsx

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Linting and Formatting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint:fix

# Run Prettier
pnpm format

# Check formatting
pnpm format:check

# Type check
pnpm type-check
```

---

## Troubleshooting

### Common Issues

**1. Port 3000 already in use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

**2. Prisma Client out of sync**
```bash
# Regenerate Prisma Client
pnpm prisma generate
```

**3. Redis connection error**
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker restart hafiportrait-redis
```

**4. NeonDB connection timeout**
```bash
# Check connection string in .env
# Verify DATABASE_URL has ?sslmode=require

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

**5. Next.js build errors**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

**6. PM2 application not starting (VPS)**
```bash
# Check PM2 logs
pm2 logs hafiportrait-dev

# Check environment variables
pm2 env 0

# Restart with fresh logs
pm2 delete hafiportrait-dev
pm2 start ecosystem.config.js
```

**7. Nginx configuration errors**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Debug Mode

```bash
# Enable Next.js debug mode
DEBUG=* pnpm dev

# Enable Prisma query logging
# In prisma/schema.prisma:
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }
# 
# generator client {
#   provider = "prisma-client-js"
#   log      = ["query", "info", "warn", "error"]
# }
```

---

## Useful Commands Cheatsheet

### Development
```bash
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run linter
pnpm format                 # Format code
pnpm test                   # Run tests
```

### Database
```bash
pnpm prisma migrate dev     # Create & apply migration
pnpm prisma migrate deploy  # Apply migrations
pnpm prisma generate        # Generate Prisma Client
pnpm prisma studio          # Open Prisma Studio
pnpm prisma db seed         # Seed database
```

### PM2 (VPS)
```bash
pm2 start ecosystem.config.js    # Start app
pm2 restart hafiportrait-dev     # Restart app
pm2 stop hafiportrait-dev        # Stop app
pm2 logs hafiportrait-dev        # View logs
pm2 monit                        # Monitor app
pm2 status                       # Check status
```

### Git
```bash
git pull origin main             # Pull latest
git checkout -b feature/name     # New branch
git add .                        # Stage changes
git commit -m "message"          # Commit
git push origin feature/name     # Push branch
```

---

## Next Steps

1. ✅ **Setup local development** - Follow local setup guide
2. ✅ **Test locally** - Verify all features working
3. ✅ **Setup VPS** - Configure development server
4. ✅ **Deploy to VPS** - Test on real devices
5. ✅ **Setup CI/CD** - Automate deployments
6. 🔄 **Production deployment** - Deploy to Vercel

---

**Next:** [Deployment Architecture](./deployment.md)
