# Biniyog Club — Project Overview

## Product Overview

Biniyog Club is a production-grade agricultural investment platform built for the Bangladeshi market. It connects investors with agricultural projects, enabling transparent investment, structured return management, KYC verification, wallet-based transactions, and PDF investment certificates.

The platform is live at **https://www.biniyogclub.com**.

---

## Target Users

| User Type | Description |
|---|---|
| Investors | Individuals who browse, fund, and track agricultural investment projects |
| Admins / Staff | Platform operators who manage users, approve projects, verify KYC, process payments, and oversee distributions |

---

## Technology Stack

### Frontend
| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | Full-stack React framework, server-first rendering |
| TypeScript | Static typing across the entire codebase |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Accessible, composable UI component library |
| Lucide React | Consistent icon set |
| TanStack Query | Server state management, caching, background sync |
| React Hook Form + Zod | Form management with schema validation |
| Recharts | Data visualization for dashboards |

### Backend
| Tool | Purpose |
|---|---|
| Next.js Route Handlers | REST-style API endpoints |
| Next.js Server Actions | Mutation-heavy server-side operations |
| PostgreSQL (Neon) | Primary relational database — serverless, pooled via PgBouncer |
| Prisma ORM v6 | Type-safe database access and migrations |
| bcryptjs | Password hashing (12 rounds) |
| Resend | Transactional email delivery |
| Cloudinary | Document and file storage (authenticated private resources) |
| @react-pdf/renderer | Server-side PDF generation for investment certificates |
| Zod | Schema validation on all external inputs |

### Infrastructure
| Tool | Purpose |
|---|---|
| Vercel | Hosting and deployment (auto-deploy from GitHub `main`) |
| Neon PostgreSQL | Serverless PostgreSQL with connection pooling |
| Cloudinary | Private document storage with signed URL access |
| GitHub | Source control — `https://github.com/arifarman22/BiniyogClub.git` |

---

## Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(public)` | `/`, `/projects`, `/about`, `/how-it-works`, `/faq`, `/groups`, `/blog`, `/contact`, `/terms`, `/privacy` | Public-facing marketing and project browsing |
| `(auth)` | `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` | Investor authentication |
| `(staff-auth)` | `/admin/login` | Separate staff login portal |
| `(investor)` | `/dashboard/*` | Investor portal — portfolio, wallet, KYC, documents |
| `(admin)` | `/admin/*` | Admin panel — full platform management |

---

## Architecture Philosophy

### Modular Monolith
All code lives in one deployable Next.js application, organized into clearly bounded modules. No premature microservice splits.

### Server-First
Prefer React Server Components, Server Actions, and server-side data fetching. Client components are used only where interactivity requires it.

### Secure by Default
- HttpOnly cookies for session tokens — no JWT in localStorage
- Passwords hashed with bcrypt (12 rounds)
- Environment variables validated at startup
- Role-based authorization enforced at the server layer
- All documents stored as Cloudinary authenticated resources — signed URLs only

### Clean Separation of Concerns
```
src/
  app/          # Next.js routes (pages, layouts, API handlers)
  components/   # UI components (ui/, layout/, shared/, admin/, auth/, wallet/)
  lib/          # Core utilities (auth/, authz/, db/, email/, financial/, pdf/, storage/)
  server/
    actions/    # Server Actions — thin validation wrappers over services
    data/       # Read-only data fetching functions
    services/   # Business logic (auth, investment, wallet, document, KYC, etc.)
  db/
    repositories/ # Prisma query abstractions per entity
  validations/  # Zod schemas for all inputs
  types/        # Shared TypeScript types
prisma/         # Schema and migrations
docs/           # Project documentation
scripts/        # One-off admin scripts (backfill, seed, delete)
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Database sessions over JWT | Instant revocation, suspend-on-request, logout-all-devices |
| Double-entry ledger | Financial integrity — balance is always derivable from immutable entries |
| Cloudinary authenticated resources | Documents never publicly accessible — all access via signed URLs |
| `entityId` FK to `Project` on `Document` | Schema enforces referential integrity regardless of `entityType` value |
| Server Actions for mutations | Type-safe, no separate API layer needed for most operations |
| `INVESTMENT_RECEIPT` category | Investor-visible certificates stored separately from internal agreements |
| Fire-and-forget PDF generation | Receipt generation does not block the payment confirmation response |
