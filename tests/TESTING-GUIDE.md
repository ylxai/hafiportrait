# 📘 Panduan Testing Hafiportrait Platform

## 🎯 Tujuan Testing Suite

Testing suite ini dibuat untuk memastikan:
1. **Fungsionalitas** - Semua fitur bekerja sesuai spesifikasi
2. **Keamanan** - Platform aman dari serangan dan vulnerability
3. **Performa** - Response time dan load handling memenuhi target
4. **User Experience** - Interface responsive dan mudah digunakan
5. **Reliabilitas** - Platform stabil dalam berbagai kondisi

## 🚀 Memulai Testing

### 1. Setup Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp tests/.env.test.example tests/.env.test

# Edit .env.test dengan konfigurasi yang sesuai
nano tests/.env.test

# Setup database
npm run prisma:generate
npm run prisma:migrate:deploy

# Seed test data
npm run test:setup
```

### 2. Jalankan Server Development

```bash
# Terminal 1 - Jalankan server
npm run dev

# Server harus running di http://localhost:3000
```

### 3. Jalankan Tests

```bash
# Terminal 2 - Jalankan tests

# Quick test (cepat untuk development)
./tests/quick-test.sh

# Semua tests
npm run test:all

# Individual test suites
npm run test:api           # API tests (5-10 menit)
npm run test:integration   # Integration tests (5 menit)
npm run test:e2e           # E2E tests (10-15 menit)
npm run test:security      # Security tests (5 menit)
npm run test:performance   # Performance tests (5-10 menit)
npm run test:mobile        # Mobile tests (10 menit)
```

## 📋 Test Suites Overview

### 1. API Testing (`tests/api/`)

Test semua REST API endpoints:

**File Tests:**
- `auth.test.ts` - Authentication (login, logout, token validation)
- `admin-events.test.ts` - Event CRUD operations
- `gallery.test.ts` - Public gallery access dan guest features
- `photo-management.test.ts` - Photo upload, delete, restore
- `contact.test.ts` - Contact form submission

**Coverage:**
- ✅ 100% endpoint coverage
- ✅ Success cases
- ✅ Error cases
- ✅ Validation testing
- ✅ Authorization testing

**Jalankan:**
```bash
npm run test:api

# Atau specific file
npm run test:api tests/api/auth.test.ts
```

### 2. Integration Testing (`tests/integration/`)

Test complete workflows end-to-end:

**Scenarios:**
- Complete photography workflow
- Admin → Event → Upload → QR → Guest → Download
- Multi-user interactions
- Database integrity

**Jalankan:**
```bash
npm run test:integration
```

### 3. E2E Testing (`tests/e2e/`)

Browser automation testing dengan Playwright:

**Scenarios:**
- Authentication flow
- Photography workflow
- Guest experience
- Admin dashboard operations

**Jalankan:**
```bash
# Headless mode (default)
npm run test:e2e

# Headed mode (lihat browser)
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui

# Debug mode
PWDEBUG=1 npm run test:e2e
```

### 4. Performance Testing (`tests/performance/`)

Load testing dan performance benchmarking:

**Metrics:**
- API response times
- Concurrent user handling
- Database query performance
- Page load times

**Jalankan:**
```bash
# API performance tests
npm run test:performance:api

# Load testing (Artillery)
npm run test:performance
```

### 5. Security Testing (`tests/security/`)

Security vulnerability testing:

**Tests:**
- Authentication bypass attempts
- Authorization vulnerabilities
- SQL injection prevention
- XSS attack prevention
- CSRF protection
- Rate limiting
- Input validation
- File upload security

**Jalankan:**
```bash
npm run test:security
```

### 6. Mobile Testing (`tests/mobile/`)

Responsive design dan mobile UX:

**Devices:**
- iPhone 12/13/14
- Samsung Galaxy
- Google Pixel
- iPad Pro

**Tests:**
- Responsive breakpoints
- Touch interactions
- Mobile performance
- Form usability

**Jalankan:**
```bash
npm run test:mobile
```

## 📊 Membaca Test Results

### Success Example
```
✓ tests/api/auth.test.ts (5)
  ✓ POST /api/auth/login (2)
    ✓ should login successfully with valid credentials
    ✓ should fail with invalid credentials
  ✓ GET /api/auth/me (2)
    ✓ should get current user
    ✓ should fail without token
```

### Failure Example
```
✗ tests/api/auth.test.ts (1)
  ✗ POST /api/auth/login
    Expected: 200
    Received: 401
    
    Stack trace:
    at tests/api/auth.test.ts:25:8
```

## 🐛 Debugging Failed Tests

### 1. Check Server Logs

```bash
# Lihat server logs untuk errors
# Server harus running di terminal terpisah
```

### 2. Run Specific Test

```bash
# Run single test file
npm run test:api tests/api/auth.test.ts

# Run specific test case
npm run test:api -- -t "should login successfully"
```

### 3. Enable Verbose Output

```bash
# API tests dengan verbose
npm run test:api -- --reporter=verbose

# E2E tests dengan traces
npm run test:e2e -- --trace on
```

### 4. Check Database

```bash
# Verify test data
npm run prisma:studio

# Reset database
npm run test:clean
npm run test:seed
```

## 🎯 Test Coverage

### Current Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **API Tests**: 100% endpoint coverage
- **E2E Tests**: All critical user flows
- **Performance**: 95% requests < 1000ms
- **Security**: Zero critical vulnerabilities

### Generate Coverage Report

```bash
# Run tests dengan coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error

```bash
# Check Postgres running
psql -U test_user -d hafiportrait_test

# Recreate test database
npm run test:setup
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --with-deps

# Clear cache
rm -rf ~/.cache/ms-playwright
```

### Redis Connection Error

```bash
# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7
```

## 📈 Performance Benchmarks

### Target Metrics

| Endpoint | Target | Priority |
|----------|--------|----------|
| POST /api/auth/login | < 500ms | High |
| GET /api/gallery/*/photos | < 1000ms | High |
| POST /api/admin/events | < 500ms | Medium |
| GET /api/admin/dashboard | < 1000ms | Medium |
| Photo Upload | < 5000ms | Medium |

### Measuring Performance

```bash
# Run performance tests
npm run test:performance:api

# Artillery load testing
npm run test:performance

# View report
open artillery-report.html
```

## 🔐 Security Testing Guidelines

### What We Test

1. **Authentication**
   - Token validation
   - Session management
   - Password security

2. **Authorization**
   - Role-based access
   - Resource ownership
   - Permission enforcement

3. **Input Validation**
   - SQL injection
   - XSS attacks
   - File upload validation

4. **Rate Limiting**
   - Login attempts
   - API requests
   - File uploads

### Running Security Tests

```bash
npm run test:security

# Check for specific vulnerabilities
npm run test:security -- -t "SQL injection"
```

## 📱 Mobile Testing Guidelines

### Breakpoints Tested

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Touch Targets

- Minimum size: 44x44px
- Adequate spacing
- Easy to tap on mobile

### Running Mobile Tests

```bash
# All mobile tests
npm run test:mobile

# Specific device
npm run test:e2e -- --project="Mobile Chrome"
```

## 🎓 Best Practices

### Writing Tests

1. **Descriptive Names**: Test names harus jelas
   ```typescript
   it('should login successfully with valid credentials', ...)
   ```

2. **Independent Tests**: Setiap test harus mandiri
   ```typescript
   beforeEach(async () => {
     // Setup fresh state
   });
   ```

3. **Cleanup**: Bersihkan data setelah test
   ```typescript
   afterEach(async () => {
     await cleanupTestData();
   });
   ```

4. **Meaningful Assertions**: Assert yang spesifik
   ```typescript
   expect(response.status).toBe(200);
   expect(data.user.email).toBe('test@example.com');
   ```

### Maintaining Tests

1. **Keep Tests Fast**: Target < 5 detik per test
2. **Avoid Flaky Tests**: Gunakan proper waits
3. **Update Regularly**: Update tests saat ada perubahan
4. **Review Coverage**: Pastikan coverage tetap tinggi

## 📞 Dukungan

Jika ada masalah:
1. Check troubleshooting section
2. Review test logs
3. Verify environment setup
4. Check database connection

## 🎉 Ready for Production?

Sebelum deploy ke production, pastikan:

- [ ] Semua tests passing
- [ ] Coverage > 80%
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Mobile responsive verified
- [ ] Error handling tested

Gunakan checklist di `tests/test-checklist.md`

---

**Happy Testing! 🧪✨**
