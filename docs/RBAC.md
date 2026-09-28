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
| `SUPER_ADMIN` | Full platform access. All permissions. Cannot be restricted. |
| `ADMIN` | Platform administration. User management, project approval, financial oversight. |
| `FINANCE_OFFICER` | Payment verification, withdrawal approval, financial reports. |
| `PROJECT_MANAGER` | Project review, approval, publishing, field visit scheduling. |
| `KYC_OFFICER` | KYC document review and approval. |
| `FIELD_OFFICER` | Field visit scheduling and reporting. Farm and project visibility. |
| `SUPPORT` | Read-only access to most resources for customer support. |
| `INVESTOR` | Invest in projects, manage own portfolio, request withdrawals. |
| `FARMER` | Create and manage farm projects, register farms, manage own profile. |

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
| `project.create` | Create new farm projects |
| `project.update` | Update project details |
| `project.delete` | Delete or archive projects |
| `project.submit` | Submit a project for review |
| `project.approve` | Approve or reject submitted projects |
| `project.publish` | Publish approved projects to investors |
| `project.archive` | Archive completed or cancelled projects |

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
| `payment.verify` | Verify and reconcile payments |
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

### Farm & Farmer
| Permission | Description |
|---|---|
| `farmer.view` | View farmer profiles |
| `farmer.create` | Register as a farmer |
| `farmer.update` | Update farmer profile |
| `farm.view` | View farm details |
| `farm.create` | Register a new farm |
| `farm.update` | Update farm information |

### Operations
| Permission | Description |
|---|---|
| `field_visit.view` | View field visit reports |
| `field_visit.schedule` | Schedule a field visit |
| `field_visit.conduct` | Conduct and submit field visit reports |

### Platform
| Permission | Description |
|---|---|
| `report.view` | Access platform reports and analytics |
| `audit.view` | View audit logs |

---

## Role → Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | FINANCE | PM | KYC | FIELD | SUPPORT | INVESTOR | FARMER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| user.view | ✅ | ✅ | ✅ | ✅ | ✅ | | ✅ | | |
| user.create | ✅ | ✅ | | | | | | | |
| user.update | ✅ | ✅ | | | | | | | |
| user.delete | ✅ | ✅ | | | | | | | |
| user.suspend | ✅ | ✅ | | | | | | | |
| user.change_role | ✅ | ✅ | | | | | | | |
| project.view | ✅ | ✅ | | ✅ | | ✅ | ✅ | ✅ | ✅ |
| project.create | ✅ | | | | | | | | ✅ |
| project.update | ✅ | ✅ | | ✅ | | | | | ✅ |
| project.approve | ✅ | ✅ | | ✅ | | | | | |
| project.publish | ✅ | ✅ | | ✅ | | | | | |
| project.submit | ✅ | | | | | | | | ✅ |
| project.archive | ✅ | ✅ | | ✅ | | | | | |
| investment.view | ✅ | ✅ | ✅ | ✅ | | | ✅ | ✅ | |
| investment.create | ✅ | | | | | | | ✅ | |
| investment.approve | ✅ | ✅ | | | | | | | |
| investment.cancel | ✅ | ✅ | | | | | | ✅ | |
| payment.view | ✅ | ✅ | ✅ | | | | ✅ | | |
| payment.verify | ✅ | ✅ | ✅ | | | | | | |
| withdrawal.view | ✅ | ✅ | ✅ | | | | ✅ | | |
| withdrawal.request | ✅ | | | | | | | ✅ | ✅ |
| withdrawal.approve | ✅ | ✅ | ✅ | | | | | | |
| kyc.view | ✅ | ✅ | | | ✅ | | ✅ | | |
| kyc.submit | ✅ | | | | | | | ✅ | ✅ |
| kyc.review | ✅ | ✅ | | | ✅ | | | | |
| kyc.approve | ✅ | ✅ | | | ✅ | | | | |
| farmer.view | ✅ | ✅ | | ✅ | ✅ | ✅ | ✅ | | ✅ |
| farmer.create | ✅ | | | | | | | | ✅ |
| farmer.update | ✅ | ✅ | | | | | | | ✅ |
| farm.view | ✅ | ✅ | | ✅ | | ✅ | ✅ | | ✅ |
| farm.create | ✅ | | | | | | | | ✅ |
| farm.update | ✅ | ✅ | | | | | | | ✅ |
| field_visit.view | ✅ | ✅ | | ✅ | | ✅ | | | ✅ |
| field_visit.schedule | ✅ | ✅ | | ✅ | | ✅ | | | |
| field_visit.conduct | ✅ | | | | | ✅ | | | |
| report.view | ✅ | ✅ | ✅ | ✅ | | | | | |
| audit.view | ✅ | ✅ | | | | | | | |

---

## Architecture

### Source of Truth

The canonical permission matrix lives in `src/lib/authz/permissions.ts`. The database is seeded from this file. Runtime overrides are possible via the admin panel (adding/removing `role_permissions` rows).

```
src/lib/authz/
  permissions.ts   # PERMISSIONS constants, ROLE_PERMISSIONS matrix, descriptions
  index.ts         # can(), requirePermission(), ownership checks, role helpers
  authz.ts         # Barrel export
```

### Request-Scoped Permission Cache

Permissions are fetched from the DB **once per request** and cached in a `WeakMap` keyed by the session object. Subsequent `can()` calls within the same request hit the cache.

```typescript
// One DB query per request, not one per can() call
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
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";

export async function approveProjectAction(projectId: string) {
  const session = await requireSession();
  await requirePermission(session, "project.approve");
  // ... proceed
}
```

### Server Action — ownership or permission (IDOR prevention)

```typescript
import { requireOwnerOrPermission } from "@/lib/authz";

export async function getInvestmentAction(investmentId: string) {
  const session = await requireSession();
  const investment = await investmentRepository.findById(investmentId);
  if (!investment) throw new NotFoundError("Investment");

  // Investor can only see their own; staff with investment.view can see all
  await requireOwnerOrPermission(session, investment.investorUserId, "investment.view");

  return investment;
}
```

### Route Handler — permission check

```typescript
import { withErrorHandler, ok } from "@/lib/api/response";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";

export const GET = withErrorHandler(async () => {
  const session = await requireSession();
  await requirePermission(session, "report.view");
  const data = await getReportData();
  return ok(data);
});
```

### Layout — role-based portal guard

```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.role)) redirect("/unauthorized");
  return <>{children}</>;
}
```

### Conditional UI rendering (server component)

```typescript
import { can } from "@/lib/authz";

export default async function ProjectActions({ project }) {
  const session = await getSession();
  const canApprove = session ? await can(session, "project.approve") : false;

  return (
    <div>
      {canApprove && <ApproveButton projectId={project.id} />}
    </div>
  );
}
```

### Static check (no DB — for proxy/middleware)

```typescript
import { canStatic } from "@/lib/authz";

// In proxy.ts — no DB access available
if (!canStatic(role, "project.view")) {
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}
```

---

## IDOR Prevention

**IDOR (Insecure Direct Object Reference)** occurs when a user accesses another user's resource by guessing or manipulating an ID.

### Pattern

Every resource access that is user-scoped must call `requireOwnerOrPermission()`:

```typescript
// ❌ WRONG — no ownership check
const investment = await db.investment.findUnique({ where: { id } });

// ✅ CORRECT — ownership enforced
const investment = await db.investment.findUnique({ where: { id } });
if (!investment) throw new NotFoundError("Investment");
await requireOwnerOrPermission(session, investment.investorUserId, "investment.view");
```

### Scope-filtered queries

For list endpoints, always filter by `userId` for non-staff roles:

```typescript
const investments = await db.investment.findMany({
  where: {
    // Staff with investment.view see all; investors see only their own
    ...(canViewAll ? {} : { investorProfile: { userId: session.id } }),
  },
});
```

---

## Privilege Escalation Prevention

1. **Role changes require `user.change_role`** — only `SUPER_ADMIN` and `ADMIN` have this
2. **`SUPER_ADMIN` cannot be assigned via the admin panel** — only via direct DB seed or migration
3. **Permissions are checked server-side** — client-side role state is never trusted
4. **Session is re-validated on every request** — suspended users are blocked immediately
5. **`canStatic()` uses the compile-time matrix** — cannot be manipulated at runtime

---

## Security Considerations

| Threat | Mitigation |
|---|---|
| IDOR | `requireOwnerOrPermission()` on every resource access |
| Privilege escalation | `user.change_role` required; SUPER_ADMIN not assignable via UI |
| Permission bypass | All checks server-side; frontend checks are UI-only |
| Stale permissions | WeakMap cache is per-request; no cross-request leakage |
| Role spoofing | Role read from DB session on every request, not from cookie |
| Horizontal privilege escalation | Ownership check compares `session.id` to resource `ownerId` |
