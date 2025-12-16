# Epic 1: Foundation & Core Infrastructure

**Epic Goal**: Establish project foundation dengan repository setup, development environment configuration, basic authentication system untuk admin, CI/CD pipeline, dan simple deployable landing page sebagai proof-of-concept. Epic ini memastikan tim dapat develop, test, dan deploy dengan confidence sambil delivering initial user-visible artifact.

---

## Story 1.1: Project Initialization & Repository Setup

**As a** developer,  
**I want** a properly initialized project repository dengan clear structure dan development tooling,  
**so that** team dapat mulai development dengan standards yang consistent dan environment yang reproducible.

### Acceptance Criteria

1. Repository initialized dengan monorepo structure (menggunakan pnpm workspaces, npm workspaces, atau yarn workspaces)
2. Project structure mencakup `/apps/backend`, `/apps/frontend`, dan `/packages/shared` directories
3. `.gitignore` configured untuk exclude `node_modules`, `.env`, build artifacts, dan IDE-specific files
4. `README.md` exists dengan project overview, setup instructions, dan development commands
5. Package manager lockfile committed (pnpm-lock.yaml, package-lock.json, atau yarn.lock)
6. EditorConfig atau Prettier configured untuk code formatting consistency
7. ESLint configured dengan recommended rules untuk code quality
8. Git hooks setup dengan Husky untuk pre-commit linting dan formatting
9. Environment variable template (`.env.example`) created dengan required variables documented

---

## Story 1.2: Backend Application Bootstrap

**As a** developer,  
**I want** a functioning backend application dengan basic server setup dan health check endpoint,  
**so that** backend infrastructure siap untuk feature development dan dapat di-deploy untuk testing.

### Acceptance Criteria

1. Backend framework initialized (Express.js atau FastAPI) dengan TypeScript/Python type safety
2. Server runs pada configurable port dari environment variables (default: 3000 atau 8000)
3. Basic middleware configured: CORS, body parser, request logging (Winston/Pino atau Python logging)
4. Health check endpoint `/api/health` returns 200 status dengan response `{ "status": "ok", "timestamp": "<ISO-timestamp>" }`
5. Environment variable loading configured dengan validation untuk required variables
6. Error handling middleware catches dan formats errors consistently
7. Database connection setup (PostgreSQL) dengan connection pooling configured
8. Database migration tool setup (TypeORM migrations, Prisma, Alembic, atau Knex.js)
9. Unit test setup dengan testing framework (Jest, Vitest, atau pytest) - includes sample test untuk health endpoint
10. Backend dapat start successfully dengan `npm run dev` atau `pnpm dev` command

---

## Story 1.3: Database Schema Foundation

**As a** developer,  
**I want** initial database schema dengan core tables untuk users dan events,  
**so that** application memiliki data persistence foundation untuk subsequent features.

### Acceptance Criteria

1. Database migration created untuk `users` table dengan fields: id (UUID/SERIAL), email (unique), password_hash, name, role (enum: admin, client), created_at, updated_at
2. Database migration created untuk `events` table dengan fields: id (UUID/SERIAL), name, slug (unique), client_id (FK to users), access_code (unique), qr_code_url, storage_duration_days (default 30), status (enum: draft, active, archived), created_at, updated_at, expires_at
3. Proper indexes created: users.email, events.slug, events.access_code untuk query performance
4. Foreign key constraints configured dengan appropriate ON DELETE behavior
5. Migration dapat run successfully dengan `npm run migrate` atau equivalent command
6. Rollback migration exists dan tested untuk schema reversibility
7. Database connection test passes sebelum application start (connection pool validated)
8. Seeds file created untuk development dengan 1 sample admin user (email: admin@hafiportrait.com, password: admin123)

---

## Story 1.4: Admin Authentication System

**As an** admin/photographer,  
**I want** to login dengan email dan password,  
**so that** saya dapat securely access admin dashboard dan management features.

### Acceptance Criteria

1. POST `/api/auth/login` endpoint accepts `{ "email": string, "password": string }` dan returns JWT token + user data
2. Password hashing implemented dengan bcrypt (cost factor 10) atau argon2
3. JWT token generation dengan payload containing user_id, email, role, dan exp (24 hours expiration)
4. JWT token returned sebagai httpOnly secure cookie DAN in response body untuk flexibility
5. Input validation: email format validation, password minimum 6 characters
6. Error responses: 400 untuk invalid input, 401 untuk invalid credentials, 500 untuk server errors
7. POST `/api/auth/logout` endpoint clears authentication cookie dan returns success response
8. Authentication middleware created untuk protecting routes - validates JWT dan attaches user to request context
9. GET `/api/auth/me` protected endpoint returns current authenticated user data (id, email, name, role)
10. Unit tests cover: successful login, failed login (wrong password), failed login (user not exists), token validation

---

## Story 1.5: Frontend Application Bootstrap

**As a** developer,  
**I want** a functioning frontend application dengan routing dan basic layout,  
**so that** UI development dapat proceed dengan proper foundation dan navigation structure.

### Acceptance Criteria

1. Frontend framework initialized (React + Vite atau Next.js) dengan TypeScript
2. Routing setup (React Router atau Next.js pages) dengan routes: `/`, `/admin/login`, `/admin/dashboard`
3. Basic layout component created dengan header, main content area, dan footer placeholders
4. Tailwind CSS atau styled-components configured untuk styling dengan theme colors (#A7EBF2, #54ACBF, #26658C, #023859, #011C40)
5. API client utility configured untuk making backend requests (axios atau fetch wrapper) dengan base URL dari environment variable
6. Environment variable setup untuk VITE_API_URL atau NEXT_PUBLIC_API_URL
7. Dev server runs pada port 5173 (Vite) atau 3000 (Next.js) dengan hot reload working
8. Build command produces optimized production bundle
9. Simple placeholder home page rendered dengan text "Hafiportrait Photography Platform - Coming Soon"
10. 404 page component created untuk handling invalid routes

---

## Story 1.6: Admin Login Page UI

**As an** admin/photographer,  
**I want** a professional login page interface,  
**so that** saya dapat login ke admin dashboard dengan smooth user experience.

### Acceptance Criteria

1. Login page accessible via `/admin/login` route
2. Form contains email input field (type="email") dengan proper label dan placeholder
3. Form contains password input field (type="password") dengan proper label, placeholder, dan toggle visibility button
4. Submit button displays "Login" text dan shows loading state (spinner + "Logging in...") during authentication
5. Form validation: client-side validation untuk email format dan required fields sebelum submission
6. Successful login redirects to `/admin/dashboard` dan stores JWT token (localStorage atau cookie)
7. Failed login displays error message below form: "Invalid email or password" dengan red color (#EF4444)
8. Form accessible via keyboard (Tab navigation, Enter to submit)
9. Mobile responsive: form width 100% dengan max-width 400px, proper spacing untuk touch targets (min 44px)
10. Loading state disables form inputs dan submit button untuk prevent double submission
11. Logo atau brand name "Hafiportrait" displayed di top of form

---

## Story 1.7: Protected Route & Admin Dashboard Placeholder

**As an** admin/photographer,  
**I want** authentication protection untuk admin routes,  
**so that** unauthorized users cannot access admin features dan saya dapat see basic dashboard setelah login.

### Acceptance Criteria

1. Protected route wrapper/component created yang validates authentication token existence
2. Unauthenticated users accessing `/admin/dashboard` atau admin routes redirected to `/admin/login`
3. Authentication check dilakukan on route mount dengan call to `/api/auth/me` endpoint
4. Invalid atau expired token triggers automatic logout dan redirect to login
5. Admin dashboard page (`/admin/dashboard`) renders dengan welcome message: "Welcome, [Admin Name]!"
6. Dashboard displays navigation sidebar atau top nav dengan links: Dashboard, Events, Portfolio, Analytics, Logout
7. Logout button triggers call to logout endpoint, clears stored token, dan redirects to `/admin/login`
8. Dashboard main content area shows placeholder message: "Dashboard features coming soon"
9. Mobile responsive: navigation collapses to hamburger menu pada screens < 768px
10. Loading state displayed saat authentication check in progress

---

## Story 1.8: CI/CD Pipeline Setup

**As a** developer,  
**I want** automated CI/CD pipeline untuk testing dan deployment,  
**so that** code quality terjaga dan deployment ke production environment dapat automated dan reliable.

### Acceptance Criteria

1. GitHub Actions atau GitLab CI workflow file created (`.github/workflows/ci.yml` atau `.gitlab-ci.yml`)
2. CI pipeline runs on push to `main` branch dan on pull requests
3. CI steps include: dependencies installation, linting check, unit test execution untuk backend dan frontend
4. CI fails jika any test fails atau linting errors exist
5. CD pipeline setup untuk deploy to staging environment (dapat simple VPS atau cloud platform)
6. CD triggers automatically setelah CI passes pada `main` branch
7. Deployment script included untuk building backend dan frontend, running migrations, dan restarting services
8. Environment variables configured securely di CI/CD platform (GitHub Secrets atau GitLab CI/CD Variables)
9. Deployment success notification configured (dapat Slack, email, atau Discord webhook)
10. Rollback procedure documented dalam README untuk emergency situations

---

## Story 1.9: Simple Landing Page Deployment

**As a** visitor,  
**I want** to see a simple landing page saat mengakses platform URL,  
**so that** saya tahu website is live dan dapat melihat basic information tentang photography service.

### Acceptance Criteria

1. Landing page route `/` accessible dan renders without errors
2. Hero section displays brand name "Hafiportrait", tagline: "Instant Wedding Photo Gallery Platform"
3. Hero section includes brief description (2-3 sentences) tentang service offering
4. CTA button "View Portfolio" (currently links to placeholder) displayed prominently di hero section
5. Page includes placeholder section untuk "Our Services" dengan text: "Professional wedding photography services - Coming Soon"
6. Footer displays: "© 2024 Hafiportrait. All rights reserved." dan social media icon placeholders
7. Mobile responsive: hero section stacks vertically, font sizes adjust untuk readability
8. Page uses brand color palette (#54ACBF untuk primary CTA, #011C40 untuk footer background)
9. Meta tags configured untuk SEO: title "Hafiportrait - Wedding Photography Platform", description, viewport
10. Page successfully deployed ke production/staging environment dan accessible via public URL
11. HTTPS configured untuk security

---

**Epic 1 Status**: Ready untuk Development  
**Estimated Effort**: 3-4 development days  
**Dependencies**: None  
**Success Metrics**: All stories completed, CI/CD green, landing page accessible via public URL, admin dapat login
