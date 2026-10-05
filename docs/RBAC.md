# Biniyog Club — Role-Based Access Control

## Overview

Authorization uses a two-layer model:

1. **Role-Based Access Control (RBAC)** — each role has a set of permissions stored in the DB
2. **Ownership checks** — resource-level IDOR prevention enforced at the service layer

All authorization is enforced **server-side**. Frontend role checks are UI-only and never trusted for security decisions.

---

## Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access. All permissions. Cannot be restricted. Bypasses DB permission lookup entirely. |
| `ADMIN` | Platform administration. User management, project approval, financial oversight. |
| `FINANCE_OFFICER` | Payment verification, withdrawal approval, financial reports, distribution management. |
| `PROJECT_MANAGER` | Project review, approval, publishing, updates. |
| `KYC_OFFICER` | KYC document review and approval. |
| `SUPPORT` | Read-only access to most resources for customer support. |
| `INVESTOR` | Invest in projects, manage own portfolio, request withdrawals, submit KYC. |

---

## Permission Keys

Format: `<resource>.<action>`

### User Management
| Permission | Description |
|---|---|
| `user.view` | View user profiles and lists |
| `user.create` | Create new user accounts |
| `user.update` | Update user profile information |
| `user.delete` | Soft-delete user accounts |
| `user.suspend` | Suspend or reactivate user accounts |
| `user.change_role` | Change a user's role |

### Project Management
| Permission | Description |
|---|---|
| `project.view` | View all projects including drafts |
| `project.create` | Create new projects |
| `project.update` | Update project details |
| `project.delete` | Delete or archive projects |
| `project.approve` | Approve or reject submitted projects |
| `project.publish` | Publish approved projects to investors |

### Investment Management
| Permission | Description |
|---|---|
| `investment.view` | View investments (scoped by ownership at service layer) |
| `investment.create` | Make a new investment |
| `investment.approve` | Approve or confirm investments |
| `investment.cancel` | Cancel an investment |

### Financial
| Permission | Description |
|---|---|
| `payment.view` | View payment records |
| `payment.verify` | Verify and reconcile payments, issue refunds |
| `withdrawal.view` | View withdrawal requests |
| `withdrawal.request` | Request a wallet withdrawal |
| `withdrawal.approve` | Approve or reject withdrawal requests |

### KYC
| Permission | Description |
|---|---|
| `kyc.view` | View KYC submissions |
| `kyc.submit` | Submit own KYC documents |
| `kyc.review` | Review KYC submissions |
| `kyc.approve` | Approve or reject KYC submissions |

### Documents
| Permission | Description |
|---|---|
| `document.view` | View documents |
| `document.upload` | Upload documents |
| `document.download` | Download documents (subject to ownership/role check) |
| `document.manage` | Manage all documents regardless of ownership |
| `document.delete` | Delete documents |

### Platform
| Permission | Description |
|---|---|
| `report.view` | Access platform reports and analytics |
| `audit.view` | View audit logs |

---

## Role → Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | FINANCE | PM | KYC | SUPPORT | INVESTOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| user.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| user.create | ✅ | ✅ | | | | | |
| user.update | ✅ | ✅ | | | | | |
| user.delete | ✅ | ✅ | | | | | |
| user.suspend | ✅ | ✅ | | | | | |
| user.change_role | ✅ | ✅ | | | | | |
| project.view | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ |
| project.create | ✅ | ✅ | | | | | |
| project.update | ✅ | ✅ | | ✅ | | | |
| project.delete | ✅ | ✅ | | | | | |
| project.approve | ✅ | ✅ | | ✅ | | | |
| project.publish | ✅ | ✅ | | ✅ | | | |
| investment.view | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ |
| investment.create | ✅ | | | | | | ✅ |
| investment.approve | ✅ | ✅ | ✅ | | | | |
| investment.cancel | ✅ | ✅ | | | | | ✅ |
| payment.view | ✅ | ✅ | ✅ | | | ✅ | |
| payment.verify | ✅ | ✅ | ✅ | | | | |
| withdrawal.view | ✅ | ✅ | ✅ | | | ✅ | |
| withdrawal.request | ✅ | | | | | | ✅ |
| withdrawal.approve | ✅ | ✅ | ✅ | | | | |
| kyc.view | ✅ | ✅ | | | ✅ | ✅ | |
| kyc.submit | ✅ | | | | | | ✅ |
| kyc.review | ✅ | ✅ | | | ✅ | | |
| kyc.approve | ✅ | ✅ | | | ✅ | | |
| document.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| document.upload | ✅ | ✅ | ✅ | ✅ | ✅ | | ✅ |
| document.download | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| document.manage | ✅ | ✅ | ✅ | | | | |
| document.delete | ✅ | ✅ | | | | | |
| report.view | ✅ | ✅ | ✅ | ✅ | | | |
| audit.view | ✅ | ✅ | | | | | |

---

## Architecture

### Source of Truth

The canonical permission matrix lives in `src/lib/authz/permissions.ts`. The database is seeded from this file. Runtime overrides are possible via the admin panel (adding/removing `role_permissions` rows).

```
src/lib/authz/
  permissions.ts   # PERMISSIONS constants, ROLE_PERMISSIONS matrix, descriptions
  index.ts         # can(), requirePermission(), requireOwnerOrPermission(), canStatic()
  authz.ts         # Barrel export
```

### Request-Scoped Permission Cache

Permissions are fetched from the DB **once per request** and cached in a `WeakMap` keyed by the session object:

```typescript
const permissionCache = new WeakMap<SessionUser, Set<Permission>>();

async function getPermissionsForSession(session: SessionUser): Promise<Set<Permission>> {
  const cached = permissionCache.get(session);
  if (cached) return cached;
  // ... DB query ...
  permissionCache.set(session, perms);
  return perms;
}
```

### SUPER_ADMIN Fast Path

`SUPER_ADMIN` bypasses the DB entirely — `can()` returns `true` immediately without a query.

---

## Usage Patterns

### Server Action — require a permission

```typescript
const session = await requireSession();
await requirePermission(session, PERMISSIONS.PROJECT_APPROVE);
```

### Ownership or permission (IDOR prevention)

```typescript
const investment = await db.investment.findUnique({ where: { id } });
if (!investment) throw new NotFoundError("Investment");
await requireOwnerOrPermission(session, investment.investorUserId, PERMISSIONS.INVESTMENT_VIEW);
```

### Layout — role-based portal guard

```typescript
// (admin)/layout.tsx
const session = await getSession();
if (!session) redirect("/admin/login");
if (!ADMIN_ROLES.includes(session.role)) redirect("/unauthorized");
```

---

## IDOR Prevention

Every resource access that is user-scoped calls `requireOwnerOrPermission()`:

```typescript
// ❌ WRONG — no ownership check
const investment = await db.investment.findUnique({ where: { id } });

// ✅ CORRECT — ownership enforced
const investment = await db.investment.findUnique({ where: { id } });
if (!investment) throw new NotFoundError("Investment");
await requireOwnerOrPermission(session, investment.investorUserId, PERMISSIONS.INVESTMENT_VIEW);
```

For list endpoints, always filter by `userId` for non-staff roles:

```typescript
const investments = await db.investment.findMany({
  where: {
    ...(canViewAll ? {} : { investorProfile: { userId: session.id } }),
  },
});
```

---

## Privilege Escalation Prevention

1. **Role changes require `user.change_role`** — only `SUPER_ADMIN` and `ADMIN` have this
2. **`SUPER_ADMIN` cannot be assigned via the admin panel** — only via direct DB seed
3. **Permissions are checked server-side** — client-side role state is never trusted
4. **Session is re-validated on every request** — suspended users are blocked immediately
5. **`canStatic()` uses the compile-time matrix** — cannot be manipulated at runtime

---

## Document Access Control

Documents have a per-row `allowedRoles` array and `ownerUserId`. Access logic in `getSignedDownloadUrl`:

1. If `doc.isPublic` → allow
2. If `doc.ownerUserId === session.id` → allow (owner)
3. If `session.role` is in `doc.allowedRoles` → allow
4. Otherwise → require `PERMISSIONS.DOCUMENT_MANAGE`

Category-level defaults:

| Category | Allowed Roles |
|---|---|
| KYC | KYC_OFFICER, ADMIN, SUPER_ADMIN |
| PROJECT_DOCUMENT | ADMIN, SUPER_ADMIN, PROJECT_MANAGER, FINANCE_OFFICER, INVESTOR |
| INVESTMENT_RECEIPT | INVESTOR, ADMIN, SUPER_ADMIN, FINANCE_OFFICER |
| PAYMENT_RECEIPT | INVESTOR, ADMIN, SUPER_ADMIN, FINANCE_OFFICER |
| DISTRIBUTION_STATEMENT | INVESTOR, ADMIN, SUPER_ADMIN, FINANCE_OFFICER |
| HARVEST_REPORT | ADMIN, SUPER_ADMIN, PROJECT_MANAGER, INVESTOR |
| FARM_DOCUMENT | ADMIN, SUPER_ADMIN, PROJECT_MANAGER |
