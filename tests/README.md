# Hafiportrait Testing Suite

Comprehensive automated testing suite untuk Hafiportrait Photography Platform.

## 📋 Overview

Testing suite ini mencakup:
- **API Testing**: Test semua REST API endpoints
- **Integration Testing**: End-to-end workflow testing
- **E2E Testing**: Browser automation dengan Playwright
- **Performance Testing**: Load testing dan benchmarking
- **Security Testing**: Vulnerability dan penetration testing
- **Mobile Testing**: Responsive design dan mobile UX

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test environment
cp .env.example .env.test

# Setup test database
npm run test:setup
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:api          # API tests only
npm run test:e2e          # E2E tests only
npm run test:integration  # Integration tests
npm run test:performance  # Performance tests
npm run test:security     # Security tests
npm run test:mobile       # Mobile responsive tests

# Watch mode for development
npm run test:api:watch

# Run with coverage
npm run test:coverage
```

## 📁 Directory Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── auth.test.ts
│   ├── admin-events.test.ts
│   ├── gallery.test.ts
│   ├── photo-management.test.ts
│   └── contact.test.ts
├── e2e/                    # End-to-end tests
│   ├── photography-workflow.spec.ts
│   ├── authentication-flow.spec.ts
│   └── guest-experience.spec.ts
├── integration/            # Integration tests
│   └── complete-workflow.test.ts
├── performance/            # Performance tests
│   ├── load-testing.yml
│   ├── processor.js
│   └── api-performance.test.ts
├── security/               # Security tests
│   └── security-tests.test.ts
├── mobile/                 # Mobile responsive tests
│   └── responsive.spec.ts
├── utils/                  # Test utilities
│   ├── test-helpers.ts
│   ├── database-helpers.ts
│   ├── api-client.ts
│   └── screenshot-helpers.ts
├── fixtures/               # Test data
│   └── test-data.ts
└── setup.ts               # Global setup
```

## 🔧 Configuration

### Environment Variables

Create `.env.test` file:

```env
DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="test-secret-key-minimum-32-characters"
JWT_EXPIRATION="24h"
```

### Playwright Configuration

Edit `playwright.config.ts` untuk customize:
- Browser settings
- Viewport sizes
- Timeout durations
- Test reporters

### Vitest Configuration

Edit `vitest.config.ts` untuk customize:
- Test environment
- Coverage settings
- Global setup/teardown

## 📊 Test Reports

### HTML Reports

```bash
# Generate HTML report
npm run test:coverage

# View report
open coverage/index.html
```

### Playwright Reports

```bash
# Generate E2E report
npm run test:e2e

# View report
npx playwright show-report
```

### Artillery Reports

```bash
# Performance test report
npm run test:performance

# Report saved to: artillery-report.json
```

## 🧪 Writing Tests

### API Tests Example

```typescript
import { describe, it, expect } from 'vitest';

describe('API Test', () => {
  it('should return 200', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests Example

```typescript
import { test, expect } from '@playwright/test';

test('User can login', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## 🎯 Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **API Tests**: 100% endpoint coverage
- **E2E Tests**: All critical user flows
- **Performance**: < 1000ms for 95% of requests
- **Security**: Zero critical vulnerabilities

## 🔍 Debugging Tests

### Debug API Tests

```bash
# Run with verbose output
npm run test:api -- --reporter=verbose

# Run specific test file
npm run test:api tests/api/auth.test.ts

# Debug single test
npm run test:api -- -t "should login successfully"
```

### Debug E2E Tests

```bash
# Run in headed mode
npm run test:e2e:headed

# Run with UI mode
npm run test:e2e:ui

# Debug with Playwright Inspector
PWDEBUG=1 npm run test:e2e
```

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check database status
npm run test:setup

# Reset database
npm run test:clean
npm run test:seed
```

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port in test config
PORT=3001 npm run test:e2e
```

### Screenshot/Video Not Generated

```bash
# Clean test-results
rm -rf test-results/

# Run tests again
npm run test:e2e
```

## 📈 Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 500ms | TBD |
| API Response Time (p99) | < 1000ms | TBD |
| Page Load Time | < 3s | TBD |
| Photo Upload | < 5s | TBD |
| Concurrent Users | 100+ | TBD |

## 🔐 Security Testing

Security tests cover:
- ✅ Authentication bypass attempts
- ✅ Authorization vulnerabilities
- ✅ SQL injection prevention
- ✅ XSS attack prevention
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ File upload security

## 📱 Mobile Testing

Mobile tests cover:
- ✅ iPhone 12/13/14
- ✅ Samsung Galaxy S9+
- ✅ Google Pixel 5
- ✅ iPad Pro
- ✅ Touch interactions
- ✅ Responsive breakpoints
- ✅ Mobile performance

## 🤝 Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.spec.ts`
3. Add test data to fixtures if needed
4. Update this README if necessary

### Test Naming Convention

- API tests: `describe('API Name', () => { ... })`
- E2E tests: `test('User can do X', async ({ page }) => { ... })`
- Use descriptive names
- Group related tests

## 📞 Support

Jika ada masalah dengan testing suite:
1. Check troubleshooting section
2. Review test logs
3. Check database connection
4. Verify environment variables

## 🎓 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Descriptive**: Use clear, descriptive test names
4. **Fast**: Keep tests fast and focused
5. **Reliable**: Avoid flaky tests
6. **Maintainable**: Keep tests simple and DRY

## 📝 License

Internal testing suite untuk Hafiportrait Photography Platform.
