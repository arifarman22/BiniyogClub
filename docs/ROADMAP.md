# Biniyog Club — Development Roadmap

## Phase 0 — Foundation ✅
- [x] Next.js 16 + TypeScript + Tailwind CSS v4
- [x] shadcn/ui component library
- [x] Prisma ORM + PostgreSQL schema
- [x] Environment variable validation
- [x] Auth utilities: bcrypt, HttpOnly cookies, session management
- [x] Email service (Resend)
- [x] Cloudinary storage abstraction
- [x] TanStack Query provider
- [x] ESLint + Prettier
- [x] Project documentation

---

## Phase 1 — Authentication & User Management ✅
- [x] Investor registration with email verification
- [x] Login with HttpOnly session cookie
- [x] Logout (single device + all devices)
- [x] Forgot password — OTP-based flow via email
- [x] Password change (authenticated)
- [x] Protected route middleware with security headers
- [x] Role-based layout guards
- [x] Separate staff login portal (`/admin/login`)
- [x] Admin login form with separate auth flow
- [x] User profile page (view + edit)
- [x] Timing attack prevention on login
- [x] Email enumeration prevention on forgot password

---

## Phase 2 — KYC System ✅
- [x] KYC submission form with Bangladesh address selector (division/district/upazila/post office)
- [x] Document upload (NID, passport, driving license, etc.)
- [x] KYC status tracking (NOT_STARTED → SUBMITTED → UNDER_REVIEW → VERIFIED / REJECTED)
- [x] Admin KYC review panel with approve/reject actions
- [x] KYC officer role with scoped permissions
- [x] KYC document secure storage (Cloudinary authenticated)
- [x] KYC document signed URL access via `/api/kyc/documents/[key]`

---

## Phase 3 — Project Management ✅
- [x] Project creation form (admin) with all financial fields
- [x] Project status lifecycle (DRAFT → PENDING_APPROVAL → APPROVED → FUNDRAISING → FUNDED → ACTIVE → COMPLETED)
- [x] Project status transition UI (admin)
- [x] Project listing page (public) with filtering
- [x] Project detail page (public) with investment form
- [x] Project card component
- [x] Project updates (GENERAL, MILESTONE, ISSUE, FINANCIAL_REPORT)
- [x] Project bank account management
- [x] Admin project detail — full-width hero, KPI strip, image gallery, investments table, bank accounts, updates
- [x] Project image gallery (multiple images)
- [x] Project categories: REAL_ESTATE, TRADE_FINANCE, SME, TECHNOLOGY, INFRASTRUCTURE, OTHER
- [x] Business group association for projects

---

## Phase 4 — Investment Flow ✅
- [x] Investment creation with idempotency key
- [x] Manual payment submission (bank transfer / mobile banking) with proof upload
- [x] Admin manual payment review (approve/reject)
- [x] Payment confirmation triggers investment activation
- [x] Wallet-based investment (invest directly from wallet balance)
- [x] Investment status tracking (PENDING → PAYMENT_PENDING → ACTIVE → MATURED → COMPLETED)
- [x] Investment receipt number generation (BC-XXXXXXXX-XXXX format)
- [x] Investment contract model
- [x] Admin investment management panel
- [x] Investor investment list with status badges
- [x] Investment detail page

---

## Phase 5 — Wallet System ✅
- [x] Investor wallet (one per user, created on registration)
- [x] Add money to wallet (deposit flow)
- [x] Invest from wallet balance
- [x] Withdrawal request (bank transfer / mobile banking)
- [x] Withdrawal approval workflow (admin)
- [x] Cancel withdrawal (investor)
- [x] Double-entry ledger for all wallet movements
- [x] Wallet balance display (cached + authoritative)
- [x] Transaction history page
- [x] Wallet snapshot history

---

## Phase 6 — Document Management ✅
- [x] Document upload with MIME type validation and per-category size limits
- [x] Cloudinary authenticated storage (private resources)
- [x] Signed URL generation for downloads (5-minute expiry)
- [x] Document audit log (UPLOAD, DOWNLOAD, DELETE, GENERATE)
- [x] Role-based document access control
- [x] Owner-based document access
- [x] Investment receipt PDF generation (`@react-pdf/renderer`)
- [x] Auto-generation of receipt after payment confirmation (manual + wallet flows)
- [x] Download certificate button on investor investments page
- [x] PDF forced download via Cloudinary `attachment` flag
- [x] Admin backfill API for existing investments (`/api/admin/backfill-receipts`)
- [x] Investor documents page (`/dashboard/documents`)
- [x] Admin documents panel

---

## Phase 7 — Admin Panel ✅
- [x] Admin dashboard with platform KPIs and analytics charts
- [x] User management (list, view, suspend, role change, delete)
- [x] Investor management
- [x] Project management (create, edit, approve, publish, status transitions)
- [x] Investment management (list, approve, cancel)
- [x] Manual payment review
- [x] KYC review queue
- [x] Withdrawal management
- [x] Distribution management (rules, batches, line items)
- [x] Business groups management
- [x] Reports and export (CSV)
- [x] Audit logs viewer
- [x] Notifications panel
- [x] Configuration / settings page
- [x] Admin sidebar with grouped navigation

---

## Phase 8 — Business Groups ✅
- [x] Business group model (MARINERS, MOHS, MARINOZZ)
- [x] Group entities and investment tiers
- [x] Tier types: INVESTOR, SHAREHOLDER, DIRECTORSHIP, PLOT_BOOKING, LAND_SHARE
- [x] Group investment flow with manual payment proof
- [x] Group investment management (admin)
- [x] Public groups page

---

## Phase 9 — Distribution System ✅
- [x] Distribution rules per project (investor share % + platform fee %)
- [x] Distribution batch creation with revenue/expense inputs
- [x] Batch approval workflow (DRAFT → PENDING_APPROVAL → APPROVED → POSTED)
- [x] Per-investor line item calculation
- [x] Ledger posting on batch approval
- [x] Distribution statement documents
- [x] Admin distribution management panel

---

## Phase 10 — Public Platform ✅
- [x] Homepage with hero, featured projects, how-it-works, calculator, FAQ, metrics
- [x] About page
- [x] How it works page
- [x] FAQ page
- [x] Contact page
- [x] Blog / updates page
- [x] Privacy policy and terms pages
- [x] Public navbar and footer
- [x] SEO metadata on all public pages
- [x] Sitemap and robots.txt
- [x] JSON-LD structured data

---

## Remaining / Planned

| Item | Priority | Notes |
|---|---|---|
| Rate limiting on auth endpoints | High | No rate limiting on login, register, forgot-password |
| Rate limiting on financial actions | High | No per-user rate limit on investment/withdrawal creation |
| Content Security Policy (CSP) header | Medium | Full CSP not yet configured |
| Withdrawal daily/weekly limits | Medium | No per-user frequency or amount limits beyond balance check |
| Admin action 2FA / re-authentication | Medium | High-privilege actions don't require step-up auth |
| KYC document virus scanning | Low | Files validated by MIME/size but not scanned for malware |
| Email notifications for all events | Medium | Some notification types not yet wired to email sends |
| Mobile push notifications | Low | In-app only currently |
| Redis caching | Low | Architecture ready, not yet implemented |
| End-to-end test coverage | Medium | Unit tests exist; E2E not yet written |
