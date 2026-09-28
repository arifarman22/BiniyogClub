# Biniyog Club — Development Roadmap

## Phase 0 — Foundation ✅
*Project scaffolding, tooling, and architecture setup.*

- [x] Next.js 16 + TypeScript + Tailwind CSS v4
- [x] shadcn/ui component library
- [x] Prisma ORM + PostgreSQL schema (User, Session, VerificationToken)
- [x] Environment variable validation (Zod)
- [x] Auth utilities: bcrypt, JWT, HttpOnly cookies
- [x] Email service abstraction (nodemailer)
- [x] Object storage abstraction layer
- [x] TanStack Query provider
- [x] ESLint + Prettier configured
- [x] Project documentation (PROJECT.md, ROADMAP.md)

---

## Phase 1 — Authentication & User Management
*Secure, full-featured auth system.*

- [ ] Registration (Investor / Farmer roles)
- [ ] Email verification flow
- [ ] Login with HttpOnly session cookie
- [ ] Logout
- [ ] Forgot password / reset password
- [ ] OTP verification (2FA-ready)
- [ ] Protected route middleware
- [ ] User profile page (view + edit)
- [ ] Role-based layout guards

---

## Phase 2 — Farm Project Listings
*Farmers create projects; investors browse them.*

- [ ] Farm project model (Prisma schema)
- [ ] Farmer: create / edit / publish farm project
- [ ] Image upload via storage abstraction
- [ ] Public project listing page (SEO-optimized)
- [ ] Project detail page
- [ ] Search and filter (crop type, location, return rate)
- [ ] Project status lifecycle (Draft → Active → Funded → Completed)

---

## Phase 3 — Investment Flow
*Core investment mechanics.*

- [ ] Investment model (Prisma schema)
- [ ] Investor: browse and invest in projects
- [ ] Investment confirmation and receipt
- [ ] Investor portfolio dashboard
- [ ] Investment history and status tracking
- [ ] Return schedule display

---

## Phase 4 — Farm Management & Reporting
*Operational tools for farmers.*

- [ ] Farm activity log (planting, irrigation, harvest events)
- [ ] Progress reports with photo evidence
- [ ] Investor-visible update feed per project
- [ ] Harvest reporting and yield tracking
- [ ] Notification system (in-app + email)

---

## Phase 5 — Financial Management
*Returns, payouts, and financial records.*

- [ ] Return calculation engine
- [ ] Payout scheduling and tracking
- [ ] Transaction history
- [ ] Financial summary reports (Recharts dashboards)
- [ ] Export to CSV/PDF

---

## Phase 6 — Admin Panel
*Platform governance and oversight.*

- [ ] Admin dashboard (platform KPIs)
- [ ] User management (verify, suspend, role change)
- [ ] Project approval workflow
- [ ] Dispute management
- [ ] Platform-wide announcements

---

## Phase 7 — Performance & Infrastructure
*Production hardening.*

- [ ] Redis integration (session caching, rate limiting, OTP store)
- [ ] S3/Cloudinary swap-in for object storage
- [ ] API rate limiting middleware
- [ ] Background job queue (email, notifications)
- [ ] Database query optimization and indexing audit
- [ ] Error monitoring (Sentry or equivalent)
- [ ] Logging infrastructure

---

## Phase 8 — Polish & Launch
*Final quality pass before public launch.*

- [ ] Full mobile responsiveness audit
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] SEO audit (metadata, sitemap, robots.txt)
- [ ] Performance audit (Core Web Vitals)
- [ ] Security audit (OWASP Top 10 review)
- [ ] End-to-end test coverage
- [ ] Production deployment pipeline (CI/CD)
- [ ] Documentation for API and onboarding
