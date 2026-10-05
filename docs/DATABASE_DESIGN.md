# Biniyog Club — Database Design

## Overview

PostgreSQL on Neon (serverless). Prisma ORM v6. All tables use UUID primary keys. Financial integrity is enforced through a double-entry ledger — balances are never the sole source of truth.

---

## Connection Architecture

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection via PgBouncer — used by the app at runtime |
| `DATABASE_URL_UNPOOLED` | Direct connection — used by `prisma migrate` and `prisma db push` |

---

## Design Principles

1. **UUID primary keys** on every table — safe for distributed inserts, no sequential enumeration
2. **Double-entry ledger** — every money movement creates one `LedgerTransaction` and two `LedgerEntry` rows (DEBIT + CREDIT). `Wallet.cachedBalance` is a read-optimised snapshot; authoritative balance is always `SUM(credits) - SUM(debits)` from `ledger_entries`
3. **Soft delete only where justified** — `User` and `Project` carry `deletedAt`. All other entities use status fields or cascade deletes
4. **Append-only tables** — `AuditLog`, `LedgerEntry`, `LedgerTransaction`, `DocumentAuditLog` are never mutated after insert
5. **Status-driven lifecycles** — `Project`, `Investment`, `Payment`, `KYC`, `Withdrawal`, `InvestmentContract` all have explicit status enums with defined transitions
6. **Document FK constraint** — `Document.entityId` is a hard FK to `Project.id` regardless of `entityType` value. All documents must reference a valid project
7. **Decimal precision** — all BDT amounts use `Decimal(14,2)`. Return percentages use `Decimal(6,4)`. Plot sizes use `Decimal(10,2)`
8. **Indexes on every FK and every filterable column** — status, createdAt, role, slug, idempotencyKey

---

## Entity Groups

### 1. Auth & Identity
`users` · `sessions` · `verification_tokens` · `permissions` · `role_permissions`

### 2. Profiles & KYC
`investor_profiles` · `kyc` · `kyc_documents`

### 3. Business Groups
`business_groups` · `group_entities` · `group_tiers` · `group_investments` · `group_investment_payments`

### 4. Projects
`projects` · `project_updates` · `project_bank_accounts`

### 5. Investments
`investments` · `investment_contracts` · `profit_distributions` · `manual_payment_submissions` · `gateway_payments` · `webhook_events`

### 6. Financial / Wallet
`wallets` · `wallet_snapshots` · `ledger_transactions` · `ledger_entries` · `payments` · `withdrawals` · `bank_accounts`

### 7. Distributions
`distribution_rules` · `distribution_batches` · `distribution_line_items`

### 8. Platform
`documents` · `document_audit_logs` · `notifications` · `audit_logs`

---

## All Models

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | String UNIQUE | |
| passwordHash | String | bcrypt, never returned |
| name | String | |
| phone | String? UNIQUE | |
| role | UserRole | SUPER_ADMIN, ADMIN, FINANCE_OFFICER, PROJECT_MANAGER, KYC_OFFICER, SUPPORT, INVESTOR |
| status | UserStatus | ACTIVE, SUSPENDED, DEACTIVATED |
| avatarUrl | String? | |
| emailVerified | Boolean | default false |
| phoneVerified | Boolean | default false |
| deletedAt | DateTime? | soft delete |
| createdAt / updatedAt | DateTime | |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK → users | cascade delete |
| token | String UNIQUE | 64-char hex, 256-bit entropy |
| userAgent | String? | |
| ipAddress | String? | |
| expiresAt | DateTime | 7 days from creation |
| createdAt | DateTime | |

### `verification_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK → users | cascade delete |
| token | String UNIQUE | 64-char hex |
| type | VerificationTokenType | EMAIL_VERIFICATION, PASSWORD_RESET, OTP |
| expiresAt | DateTime | 24h (email), 1h (reset), 10min (OTP) |
| usedAt | DateTime? | single-use enforcement |
| createdAt | DateTime | |

### `permissions` / `role_permissions`
DB-backed permission matrix. `role_permissions` maps `UserRole → Permission.key`. `SUPER_ADMIN` bypasses DB entirely at runtime.

### `kyc`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK → users UNIQUE | one per user |
| status | KycStatus | NOT_STARTED, SUBMITTED, UNDER_REVIEW, VERIFIED, REJECTED, RESUBMISSION_REQUIRED |
| fullName, dateOfBirth, nationality | | personal details |
| presentAddress / permanentAddress | | full BD address with division/district/upazila/postOffice/postalCode |
| documentType | KycDocumentType? | NATIONAL_ID, PASSPORT, DRIVING_LICENSE, etc. |
| documentNumber | String? | |
| bankName, bankAccountNumber | String? | |
| mobileProvider, mobileNumber | String? | |
| submittedAt, reviewedAt, reviewedBy, reviewNote, expiresAt | | review workflow |

### `kyc_documents`
Stores uploaded KYC files. `storageKey` is the Cloudinary public_id. Cascade-deleted with KYC record.

### `investor_profiles`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK → users UNIQUE | |
| nationalId | String? UNIQUE | |
| nomineeNationalId, nomineeRelation | String? | |
| dateOfBirth | DateTime? | |
| address, city, country | | |
| occupation, annualIncomeRange, investmentExperience, riskTolerance | String? | |

### `business_groups`
Top-level investment groups (e.g. MARINERS, MOHS, MARINOZZ). Each group has `GroupEntity` children, which have `GroupTier` investment tiers.

### `group_tiers`
| Column | Type | Notes |
|---|---|---|
| type | TierType | INVESTOR, SHAREHOLDER, DIRECTORSHIP, PLOT_BOOKING, LAND_SHARE |
| minAmountBdt / maxAmountBdt | Decimal | investment range |
| plotSizeSqft, pricePerSqftBdt | Decimal? | for plot-based tiers |
| totalUnits, availableUnits | Int? | unit tracking |
| expectedReturnPct, durationMonths | | return terms |

### `group_investments`
Investor participation in a group tier. Has `GroupInvestmentPayment` children for manual payment proof submissions.

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title, slug | String | slug is URL-safe unique identifier |
| description | String | |
| category | ProjectCategory | REAL_ESTATE, TRADE_FINANCE, SME, TECHNOLOGY, INFRASTRUCTURE, OTHER |
| status | ProjectStatus | DRAFT → PENDING_APPROVAL → APPROVED → FUNDRAISING → FUNDED → ACTIVE → COMPLETED / CANCELLED |
| fundingGoalBdt, fundingMinBdt, fundedAmountBdt | Decimal | |
| minInvestmentBdt, maxInvestmentBdt | Decimal | per-investor limits |
| returnType | ReturnType | FIXED_RETURN, PROFIT_SHARE, HYBRID |
| expectedReturnPct, returnPctMin, returnPctMax | Decimal | |
| durationDays | Int | |
| fundingDeadline, startDate, endDate | DateTime | |
| coverImageUrl | String? | |
| imageUrls | String[] | gallery images |
| location, riskInfo | String? | |
| managerId | UUID FK → users? | assigned project manager |
| groupId | UUID FK → business_groups? | optional group association |
| deletedAt | DateTime? | soft delete |

### `project_updates`
Timestamped updates posted to a project. Types: GENERAL, MILESTONE, ISSUE, FINANCIAL_REPORT.

### `project_bank_accounts`
Per-project bank accounts for manual payment submissions. Cascade-deleted with project.

### `bank_accounts`
Platform-level bank accounts (not project-specific). Used for group investment payments.

### `investments`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| investorProfileId | UUID FK → investor_profiles | |
| projectId | UUID FK → projects | |
| status | InvestmentStatus | PENDING → PAYMENT_PENDING → ACTIVE → MATURED / COMPLETED / CANCELLED / REFUNDED |
| amountBdt, expectedReturnBdt, actualReturnBdt | Decimal | |
| returnType | ReturnType | |
| receiptNumber | String? UNIQUE | e.g. BC-XXXXXXXX-XXXX |
| idempotencyKey | String? UNIQUE | prevents duplicate investments |
| confirmedAt, activatedAt, maturedAt, cancelledAt, completedAt, refundedAt | DateTime? | lifecycle timestamps |

### `investment_contracts`
One per investment. Tracks contract status (DRAFT → SENT → SIGNED / EXPIRED / VOIDED), template version, terms JSON, and signing metadata.

### `manual_payment_submissions`
Investor-uploaded payment proof for bank transfer investments. Reviewed by Finance Officers.

| Column | Type | Notes |
|---|---|---|
| investmentId | UUID FK → investments | |
| submittedBy | UUID | investor user id |
| status | ManualPaymentStatus | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED |
| amountBdt | Decimal | |
| paymentMethod | String | BANK_TRANSFER, MOBILE_BANKING |
| transactionRef | String | |
| proofFileUrl | String | Cloudinary key |
| bankAccountId | UUID? | which bank account was used |

### `gateway_payments`
Online payment gateway transactions. Tracks provider (e.g. mock), status, idempotency, provider IDs, webhook payload.

### `webhook_events`
Deduplication table for payment webhooks. Unique constraint on `(provider, eventId)` prevents replay attacks.

### `wallets`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| userId | UUID FK → users UNIQUE | one per user |
| type | WalletType | INVESTOR, PLATFORM_REVENUE, PLATFORM_ESCROW |
| cachedBalance | Decimal | display cache only — not authoritative |
| currency | String | default BDT |
| isActive | Boolean | |

### `wallet_snapshots`
Point-in-time balance snapshots after each ledger entry. Used for balance history.

### `ledger_transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| type | LedgerTransactionType | INVESTMENT_FUNDING, INVESTMENT_RETURN, PROFIT_DISTRIBUTION, PLATFORM_FEE, WITHDRAWAL, DEPOSIT, REFUND, PENALTY, ADJUSTMENT |
| investmentId | UUID FK → investments? | |
| referenceId, referenceType | String? | polymorphic reference |
| description | String | |
| amountBdt | Decimal | |
| status | LedgerTxStatus | POSTED, VOIDED |
| idempotencyKey | String? UNIQUE | |
| postedAt | DateTime | |
| voidedAt, voidReason | | for corrections |

### `ledger_entries`
Always created in pairs (DEBIT + CREDIT) per transaction. Immutable after insert.

| Column | Type | Notes |
|---|---|---|
| ledgerTransactionId | UUID FK | |
| walletId | UUID FK → wallets | |
| entryType | LedgerEntryType | DEBIT or CREDIT |
| amountBdt | Decimal | |
| balanceAfterBdt | Decimal | running balance snapshot |

### `payments`
Wallet-level payment records (deposits, withdrawals processed through the wallet).

### `withdrawals`
Investor withdrawal requests. Workflow: PENDING → APPROVED → PROCESSING → COMPLETED / REJECTED / CANCELLED.

### `profit_distributions`
Per-investment profit distribution records. Tracks gross amount, platform fee, and net amount.

### `distribution_rules`
Per-project rule defining `investorSharePct` and `platformFeePct`.

### `distribution_batches`
A batch of distributions for a project. Workflow: DRAFT → PENDING_APPROVAL → APPROVED → POSTED / VOIDED. Stores revenue/expense/net totals and a snapshot of the rule at time of creation.

### `distribution_line_items`
One row per investor per batch. Tracks principal, gross amount, platform fee, net amount, and ledger transaction ID after posting.

### `documents`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| uploadedBy | UUID FK → users | |
| entityType | DocumentEntityType | USER, KYC, PROJECT, INVESTMENT, CONTRACT |
| entityId | UUID FK → projects | **hard FK to projects.id** regardless of entityType |
| category | DocumentCategory | KYC, PROJECT_DOCUMENT, INVESTMENT_AGREEMENT, PAYMENT_RECEIPT, INVESTMENT_RECEIPT, DISTRIBUTION_STATEMENT, HARVEST_REPORT, FARM_DOCUMENT |
| name, description | String | |
| storageKey | String? | Cloudinary public_id |
| mimeType | String | |
| sizeBytes | Int | |
| isPublic | Boolean | |
| isFinalized | Boolean | finalized docs cannot be deleted by non-SUPER_ADMIN |
| templateVersion | String? | for generated PDFs |
| generatedAt | DateTime? | |
| allowedRoles | String[] | role-based access control |
| ownerUserId | String? | investor who owns the document |
| deletedAt | DateTime? | soft delete |

### `document_audit_logs`
Append-only log of UPLOAD, DOWNLOAD, DELETE, GENERATE actions on documents.

### `notifications`
In-app notifications per user. Types cover investment lifecycle, KYC, payments, withdrawals, distributions, and system messages.

### `audit_logs`
Platform-wide audit trail. Records actor, action (CREATE/UPDATE/DELETE/APPROVE/REJECT/SUSPEND/ACTIVATE/LOGIN/LOGOUT/EXPORT/VOID), entity type/id, before/after JSON snapshots, IP address.

---

## Lifecycle State Machines

### Project
```
DRAFT → PENDING_APPROVAL → APPROVED → FUNDRAISING → FUNDED → ACTIVE → COMPLETED
                                                   ↘ CANCELLED (at any stage)
```

### Investment
```
PENDING → PAYMENT_PENDING → ACTIVE → MATURED → COMPLETED
        ↘ CANCELLED                ↘ REFUNDED
```

### KYC
```
NOT_STARTED → SUBMITTED → UNDER_REVIEW → VERIFIED
                                       ↘ REJECTED → SUBMITTED (resubmit)
                                       ↘ RESUBMISSION_REQUIRED
              VERIFIED → (expiresAt passes)
```

### Manual Payment
```
SUBMITTED → UNDER_REVIEW → APPROVED
                          ↘ REJECTED
```

### Withdrawal
```
PENDING → APPROVED → PROCESSING → COMPLETED
        ↘ REJECTED
PENDING / APPROVED → CANCELLED
```

### Distribution Batch
```
DRAFT → PENDING_APPROVAL → APPROVED → POSTED
                                     ↘ VOIDED
```

### Investment Contract
```
DRAFT → SENT → SIGNED
             ↘ EXPIRED
DRAFT / SENT → VOIDED
```

---

## Financial Architecture (Double-Entry Ledger)

Every financial event follows this pattern:

```
Event: Investor deposits 10,000 BDT to wallet

LedgerTransaction { type: DEPOSIT, amount: 10000 }
  LedgerEntry { walletId: investor_wallet, entryType: CREDIT, amount: 10000, balanceAfter: X }

Event: Investor funds a project (10,000 BDT)

LedgerTransaction { type: INVESTMENT_FUNDING, amount: 10000 }
  LedgerEntry { walletId: investor_wallet,  entryType: DEBIT,  amount: 10000, balanceAfter: X-10000 }
  LedgerEntry { walletId: escrow_wallet,    entryType: CREDIT, amount: 10000, balanceAfter: Y }
```

**Balance derivation (authoritative):**
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
| User → Wallet | 1:1 | Created on registration |
| User → Kyc | 1:1 | One KYC record per user |
| User → Sessions | 1:N | Multiple devices |
| BusinessGroup → GroupEntity → GroupTier | 1:N:N | Group hierarchy |
| GroupTier → GroupInvestment | 1:N | Investor participations |
| Project → Investment | 1:N | |
| Project → Document | 1:N | All documents FK to a project |
| Investment → ManualPaymentSubmission | 1:N | |
| Investment → GatewayPayment | 1:N | |
| Investment → InvestmentContract | 1:1 | |
| Investment → LedgerTransaction | 1:N | |
| LedgerTransaction → LedgerEntry | 1:2 | Always exactly two entries |
| Wallet → LedgerEntry | 1:N | |
| Wallet → Payment | 1:N | |
| Wallet → Withdrawal | 1:N | |
| Project → DistributionRule | 1:1 | |
| DistributionRule → DistributionBatch | 1:N | |
| DistributionBatch → DistributionLineItem | 1:N | One per investor |

---

## Monetary Precision

| Field type | Precision | Example |
|---|---|---|
| BDT amounts | `Decimal(14,2)` | ৳999,999,999,999.99 |
| Return percentages | `Decimal(6,4)` | 0.1250 = 12.50% |
| Distribution share | `Decimal(10,6)` | 0.333333 |
| Plot sizes | `Decimal(10,2)` | sqft |

---

## Soft Delete Policy

| Table | Soft Delete | Reason |
|---|---|---|
| users | ✅ `deletedAt` | Has investments, wallets, audit history |
| projects | ✅ `deletedAt` | Has investments and financial records |
| documents | ✅ `deletedAt` | Audit trail must be preserved |
| All others | ❌ | Status fields or cascade deletes are sufficient |

---

## Index Summary

| Table | Key Indexes |
|---|---|
| users | email, role, status, deletedAt |
| sessions | token, userId, expiresAt |
| verification_tokens | token, (userId, type) |
| kyc | status, reviewedBy |
| projects | status, category, slug, managerId, groupId, fundingDeadline, deletedAt |
| investments | investorProfileId, projectId, status, idempotencyKey |
| manual_payment_submissions | investmentId, status, submittedBy, createdAt |
| gateway_payments | investmentId, provider, status, idempotencyKey, providerPaymentId |
| ledger_transactions | type, status, investmentId, (referenceId, referenceType), idempotencyKey, postedAt |
| ledger_entries | ledgerTransactionId, walletId, entryType, createdAt |
| payments | walletId, status, direction, idempotencyKey, externalReference |
| withdrawals | walletId, status, idempotencyKey |
| distribution_batches | projectId, status, createdAt |
| distribution_line_items | batchId, investmentId, investorUserId, status |
| documents | (entityType, entityId), uploadedBy, category, ownerUserId, deletedAt |
| notifications | (userId, isRead), (userId, createdAt) |
| audit_logs | actorId, (entityType, entityId), action, createdAt |
| group_investments | tierId, investorUserId, status |
