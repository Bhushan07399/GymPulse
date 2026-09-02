# GymPulse — Multi-App Architecture & File Structure Audit

**Audit Date**: September 2, 2026  
**Audited Target**: Full GymPulse Repository (`apps/api`, `apps/web`, `database/`, `packages/`, `prisma/`)

---

## 1. Current Architecture

The GymPulse repository is structured as a monorepo containing two core applications:

```text
GymPulse/
├── apps/
│   ├── api/                    # Node.js / Express.js REST API Backend
│   └── web/                    # Next.js App Router Web Application (Owner Web + Member Web)
├── database/                   # Authoritative DDL Schema & Sequential SQL Migrations
├── docs/                       # Architectural & Technical System Documentation
├── infrastructure/             # Cloud Deployment & IaC Specifications
├── packages/                   # Shared Monorepo Scope
├── prisma/                     # Reference Prisma ORM Schema
├── scratch/                    # Developer Utilities & Integration Test Runners
└── tests/                      # Automated CI Testing Framework Placeholder
```

---

## 2. Current Application Boundaries

- **Backend API (`apps/api`)**: Fully independent Express REST API running on its own process. Communicates exclusively via HTTP JSON endpoints (`/api/v1/*`).
- **Web Application (`apps/web`)**: Next.js App Router application hosting **TWO distinct web experiences** within a single Next.js project:
  1. **Gym Owner / Staff Management Web App** (`/dashboard/*`)
  2. **Gym Member Web Portal** (`/member/*`)

---

## 3. Owner Web Classification (`apps/web/`)

The following files and directories in `apps/web` exclusively serve the **Gym Owner & Staff Management Experience**:

### App Router Pages (`apps/web/app/`)
- `app/dashboard/layout.tsx` & `app/dashboard/page.tsx`
- `app/dashboard/attendance/`
- `app/dashboard/business-analytics/`
- `app/dashboard/classes/`
- `app/dashboard/gym-qr/`
- `app/dashboard/members/`
- `app/dashboard/membership-plans/`
- `app/dashboard/payments/`
- `app/dashboard/reception/`
- `app/dashboard/reports/`
- `app/dashboard/settings/`
- `app/dashboard/staff/`
- `app/dashboard/whatsapp/`
- `app/login/page.tsx`
- `app/create-account/page.tsx`
- `app/subscription/page.tsx`

### React Components (`apps/web/src/components/`)
- `src/components/protected-dashboard-layout.tsx`
- `src/components/analytics/` (`business-analytics-view.tsx`)
- `src/components/attendance/` (`attendance-client.tsx`, `attendance-stats.tsx`)
- `src/components/classes/` (`class-plans-modal.tsx`, `classes-client.tsx`)
- `src/components/dashboard/` (`compact-mobile-dashboard.tsx`, `dashboard-client.tsx`, `date-banner.tsx`, `metric-card.tsx`, `todays-overview.tsx`, `quick-action-sheet.tsx`)
- `src/components/members/` (`add-member-modal.tsx`, `members-table.tsx`)
- `src/components/membership-plans/` (`add-plan-modal.tsx`, `plans-grid.tsx`)
- `src/components/payments/` (`add-payment-modal.tsx`, `payments-table.tsx`)
- `src/components/subscription/` (`subscription-page.tsx`)

### Management API Services (`apps/web/src/services/`)
- `attendance.service.ts`
- `auth.service.ts`
- `bmi.service.ts`
- `class-plans.service.ts`
- `classes.service.ts`
- `dashboard.service.ts`
- `gym-settings.service.ts`
- `members.service.ts`
- `membership-plans.service.ts`
- `payments.service.ts`
- `reports.service.ts`
- `staff.service.ts`
- `whatsapp.service.ts`

---

## 4. Member Web Classification (`apps/web/`)

The following files and directories in `apps/web` exclusively serve the **Gym Member Experience**:

### App Router Pages (`apps/web/app/member/`)
- `app/member/layout.tsx` & `app/member/page.tsx`
- `app/member/login/`
- `app/member/dashboard/`
- `app/member/announcements/`
- `app/member/attendance/`
- `app/member/classes/`
- `app/member/crowd/`
- `app/member/goals/`
- `app/member/measurements/`
- `app/member/member-card/`
- `app/member/membership/`
- `app/member/notifications/`
- `app/member/payments/`
- `app/member/profile/`
- `app/member/progress/`
- `app/member/scan/`
- `app/member/settings/`
- `app/member/workout/`

### React Components (`apps/web/src/components/member/`)
- `src/components/member/attendance/`
- `src/components/member/common/`
- `src/components/member/dashboard/`
- `src/components/member/layout/`
- `src/components/member/membership/`
- `src/components/member/payments/`
- `src/components/member/progress/`

### Member API Services & Hooks
- `src/services/member/` (`member-api.service.ts`, `member-auth.service.ts`)
- `src/hooks/member/` (`use-member-auth.tsx`, `use-member-dashboard.ts`)

---

## 5. Shared Web Classification (`apps/web/`)

Code used by both Owner Web and Member Web within `apps/web`:
- `src/components/ui/` (`badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `sheet.tsx`, `table.tsx`, `tabs.tsx`)
- `src/components/providers.tsx` (React Query + Toast providers)
- `src/lib/api-client.ts` (Axios HTTP client)
- `src/lib/utils.ts` (`cn` Tailwind helper)
- `src/lib/subscription-state.ts`
- `app/globals.css` (Tailwind design system)
- `app/layout.tsx` (Root font & metadata layout)
- `app/page.tsx` (Entry role selection page directing to `/login` or `/member/login`)
- `src/types/api.ts` (`ApiResponse<T>` interface)
- `src/config/class-type-config.ts`

---

## 6. Backend Structure (`apps/api/`)

The Express REST API server is **100% independent** from `apps/web`:
- **Controllers** (`src/controllers/`): HTTP handlers validating request inputs, executing service logic, and returning standard JSON responses.
- **Routes** (`src/routes/`): Router definitions mounted under `/api/v1/*`.
- **Services** (`src/services/`): Business logic layer.
- **Repositories** (`src/repositories/`): Raw SQL query layer (`pg.Pool`).
- **Validations** (`src/validations/`): Joi and Zod validation schemas.
- **Middleware** (`src/middleware/`): JWT `authenticate`, Role RBAC `authorize`, and plan feature entitlement gating.

---

## 7. Database Structure

- **Authoritative Source of Truth**: PostgreSQL DDL files (`database/schema.sql`, `database/seed.sql`) and sequential SQL migrations (`database/migrations/`).
- **Prisma Reference**: `prisma/schema.prisma` serves as an offline type/schema reference.

---

## 8. Native Mobile Applications Audit

> **"Native mobile applications are not currently present."**

The repository currently contains no React Native, Expo, Flutter, native Android, or native iOS source code directories.

---

## 9. Shared-Code Analysis (`packages/shared/`)

Currently, `packages/shared/` is an empty placeholder without code or `package.json`. Shared code between Owner Web and Member Web currently lives inside `apps/web/src/`.

When multi-app separation occurs in the future, `packages/shared` should hold:
1. Common TypeScript DTO interfaces (`Member`, `Payment`, `GymProfile`, `ClassSchedule`).
2. Zod validation schemas shared between API and frontend forms.
3. System Enums & Constants (Payment Methods, Roles, Attendance Statuses).
4. Date/currency formatting utilities.

---

## 10. Problems With Current Structure

1. **Mixed Web Applications**: Hosting Owner Web and Member Web inside `apps/web` increases bundle size, complicates deployment routing, and mixes two different user security contexts.
2. **Duplicated Types**: API response interfaces and payload types are defined separately in `apps/api` and `apps/web/src/types`.
3. **Co-located Member Assets**: Member Web assets and components sit directly inside `apps/web/src/components/member/` rather than in an isolated workspace.

---

## 11. Recommended Target Architecture

To prepare GymPulse for a sell-ready production SaaS platform:

```text
GymPulse/
├── apps/
│   ├── api/                    # Independent Express REST API
│   ├── owner-web/              # Next.js Gym Owner & Staff Management App
│   └── member-web/             # Next.js Gym Member Mobile-First Web Portal
│
├── packages/
│   └── shared/                 # Shared TS Types, Schemas, & Utilities
│
├── database/                   # PostgreSQL Schema & Migrations
├── docs/                       # Production & Handover Documentation
├── infrastructure/             # Cloud Infrastructure & IaC
└── tests/                      # E2E & Integration Test Suites
```

*Note: Native mobile apps (`owner-mobile/` and `member-mobile/`) will be placed under `apps/` when React Native / Expo development commences.*

---

## 12. Proposed Final Folder Tree

```text
GymPulse/
├── apps/
│   ├── api/
│   ├── owner-web/
│   │   ├── app/ (dashboard, login, create-account, subscription)
│   │   └── src/ (components, services)
│   └── member-web/
│       ├── app/ (member routes)
│       └── src/ (member components, member services)
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   └── utils/
│       └── package.json
├── database/
├── docs/
└── infrastructure/
```

---

## 13. Files/Folders That Should Move (During Future Refactoring)

- `apps/web/app/member/` -> `apps/member-web/app/`
- `apps/web/src/components/member/` -> `apps/member-web/src/components/`
- `apps/web/src/services/member/` -> `apps/member-web/src/services/`
- `apps/web/src/hooks/member/` -> `apps/member-web/src/hooks/`
- `apps/web/` -> `apps/owner-web/` (after separating member code)

---

## 14. Files/Folders That Should NOT Move

- `apps/api/` (Standalone, perfectly isolated REST API).
- `database/` (Standalone PostgreSQL DDL & migrations).
- `docs/` (Root workspace documentation).
- `infrastructure/` (Root infrastructure configurations).

---

## 15. Risky Moves & Mitigation

1. **Relative Imports**: Moving `apps/web/app/member` to `apps/member-web` requires updating `@/src/...` path aliases.
2. **Next.js Asset References**: Public images and icons must be copied or served via CDNs.
3. **Session Cookies / Auth Tokens**: `owner-web` uses JWT in localStorage/headers; `member-web` uses member JWT tokens. Separating domains (`app.gympulse.in` vs `member.gympulse.in`) will improve security.

---

## 16. Future Mobile App Placement

When native mobile applications are created using React Native or Expo:
- `apps/owner-mobile/`: React Native / Expo app for Gym Owners & Staff.
- `apps/member-mobile/`: React Native / Expo app for Gym Members.
- Both mobile apps will consume `apps/api` endpoints and import shared types from `packages/shared`.

---

## 17. Future Shared-Code Strategy

Create `packages/shared/package.json` as a workspace package:
```json
{
  "name": "@gympulse/shared",
  "version": "1.0.0",
  "main": "./src/index.ts"
}
```
Imported in web and mobile apps as `import { GymProfile, Member } from "@gympulse/shared"`.

---

## 18. Migration Strategy

1. **Phase 1 (Current)**: Keep single repository operational with clear internal code separation (`/dashboard` vs `/member`).
2. **Phase 2 (Package Extraction)**: Extract API DTO types and Zod schemas into `packages/shared`.
3. **Phase 3 (App Split)**: Split `apps/web` into `apps/owner-web` and `apps/member-web`.
4. **Phase 4 (Mobile Launch)**: Add `apps/owner-mobile` and `apps/member-mobile`.
