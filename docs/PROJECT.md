# Biniyog Club — Project Overview

## Product Overview

Biniyog Club is a production-grade agricultural investment and farm management web platform. It connects investors with farmers, enabling transparent investment in agricultural projects, real-time farm performance tracking, and structured return management.

The platform serves as a trusted marketplace where investors can discover, evaluate, and fund farm projects, while farmers can manage operations, report progress, and communicate with stakeholders.

---

## Target Users

### Investors
Individuals or institutions seeking to invest in agricultural projects. They need clear project listings, financial projections, portfolio dashboards, and return tracking.

### Farmers
Farm operators who list projects, manage day-to-day operations, log activities, upload evidence, and report to investors.

### Admins
Platform administrators who verify users, approve projects, manage disputes, and oversee platform health.

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
| PostgreSQL | Primary relational database |
| Prisma ORM v6 | Type-safe database access and migrations |
| bcryptjs | Password hashing (SALT_ROUNDS=12) |
| jsonwebtoken | JWT signing for session tokens |
| nodemailer | Transactional email delivery |

### Infrastructure (Current + Planned)
| Tool | Status |
|---|---|
| PostgreSQL | Active |
| Redis | Designed for future addition (caching, rate limiting, OTP store) |
| Object Storage (S3/Cloudinary) | Abstracted — local stub in dev, swap in production |

---

## Architecture Philosophy

### Modular Monolith
All code lives in one deployable Next.js application, organized into clearly bounded modules (`auth`, `investments`, `farms`, `users`). No premature microservice splits.

### Server-First
Prefer React Server Components, Server Actions, and server-side data fetching. Client components are used only where interactivity requires it.

### Secure by Default
- HttpOnly cookies for session tokens — no JWT in localStorage
- Passwords hashed with bcrypt (12 rounds)
- Environment variables validated at startup with Zod
- Role-based authorization enforced at the server layer
- Email verification required before access

### Clean Separation of Concerns
```
src/
  app/          # Next.js routes (pages, layouts, API handlers)
  components/   # UI components (ui/, layout/, shared/)
  lib/          # Core business logic (auth/, db/, email/, storage/, validations/)
  hooks/        # Custom React hooks (client-side)
  types/        # Shared TypeScript types
  config/       # App configuration and env validation
prisma/         # Schema and migrations
docs/           # Project documentation
```

### OTP-Ready Auth Architecture
The `VerificationToken` model supports `EMAIL_VERIFICATION`, `PASSWORD_RESET`, and `OTP` token types. The email service includes OTP email templates. Plugging in OTP flows requires no schema changes.

---

## Development Principles

1. **Type everything** — no `any`, strict TypeScript throughout
2. **Validate at boundaries** — Zod schemas on all external inputs (forms, API, env)
3. **Fail fast** — env validation throws at startup, not at runtime
4. **Mobile-first** — all UI designed for small screens first
5. **Accessible** — shadcn/ui components are ARIA-compliant by default
6. **SEO-friendly** — metadata API used on all public pages
7. **No unnecessary dependencies** — every package must earn its place
8. **Consistent error handling** — `ApiResponse<T>` envelope on all route handlers
