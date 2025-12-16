# 📦 Installation & Setup Guide

## Prerequisites

Pastikan sudah terinstall:
- Node.js 20+ 
- PostgreSQL 15+
- Redis 7+
- Git

## Installation Steps

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Install Artillery untuk load testing
npm install -D artillery
```

### 2. Setup Test Environment

```bash
# Copy environment file
cp tests/.env.test.example tests/.env.test

# Edit dengan kredensial yang benar
nano tests/.env.test
```

### 3. Configure Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed test data
npm run test:seed
```

### 4. Verify Installation

```bash
# Start server (terminal 1)
npm run dev

# Run quick test (terminal 2)
./tests/quick-test.sh
```

## Troubleshooting Installation

### Node Version Issues
```bash
# Check version
node --version  # Should be 20+

# Use nvm if needed
nvm install 20
nvm use 20
```

### Database Connection Issues
```bash
# Test database connection
psql -U your_user -d hafiportrait_test

# If fails, check DATABASE_URL in .env.test
```

### Redis Not Running
```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7
```

### Permission Issues
```bash
# Make scripts executable
chmod +x tests/*.sh
```

## Next Steps

After successful installation:
1. Read `tests/QUICK-START.md` for usage
2. Read `tests/TESTING-GUIDE.md` for detailed guide
3. Run full test suite: `npm run test:all`
