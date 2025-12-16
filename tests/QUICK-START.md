# 🚀 Quick Start - Testing Hafiportrait

Panduan cepat untuk menjalankan testing suite dalam 5 menit!

## ⚡ 5-Minute Quick Start

### 1. Setup Environment (1 menit)

```bash
# Copy test environment
cp tests/.env.test.example tests/.env.test

# Install Artillery untuk load testing
npm install -D artillery
```

### 2. Setup Database (1 menit)

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:deploy

# Seed test data
npm run test:seed
```

### 3. Start Server (30 detik)

```bash
# Jalankan di terminal terpisah
npm run dev
```

Server harus running di: http://localhost:3000

### 4. Run Quick Tests (2 menit)

```bash
# Quick test untuk verification
./tests/quick-test.sh
```

### 5. Run Full Suite (Optional, 15-20 menit)

```bash
# All tests
npm run test:all

# Atau individual suites
npm run test:api          # ~5 menit
npm run test:security     # ~3 menit
npm run test:integration  # ~2 menit
```

## 📋 Test Commands Cheat Sheet

```bash
# Quick & Essential
./tests/quick-test.sh              # Fast smoke test
npm run test:api                   # API tests only
npm run test:security              # Security tests

# Comprehensive
npm run test:all                   # All unit/integration tests
./tests/run-all-tests.sh           # Complete test suite

# E2E & Visual
npm run test:e2e                   # Browser automation
npm run test:e2e:ui                # Interactive UI mode
npm run test:mobile                # Mobile responsive

# Performance
npm run test:performance           # Load testing
npm run test:performance:api       # API benchmarks

# Development
npm run test:api:watch             # Watch mode
npm run test:coverage              # Coverage report
```

## ✅ Expected Results

### Quick Test Output
```
🚀 Quick Test Runner

🏥 Health Check...
✅ Server healthy

🧪 Running Quick API Tests...
✅ Authentication tests: 11 passed
✅ Contact form tests: 6 passed

✅ Quick tests complete!
```

### Full Suite Output
```
====================================
🧪 Hafiportrait Testing Suite
====================================

📋 Running: API Tests
✅ API Tests: PASSED (55 tests)

📋 Running: Integration Tests
✅ Integration Tests: PASSED (13 tests)

📋 Running: Security Tests
✅ Security Tests: PASSED (14 tests)

====================================
📊 Test Summary
====================================
Total Suites: 3
Passed: 3
Failed: 0
Duration: 180s

✅ All tests passed!
🚀 Platform ready for deployment!
```

## 🐛 Troubleshooting

### Server Not Running
```bash
# Kill existing process
npx kill-port 3000

# Start fresh
npm run dev
```

### Database Connection Error
```bash
# Check DATABASE_URL in .env.test
# Reset database
npm run test:clean
npm run test:seed
```

### Test Failures
```bash
# Run specific test for debugging
npm run test:api tests/api/auth.test.ts

# Check server logs
# Review error messages
```

## 📖 Full Documentation

- **Detailed Guide**: `tests/TESTING-GUIDE.md`
- **Test README**: `tests/README.md`
- **Implementation Summary**: `tests/IMPLEMENTATION-SUMMARY.md`
- **QA Checklist**: `tests/test-checklist.md`

## 🎯 Next Steps

1. ✅ Run quick tests
2. ✅ Review results
3. ✅ Run full suite
4. ✅ Check coverage
5. ✅ Review checklist: `tests/test-checklist.md`

**Happy Testing! 🧪✨**
