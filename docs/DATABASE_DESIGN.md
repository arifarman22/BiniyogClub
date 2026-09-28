# Biniyog Club — Database Design

## Overview

PostgreSQL on Neon (serverless). Prisma ORM v6. All tables use UUID primary keys. Financial integrity is enforced through a double-entry ledger — balances are never the sole source of truth.

---

## Connection Architecture

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection via PgBouncer — used by the app at runtime |
| `DATABASE_URL_UNPOOLED` | Direct connection — used by `prisma migrate` and `prisma db push` |

Neon's pooler hostname contains `-pooler`; the direct hostname does not. Both point to the same database.

---

## Design Principles

1. **UUID primary keys** on every table — safe for distributed inserts, no sequential enumeration
2. **Double-entry ledger** — every money movement creates one `LedgerTransaction` and two `LedgerEntry` rows (one DEBIT, one CREDIT). `Wallet.cachedBalance` is a read-optimised snapshot only; the authoritative balance is always `SUM(credits) - SUM(debits)` from `ledger_entries`
3. **Soft delete only where justified** — `User`, `Project`, `Farm` carry a `deletedAt` column. All other entities are hard-deleted or archived via status fields
4. **Append-only tables** — `AuditLog`, `LedgerEntry`, `LedgerTransaction` have no `updatedAt` and are never mutated after insert
5. **Status-driven lifecycles** — `Project`, `Investment`, `Payment`, `KYC`, `Withdrawal`, `CropCycle`, `FieldVisit`, `InvestmentContract` all have explicit status enums with defined transitions
6. **Polymorphic documents** — `Document` uses `entityType + entityId` instead of 20 nullable FK columns
7. **Decimal precision** — all monetary amounts use `Decimal(14,2)` (BDT, up to 999 billion). Coordinates use `Decimal(10,8)` / `Decimal(11,8)`. Yields use `Decimal(12,4)`
8. **Indexes on every FK and every filterable column** — status, createdAt, role, slug, externalReference

---

## Entity Groups

### 1. Auth & Identity
`users` · `sessions` · `verification_tokens` · `permissions` · `role_permissions`

### 2. Profiles & KYC
`investor_profiles` · `farmer_profiles` · `field_officer_profiles` · `kyc` · `kyc_documents`

### 3. Farm & Agriculture
`farms` · `fields` · `crops` · `crop_cycles`

### 4. Projects
`projects` · `project_updates`

### 5. Investments
`investments` · `investment_contracts` · `profit_distributions`

### 6. Financial
`wallets` · `ledger_transactions` · `ledger_entries` · `payments` · `withdrawals`

### 7. Operations
`harvests` · `sales` · `expenses` · `field_visits`

### 8. Platform
`documents` · `notifications` · `audit_logs`

---

## Lifecycle State Machines

### Project
```
DRAFT → REVIEW → APPROVED → FUNDING → ACTIVE → HARVESTING → COMPLETED
                                    ↘ CANCELLED
                          ↘ CANCELLED / FAILED (at any active stage)
```

### Investment
```
PENDING → CONFIRMED → ACTIVE → MATURED
        ↘ CANCELLED           ↘ DEFAULTED
```

### KYC
```
NOT_SUBMITTED → PENDING → UNDER_REVIEW → APPROVED
                                       ↘ REJECTED → PENDING (resubmit)
                          APPROVED → EXPIRED
```

### Payment
```
PENDING → PROCESSING → COMPLETED
                     ↘ FAILED
         COMPLETED → REFUNDED
```

### Withdrawal
```
PENDING → APPROVED → PROCESSING → COMPLETED
        ↘ REJECTED
PENDING / APPROVED → CANCELLED
```

### Investment Contract
```
DRAFT → SENT → SIGNED
             ↘ EXPIRED
DRAFT / SENT → VOIDED
```

### Crop Cycle
```
PLANNED → PLANTED → GROWING → HARVESTING → COMPLETED
                                          ↘ FAILED
```

---

## Financial Architecture (Double-Entry Ledger)

Every financial event follows this pattern:

```
Event: Investor funds a project (10,000 BDT)

LedgerTransaction { type: INVESTMENT_FUNDING, amount: 10000 }
  LedgerEntry { walletId: investor_wallet, entryType: DEBIT,  amount: 10000, balanceAfter: X }
  LedgerEntry { walletId: escrow_wallet,   entryType: CREDIT, amount: 10000, balanceAfter: Y }

Event: Platform fee deducted (500 BDT)

LedgerTransaction { type: PLATFORM_FEE, amount: 500 }
  LedgerEntry { walletId: escrow_wallet,   entryType: DEBIT,  amount: 500, balanceAfter: Y-500 }
  LedgerEntry { walletId: revenue_wallet,  entryType: CREDIT, amount: 500, balanceAfter: Z }
```

**Invariant:** For any closed set of transactions, total DEBITs = total CREDITs.

**Balance derivation:**
```sql
SELECT
  SUM(CASE WHEN entry_type = 'CREDIT' THEN amount_bdt ELSE 0 END) -
  SUM(CASE WHEN entry_type = 'DEBIT'  THEN amount_bdt ELSE 0 END) AS balance
FROM ledger_entries
WHERE wallet_id = $1;
```

`Wallet.cachedBalance` is updated after each transaction as a performance cache. It is never used for financial decisions — only for display.

---

## Key Relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| User → InvestorProfile | 1:1 | Only for INVESTOR role |
| User → FarmerProfile | 1:1 | Only for FARMER role |
| User → FieldOfficerProfile | 1:1 | Only for FIELD_OFFICER role |
| User → Wallet | 1:1 | Created on registration |
| User → Kyc | 1:1 | One KYC record per user |
| FarmerProfile → Farm | 1:N | A farmer can own multiple farms |
| Farm → Field | 1:N | A farm has multiple fields |
| Field → CropCycle | 1:N | A field runs multiple crop cycles over time |
| Project → Investment | 1:N | A project receives many investments |
| Investment → InvestmentContract | 1:1 | One contract per investment |
| Project → ProfitDistribution | 1:N | Distributions per investor per project |
| LedgerTransaction → LedgerEntry | 1:2 | Always exactly two entries |
| Wallet → LedgerEntry | 1:N | All entries for a wallet |
| Document | polymorphic | entityType + entityId references any entity |


---

## ER Diagram

```mermaid
erDiagram
    %% ── Auth & Identity ──────────────────────────────────────────
    users {
        uuid id PK
        string email UK
        string passwordHash
        string name
        string phone UK
        enum role
        enum status
        boolean emailVerified
        boolean phoneVerified
        timestamp deletedAt
        timestamp createdAt
        timestamp updatedAt
    }
    sessions {
        uuid id PK
        uuid userId FK
        string token UK
        string ipAddress
        timestamp expiresAt
        timestamp createdAt
    }
    verification_tokens {
        uuid id PK
        uuid userId FK
        string token UK
        enum type
        timestamp expiresAt
        timestamp usedAt
        timestamp createdAt
    }
    permissions {
        uuid id PK
        string key UK
        string description
    }
    role_permissions {
        uuid id PK
        enum role
        uuid permissionId FK
    }

    %% ── KYC ──────────────────────────────────────────────────────
    kyc {
        uuid id PK
        uuid userId FK UK
        enum status
        timestamp submittedAt
        timestamp reviewedAt
        string reviewedBy
        string rejectionReason
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
    kyc_documents {
        uuid id PK
        uuid kycId FK
        enum documentType
        string documentUrl
        timestamp verifiedAt
        timestamp createdAt
    }

    %% ── Profiles ─────────────────────────────────────────────────
    investor_profiles {
        uuid id PK
        uuid userId FK UK
        string nationalId UK
        date dateOfBirth
        string address
        string country
        string occupation
        timestamp createdAt
        timestamp updatedAt
    }
    farmer_profiles {
        uuid id PK
        uuid userId FK UK
        string nationalId UK
        date dateOfBirth
        string address
        string country
        int yearsExperience
        timestamp createdAt
        timestamp updatedAt
    }
    field_officer_profiles {
        uuid id PK
        uuid userId FK UK
        string employeeId UK
        string region
        timestamp createdAt
        timestamp updatedAt
    }

    %% ── Farm & Agriculture ───────────────────────────────────────
    farms {
        uuid id PK
        uuid farmerProfileId FK
        string name
        enum status
        decimal totalAreaAcres
        string district
        string division
        decimal latitude
        decimal longitude
        timestamp deletedAt
        timestamp createdAt
        timestamp updatedAt
    }
    fields {
        uuid id PK
        uuid farmId FK
        string name
        decimal areaAcres
        enum status
        string soilType
        timestamp createdAt
        timestamp updatedAt
    }
    crops {
        uuid id PK
        string name UK
        enum category
        int growthDays
        timestamp createdAt
    }
    crop_cycles {
        uuid id PK
        uuid fieldId FK
        uuid cropId FK
        uuid projectId FK
        enum status
        timestamp plantedAt
        timestamp expectedHarvestAt
        timestamp actualHarvestAt
        decimal areaAcres
        decimal expectedYieldKg
        decimal actualYieldKg
        timestamp createdAt
        timestamp updatedAt
    }

    %% ── Projects ─────────────────────────────────────────────────
    projects {
        uuid id PK
        uuid farmId FK
        string title
        string slug UK
        enum category
        enum status
        decimal fundingGoalBdt
        decimal fundedAmountBdt
        decimal minInvestmentBdt
        enum returnType
        decimal expectedReturnPct
        int durationDays
        timestamp fundingDeadline
        timestamp startDate
        timestamp endDate
        timestamp deletedAt
        timestamp createdAt
        timestamp updatedAt
    }
    project_updates {
        uuid id PK
        uuid projectId FK
        uuid authorId FK
        enum type
        string title
        string content
        boolean isPublished
        timestamp createdAt
        timestamp updatedAt
    }

    %% ── Investments ──────────────────────────────────────────────
    investments {
        uuid id PK
        uuid investorProfileId FK
        uuid projectId FK
        enum status
        decimal amountBdt
        decimal expectedReturnBdt
        decimal actualReturnBdt
        enum returnType
        timestamp confirmedAt
        timestamp maturedAt
        timestamp createdAt
        timestamp updatedAt
    }
    investment_contracts {
        uuid id PK
        uuid investmentId FK UK
        enum status
        string contractUrl
        json terms
        timestamp signedAt
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
    profit_distributions {
        uuid id PK
        uuid projectId FK
        uuid investmentId FK
        decimal amountBdt
        decimal platformFeeBdt
        decimal netAmountBdt
        timestamp distributedAt
        timestamp createdAt
    }

    %% ── Financial ────────────────────────────────────────────────
    wallets {
        uuid id PK
        uuid userId FK UK
        enum type
        decimal cachedBalance
        string currency
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    ledger_transactions {
        uuid id PK
        enum type
        uuid investmentId FK
        string referenceId
        string referenceType
        string description
        decimal amountBdt
        timestamp createdAt
    }
    ledger_entries {
        uuid id PK
        uuid ledgerTransactionId FK
        uuid walletId FK
        enum entryType
        decimal amountBdt
        decimal balanceAfterBdt
        timestamp createdAt
    }
    payments {
        uuid id PK
        uuid walletId FK
        enum direction
        enum method
        enum status
        decimal amountBdt
        decimal feeBdt
        decimal netAmountBdt
        string externalReference
        json gatewayResponse
        timestamp processedAt
        timestamp createdAt
        timestamp updatedAt
    }
    withdrawals {
        uuid id PK
        uuid walletId FK
        enum status
        decimal amountBdt
        decimal feeBdt
        decimal netAmountBdt
        enum method
        string bankName
        string accountNumber
        timestamp approvedAt
        timestamp completedAt
        timestamp createdAt
        timestamp updatedAt
    }

    %% ── Operations ───────────────────────────────────────────────
    harvests {
        uuid id PK
        uuid projectId FK
        uuid cropCycleId FK
        timestamp harvestedAt
        decimal yieldKg
        string qualityGrade
        string recordedBy
        timestamp createdAt
        timestamp updatedAt
    }
    sales {
        uuid id PK
        uuid projectId FK
        uuid harvestId FK
        string buyerName
        decimal quantityKg
        decimal pricePerKgBdt
        decimal totalAmountBdt
        timestamp soldAt
        timestamp createdAt
        timestamp updatedAt
    }
    expenses {
        uuid id PK
        uuid projectId FK
        uuid cropCycleId FK
        enum category
        string description
        decimal amountBdt
        timestamp incurredAt
        string recordedBy
        timestamp createdAt
        timestamp updatedAt
    }
    field_visits {
        uuid id PK
        uuid projectId FK
        uuid fieldOfficerProfileId FK
        enum status
        timestamp scheduledAt
        timestamp completedAt
        string summary
        string findings
        timestamp createdAt
        timestamp updatedAt
    }

    %% ── Platform ─────────────────────────────────────────────────
    documents {
        uuid id PK
        uuid uploadedBy FK
        enum entityType
        string entityId
        string name
        string fileUrl
        string mimeType
        int sizeBytes
        boolean isPublic
        timestamp createdAt
    }
    notifications {
        uuid id PK
        uuid userId FK
        enum type
        string title
        string body
        json data
        boolean isRead
        timestamp readAt
        timestamp createdAt
    }
    audit_logs {
        uuid id PK
        uuid actorId FK
        enum action
        string entityType
        string entityId
        json before
        json after
        string ipAddress
        timestamp createdAt
    }

    %% ── Relationships ────────────────────────────────────────────
    users ||--o{ sessions : "has"
    users ||--o{ verification_tokens : "has"
    users ||--o| kyc : "has"
    users ||--o| investor_profiles : "has"
    users ||--o| farmer_profiles : "has"
    users ||--o| field_officer_profiles : "has"
    users ||--o| wallets : "has"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "performs"
    users ||--o{ documents : "uploads"

    kyc ||--o{ kyc_documents : "contains"

    role_permissions }o--|| permissions : "grants"

    farmer_profiles ||--o{ farms : "owns"
    farms ||--o{ fields : "contains"
    fields ||--o{ crop_cycles : "runs"
    crops ||--o{ crop_cycles : "used in"

    farms ||--o{ projects : "hosts"
    projects ||--o{ crop_cycles : "includes"
    projects ||--o{ project_updates : "has"
    projects ||--o{ investments : "receives"
    projects ||--o{ profit_distributions : "distributes"
    projects ||--o{ harvests : "produces"
    projects ||--o{ sales : "generates"
    projects ||--o{ expenses : "incurs"
    projects ||--o{ field_visits : "receives"
    projects ||--o{ documents : "has"

    investor_profiles ||--o{ investments : "makes"
    investments ||--o| investment_contracts : "has"
    investments ||--o{ profit_distributions : "receives"
    investments ||--o{ ledger_transactions : "triggers"

    wallets ||--o{ ledger_entries : "records"
    wallets ||--o{ payments : "processes"
    wallets ||--o{ withdrawals : "requests"
    ledger_transactions ||--o{ ledger_entries : "contains"

    crop_cycles ||--o{ harvests : "yields"
    crop_cycles ||--o{ expenses : "incurs"
    harvests ||--o{ sales : "sold via"

    field_officer_profiles ||--o{ field_visits : "conducts"
    field_visits ||--o{ documents : "has"
    project_updates ||--o{ documents : "has"
```

---

## Table Index Summary

| Table | Key Indexes |
|---|---|
| users | email, role, status, deletedAt |
| sessions | token, userId, expiresAt |
| verification_tokens | token, (userId, type) |
| kyc | status |
| farms | farmerProfileId, status, district, deletedAt |
| fields | farmId, status |
| crop_cycles | fieldId, cropId, projectId, status |
| projects | farmId, status, category, slug, fundingDeadline, deletedAt |
| investments | investorProfileId, projectId, status |
| ledger_transactions | type, investmentId, (referenceId, referenceType), createdAt |
| ledger_entries | ledgerTransactionId, walletId, entryType, createdAt |
| payments | walletId, status, direction, externalReference, createdAt |
| withdrawals | walletId, status, createdAt |
| harvests | projectId, cropCycleId, harvestedAt |
| expenses | projectId, cropCycleId, category, incurredAt |
| field_visits | projectId, fieldOfficerProfileId, status, scheduledAt |
| documents | (entityType, entityId), uploadedBy |
| notifications | (userId, isRead), (userId, createdAt) |
| audit_logs | actorId, (entityType, entityId), action, createdAt |

---

## Soft Delete Policy

| Table | Soft Delete | Reason |
|---|---|---|
| users | ✅ `deletedAt` | Has investments, wallets, audit history — cannot hard delete |
| projects | ✅ `deletedAt` | Has investments and financial records attached |
| farms | ✅ `deletedAt` | Has projects and crop cycles attached |
| All others | ❌ | Status fields or cascade deletes are sufficient |

---

## Monetary Precision

All BDT amounts: `Decimal(14, 2)` — supports up to ৳999,999,999,999.99

Platform fee, yield, and price fields use appropriate precision:
- `pricePerKgBdt`: `Decimal(10, 4)` — 4 decimal places for per-unit pricing
- `yieldKg`, `areaAcres`: `Decimal(12, 4)` — agricultural measurements
- `expectedReturnPct`: `Decimal(6, 4)` — e.g. `0.1250` = 12.50%
- GPS coordinates: `Decimal(10, 8)` lat / `Decimal(11, 8)` lng
