# Testing Strategy - Hafiportrait Photography Platform

**Last Updated:** December 2024

---

## Overview

Comprehensive testing strategy untuk memastikan quality, reliability, dan maintainability platform Hafiportrait.

---

## Testing Pyramid

```
           /\
          /  \        E2E Tests (10%)
         /    \       - Critical user flows
        /------\      - Cross-browser testing
       /        \     
      /          \    Integration Tests (30%)
     /            \   - API endpoints
    /--------------\  - Database interactions
   /                \ 
  /                  \ Unit Tests (60%)
 /____________________\- Business logic
                       - Utilities
                       - Components
```

---

## Unit Testing

### Backend Unit Tests (Jest)

```typescript
// apps/api/src/services/__tests__/eventService.test.ts
import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { EventService } from '../eventService';
import { prismaMock } from '../../test/prismaMock';

describe('EventService', () => {
  let eventService: EventService;

  beforeEach(() => {
    eventService = new EventService(prismaMock);
    vi.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      const eventData = {
        slug: 'test-event',
        title: 'Test Event',
        eventDate: new Date('2024-12-25'),
      };

      prismaMock.event.create.mockResolvedValue({
        id: 'uuid',
        ...eventData,
        accessCode: 'ABC123',
        status: 'ACTIVE',
      });

      const result = await eventService.createEvent(eventData);

      expect(result.slug).toBe('test-event');
      expect(result.accessCode).toBeTruthy();
      expect(prismaMock.event.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error for duplicate slug', async () => {
      prismaMock.event.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(
        eventService.createEvent({ slug: 'duplicate' })
      ).rejects.toThrow();
    });
  });

  describe('generateAccessCode', () => {
    it('should generate unique 8-character code', () => {
      const code = eventService.generateAccessCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });
  });
});
```

### Frontend Unit Tests (Vitest + RTL)

```typescript
// apps/web/src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });
});
```

### Hook Testing

```typescript
// apps/web/src/hooks/__tests__/useEventPhotos.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventPhotos } from '../useEventPhotos';
import { photoService } from '../../services/photoService';

vi.mock('../../services/photoService');

describe('useEventPhotos', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('fetches photos successfully', async () => {
    const mockPhotos = [
      { id: '1', filename: 'photo1.jpg' },
      { id: '2', filename: 'photo2.jpg' },
    ];

    vi.mocked(photoService.getEventPhotos).mockResolvedValue({
      photos: mockPhotos,
      pagination: { page: 1, total: 2 },
    });

    const { result } = renderHook(
      () => useEventPhotos('test-event'),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.photos).toHaveLength(2);
    expect(photoService.getEventPhotos).toHaveBeenCalledWith('test-event', undefined);
  });
});
```

---

## Integration Testing

### API Integration Tests (Supertest)

```typescript
// apps/api/src/routes/__tests__/events.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';
import { createTestUser, createTestEvent } from '../../test/factories';

describe('Events API', () => {
  let adminToken: string;
  let testUser: any;

  beforeAll(async () => {
    testUser = await createTestUser({ role: 'ADMIN' });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'password123' });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/admin/events', () => {
    it('should create event with valid data', async () => {
      const eventData = {
        slug: 'integration-test-event',
        title: 'Integration Test Event',
        eventDate: '2024-12-25T10:00:00Z',
        storageDurationMonths: 12,
      };

      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.event.slug).toBe(eventData.slug);
      expect(res.body.data.event.accessCode).toBeTruthy();
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/v1/admin/events')
        .send({ slug: 'test' })
        .expect(401);
    });

    it('should return 400 with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'a' }) // Too short
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events/:slug/public', () => {
    let testEvent: any;

    beforeEach(async () => {
      testEvent = await createTestEvent({ status: 'ACTIVE' });
    });

    it('should return public event info', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${testEvent.slug}/public`)
        .expect(200);

      expect(res.body.data.event.slug).toBe(testEvent.slug);
      expect(res.body.data.event.title).toBe(testEvent.title);
    });

    it('should return 404 for non-existent event', async () => {
      await request(app)
        .get('/api/v1/events/non-existent/public')
        .expect(404);
    });
  });
});
```

### Database Integration Tests

```typescript
// packages/database/src/__tests__/prisma.integration.test.ts
import { PrismaClient } from '@prisma/client';

describe('Database Operations', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        fullName: 'Test User',
        role: 'ADMIN',
      },
    });

    expect(user.id).toBeTruthy();

    const retrieved = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(retrieved?.fullName).toBe('Test User');

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should enforce unique constraints', async () => {
    await prisma.user.create({
      data: {
        email: 'unique@example.com',
        passwordHash: 'hashed',
        fullName: 'Unique User',
        role: 'ADMIN',
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: 'unique@example.com',
          passwordHash: 'hashed',
          fullName: 'Duplicate User',
          role: 'CLIENT',
        },
      })
    ).rejects.toThrow();
  });
});
```

---

## E2E Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/guest-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guest Gallery Access Flow', () => {
  test('should access event with valid code', async ({ page }) => {
    // Navigate to event page
    await page.goto('/budi-ani-wedding');

    // Should see access form
    await expect(page.getByText('Enter Access Code')).toBeVisible();

    // Enter access code
    await page.getByLabel('Access Code').fill('BUDIANI2024');
    await page.getByRole('button', { name: 'Access Gallery' }).click();

    // Should see photo grid
    await expect(page.getByRole('img').first()).toBeVisible();
    await expect(page.getByText('photos')).toBeVisible();
  });

  test('should view photo detail', async ({ page }) => {
    // Assume already accessed gallery
    await page.goto('/budi-ani-wedding');
    await page.getByLabel('Access Code').fill('BUDIANI2024');
    await page.getByRole('button', { name: 'Access Gallery' }).click();

    // Click first photo
    await page.getByRole('img').first().click();

    // Should open modal with large image
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByAltText(/photo/i)).toBeVisible();

    // Should have navigation buttons
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
  });

  test('should like and comment on photo', async ({ page }) => {
    await page.goto('/budi-ani-wedding');
    await page.getByLabel('Access Code').fill('BUDIANI2024');
    await page.getByRole('button', { name: 'Access Gallery' }).click();

    // Open photo detail
    await page.getByRole('img').first().click();

    // Like photo
    const likeButton = page.getByRole('button', { name: /like/i });
    const initialLikes = await likeButton.textContent();
    await likeButton.click();
    await expect(likeButton).not.toHaveText(initialLikes!);

    // Add comment
    await page.getByLabel('Your Name').fill('John Doe');
    await page.getByLabel('Comment').fill('Beautiful photo!');
    await page.getByRole('button', { name: 'Post Comment' }).click();

    // Should show pending message
    await expect(page.getByText(/pending moderation/i)).toBeVisible();
  });

  test('should download photo', async ({ page }) => {
    await page.goto('/budi-ani-wedding');
    await page.getByLabel('Access Code').fill('BUDIANI2024');
    await page.getByRole('button', { name: 'Access Gallery' }).click();

    // Open photo detail
    await page.getByRole('img').first().click();

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.jpg$/i);
  });
});
```

```typescript
// e2e/admin-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@hafiportrait.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/admin');
  });

  test('should create new event', async ({ page }) => {
    await page.getByRole('link', { name: 'Events' }).click();
    await page.getByRole('button', { name: 'New Event' }).click();

    // Fill event form
    await page.getByLabel('Event Slug').fill('test-event-e2e');
    await page.getByLabel('Title').fill('Test Event E2E');
    await page.getByLabel('Event Date').fill('2024-12-31');
    await page.getByLabel('Location').fill('Test Location');

    await page.getByRole('button', { name: 'Create Event' }).click();

    // Should show success message
    await expect(page.getByText(/created successfully/i)).toBeVisible();

    // Should display access code
    await expect(page.getByText(/access code/i)).toBeVisible();
  });

  test('should upload photos to event', async ({ page, context }) => {
    // Navigate to event
    await page.goto('/admin/events/test-event/photos');

    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Upload Photos').click();
    const fileChooser = await fileChooserPromise;

    // Upload test images
    await fileChooser.setFiles([
      'e2e/fixtures/photo1.jpg',
      'e2e/fixtures/photo2.jpg',
    ]);

    // Wait for upload to complete
    await expect(page.getByText('2 photos uploaded')).toBeVisible({ timeout: 10000 });

    // Should display photos in grid
    const photoGrid = page.locator('[data-testid="photo-grid"]');
    await expect(photoGrid.getByRole('img')).toHaveCount(2);
  });

  test('should moderate comments', async ({ page }) => {
    await page.goto('/admin/comments');

    // Should show pending comments
    await expect(page.getByText(/pending/i)).toBeVisible();

    // Approve first comment
    await page.getByRole('button', { name: /approve/i }).first().click();
    await expect(page.getByText(/approved/i)).toBeVisible();

    // Reject second comment
    await page.getByRole('button', { name: /reject/i }).first().click();
    await expect(page.getByText(/rejected/i)).toBeVisible();
  });
});
```

---

## Performance Testing

### Load Testing (k6)

```javascript
// tests/load/event-gallery.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failed requests
  },
};

export default function () {
  // Access event page
  const eventRes = http.get('https://api.hafiportrait.com/v1/events/test-event/public');
  check(eventRes, {
    'event page status 200': (r) => r.status === 200,
    'event page duration < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Get photos
  const photosRes = http.get('https://api.hafiportrait.com/v1/events/test-event/photos', {
    headers: { Cookie: 'guest_session=test-session' },
  });
  check(photosRes, {
    'photos status 200': (r) => r.status === 200,
    'photos has data': (r) => JSON.parse(r.body).data.photos.length > 0,
  });

  sleep(2);
}
```

---

## Test Coverage

### Coverage Configuration

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### Coverage Goals

| Layer | Target | Current |
|-------|--------|---------|
| Backend Services | 85% | - |
| Backend API Routes | 80% | - |
| Frontend Components | 75% | - |
| Frontend Hooks | 80% | - |
| Utilities | 90% | - |

---

## Test Data Management

### Test Fixtures

```typescript
// apps/api/test/fixtures/events.ts
export const eventFixtures = {
  active: {
    slug: 'test-active-event',
    title: 'Test Active Event',
    eventDate: new Date('2024-12-25'),
    status: 'ACTIVE',
    accessCode: 'TEST2024',
  },
  archived: {
    slug: 'test-archived-event',
    title: 'Test Archived Event',
    eventDate: new Date('2023-12-25'),
    status: 'ARCHIVED',
    accessCode: 'OLD2023',
  },
};
```

### Test Factories

```typescript
// apps/api/test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { prisma } from '../../src/lib/prisma';
import bcrypt from 'bcrypt';

export const createTestUser = async (overrides = {}) => {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      passwordHash: await bcrypt.hash('password123', 10),
      fullName: faker.person.fullName(),
      role: 'CLIENT',
      ...overrides,
    },
  });
};

export const createTestEvent = async (overrides = {}) => {
  return prisma.event.create({
    data: {
      slug: faker.helpers.slugify(faker.lorem.words(3)),
      title: faker.lorem.sentence(),
      eventDate: faker.date.future(),
      accessCode: faker.string.alphanumeric(8).toUpperCase(),
      status: 'ACTIVE',
      storageExpiresAt: faker.date.future({ years: 1 }),
      ...overrides,
    },
  });
};
```

---

## CI/CD Testing

### Pre-commit Hooks (Husky)

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ]
  }
}
```

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

**Next:** [Monitoring & Operations](./monitoring.md)
