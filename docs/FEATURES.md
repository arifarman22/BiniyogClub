# Biniyog Club — Feature Reference

## Investor Portal (`/dashboard`)

### Authentication
- Register with name, email, phone, password
- Email verification (link sent via Resend)
- Login with HttpOnly session cookie (7-day expiry)
- Forgot password via OTP (6-digit code, 10-minute expiry, sent to email)
- Password change (requires current password, invalidates all other sessions)
- Logout (single device or all devices)

### Dashboard Home (`/dashboard`)
- Portfolio summary: total invested, expected returns, active investments
- Recent investment activity
- Analytics charts (investment trends, portfolio breakdown)

### Projects (`/dashboard/projects`)
- Browse all FUNDRAISING projects
- Filter by category, return type, duration
- View project details, gallery, financial terms, bank accounts
- Invest directly from project page

### Investment Flow
- Select investment amount (within project min/max)
- Choose payment method: bank transfer or wallet
- **Bank transfer**: upload payment proof (image/PDF), enter transaction reference
- **Wallet**: deducted instantly from wallet balance if sufficient
- Investment receipt number generated on confirmation (BC-XXXXXXXX-XXXX format)
- PDF investment certificate auto-generated after confirmation
- Download certificate button on investments page (forces PDF download)

### Investments (`/dashboard/investments`)
- List all investments with status badges
- Investment detail page with full terms
- Download investment certificate (PDF) for ACTIVE/MATURED/COMPLETED investments
- Status tracking: PENDING → PAYMENT_PENDING → ACTIVE → MATURED → COMPLETED

### Wallet (`/dashboard/wallet`)
- View current balance (BDT)
- Add money (deposit flow)
- Invest from wallet balance
- Request withdrawal (bank transfer or mobile banking)
- Cancel pending withdrawal
- Transaction history with ledger entries

### Transactions (`/dashboard/transactions`)
- Full ledger history: deposits, investments, returns, withdrawals
- Filter by type and date

### KYC (`/dashboard/kyc`)
- Submit KYC with personal details
- Bangladesh address selector (division → district → upazila → post office)
- Upload identity documents (NID, passport, driving license, etc.)
- Track KYC status (NOT_STARTED → SUBMITTED → UNDER_REVIEW → VERIFIED / REJECTED)
- Resubmit after rejection

### Documents (`/dashboard/documents`)
- View all documents owned by the investor
- Download investment receipts (PDF, signed Cloudinary URL)
- Document categories: INVESTMENT_RECEIPT, PAYMENT_RECEIPT, DISTRIBUTION_STATEMENT

### Portfolio (`/dashboard/portfolio`)
- Portfolio analytics and performance overview
- Investment breakdown by project and status

### Groups (`/dashboard/groups`)
- View available business groups (MARINERS, MOHS, MARINOZZ)
- Browse group entities and investment tiers
- Submit group investment with payment proof

### Notifications (`/dashboard/notifications`)
- In-app notification feed
- Types: investment confirmed/matured, payment received/failed, KYC approved/rejected, withdrawal approved/completed, distribution posted, system messages

### Profile (`/dashboard/profile`)
- View and edit personal information
- Change password
- Avatar management

### Reports (`/dashboard/reports`)
- Personal investment reports
- Export to CSV

---

## Admin Panel (`/admin`)

### Dashboard (`/admin`)
- Platform KPIs: total investors, total invested, active projects, pending KYC
- Analytics charts: investment volume over time, project funding progress
- Recent activity feed

### Users (`/admin/users`)
- List all users with role and status filters
- View user detail: profile, investments, KYC status, wallet balance
- Suspend / reactivate users
- Change user role
- Soft-delete users

### Investors (`/admin/investors`)
- Investor-specific list with portfolio summaries
- Quick access to investor investments and documents

### Projects (`/admin/projects`)
- List all projects with status filters
- Create new project (full form: title, description, category, financial terms, images, bank accounts)
- Edit project details
- Status transition UI: DRAFT → PENDING_APPROVAL → APPROVED → FUNDRAISING → FUNDED → ACTIVE → COMPLETED / CANCELLED
- Full-width project detail page:
  - Hero banner with cover image
  - KPI strip (funded amount, investor count, days remaining, return %)
  - Image gallery grid
  - Financial details grid
  - Timeline
  - Investments table with totals
  - Bank accounts grid
  - Project updates feed
  - Sidebar: status transition + quick links
- Delete project

### Investments (`/admin/investments`)
- List all investments across all projects
- Approve / reject investments
- Cancel investments
- View investment detail

### Manual Payments (`/admin/payments/manual`)
- Review queue for bank transfer payment proofs
- Approve (activates investment) or reject with reason
- View uploaded proof image/PDF

### Payments (`/admin/payments`)
- Platform-wide payment overview
- Bank account management (platform-level)

### KYC (`/admin/kyc`)
- Review queue for submitted KYC applications
- View submitted documents (signed URLs)
- Approve or reject with review note
- KYC detail page with all submitted information

### Withdrawals (`/admin/withdrawals`)
- List all withdrawal requests
- Approve → Processing → Complete workflow
- Reject with reason

### Distributions (`/admin/distributions`)
- Create distribution rules per project (investor share % + platform fee %)
- Create distribution batches with revenue/expense inputs
- Review calculated line items per investor
- Approve and post batches (writes to ledger)
- Void batches with reason

### Business Groups (`/admin/groups`)
- Manage business groups, entities, and tiers
- View group investments
- Edit group/entity/tier details

### Documents (`/admin/documents`)
- Platform-wide document list
- Filter by category, entity type
- Download any document

### Reports (`/admin/reports`)
- Platform analytics: investment volume, user growth, project performance
- Export to CSV (investments, payments, users)

### Audit Logs (`/admin/audit-logs`)
- Full audit trail of all platform actions
- Filter by actor, action type, entity type, date range

### Notifications (`/admin/notifications`)
- Platform notification management

### Configuration (`/admin/settings`)
- Platform configuration settings

---

## Public Pages

| Page | URL | Description |
|---|---|---|
| Homepage | `/` | Hero, featured projects, how-it-works, calculator, FAQ, metrics, community |
| Projects | `/projects` | Public project listing with filtering |
| Project Detail | `/projects/[slug]` | Full project page with investment form |
| Groups | `/groups` | Business group listings |
| How It Works | `/how-it-works` | Platform explanation |
| About | `/about` | Company information |
| FAQ | `/faq` | Frequently asked questions |
| Blog / Updates | `/updates` | Platform news and updates |
| Contact | `/contact` | Contact form |
| Terms | `/terms` | Terms of service |
| Privacy | `/privacy` | Privacy policy |

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Health check endpoint |
| `/api/documents/[id]/download` | GET | Signed URL redirect for document download |
| `/api/kyc/documents/[key]` | GET | Signed URL for KYC document access |
| `/api/upload/proof` | POST | Upload payment proof file to Cloudinary |
| `/api/locations` | GET | Bangladesh divisions list |
| `/api/locations/districts` | GET | Districts by division |
| `/api/locations/upazilas` | GET | Upazilas by district |
| `/api/locations/postoffices` | GET | Post offices by upazila |
| `/api/reports/export` | GET | CSV export (staff only) |
| `/api/webhooks/payment` | POST | Payment gateway webhook handler |
| `/api/mock-payment/complete` | POST | Mock payment completion (dev only) |
| `/api/admin/backfill-receipts` | POST | Generate receipts for existing investments (SUPER_ADMIN/ADMIN only) |

---

## PDF Investment Certificate

Generated server-side using `@react-pdf/renderer` after investment confirmation.

**Contents:**
- Certificate number (receipt number)
- Issue date
- Investor name, email, phone
- Project title, category, location, return type
- Investment amount (principal)
- Expected return amount and percentage
- Investment duration (days)
- Investment date and maturity date
- Total expected value (principal + return)
- Biniyog Club branding and footer

**Storage:** Cloudinary authenticated resource (`documents/receipts/investment/`)
**Access:** Signed URL with `attachment: true` (forces download)
**Category:** `INVESTMENT_RECEIPT`
**Idempotency:** Skips generation if receipt already exists for the investment

---

## Email Notifications (via Resend)

| Trigger | Recipient | Content |
|---|---|---|
| Registration | Investor | Email verification link |
| Forgot password | Investor | 6-digit OTP code |
| Password changed | Investor | Security notification |
| Investment confirmed | Investor | Investment details |
| KYC approved | Investor | Approval notification |
| KYC rejected | Investor | Rejection reason |
| Withdrawal approved | Investor | Approval notification |
| Withdrawal completed | Investor | Completion notification |

---

## Financial Architecture

### Wallet Types
| Type | Purpose |
|---|---|
| INVESTOR | Per-investor wallet for deposits, investments, returns |
| PLATFORM_ESCROW | Holds investor funds during active projects |
| PLATFORM_REVENUE | Receives platform fees from distributions |

### Ledger Transaction Types
| Type | Description |
|---|---|
| DEPOSIT | Investor adds money to wallet |
| INVESTMENT_FUNDING | Investor funds a project |
| INVESTMENT_RETURN | Return credited to investor wallet |
| PROFIT_DISTRIBUTION | Distribution batch posting |
| PLATFORM_FEE | Fee deducted to platform revenue wallet |
| WITHDRAWAL | Investor withdraws from wallet |
| REFUND | Investment refunded to investor |
| ADJUSTMENT | Manual correction |
| PENALTY | Penalty deduction |

### Payment Methods
- `BANK_TRANSFER` — manual bank transfer with proof upload
- `MOBILE_BANKING` — bKash, Nagad, Rocket
- `CARD` — card payment (gateway)
- `WALLET` — invest directly from platform wallet balance
