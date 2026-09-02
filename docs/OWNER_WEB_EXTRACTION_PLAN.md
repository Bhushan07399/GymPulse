# GymPulse — Owner Web Extraction Plan

**Planning Date**: September 2, 2026  
**Target Application**: `apps/owner-web/`  
**Purpose**: Comprehensive technical audit and step-by-step extraction plan to transform the remaining `apps/web/` workspace into a dedicated, production-ready Next.js application for Gym Owners & Staff (`apps/owner-web/`).

---

## 1. Current `apps/web/` Audit & Classification

A complete audit of `apps/web/` after Member Web extraction classifies all existing files and directories as follows:

| Path | Classification | Role |
|---|---|---|
| `app/dashboard/` | **A. Owner Web Only** | Gym Owner Management Dashboard (Attendance, Analytics, Classes, Members, Plans, Payments, Reception, Reports, Settings, Staff, WhatsApp) |
| `app/login/` | **A. Owner Web Only** | Gym Owner & Staff Login Portal |
| `app/create-account/` | **A. Owner Web Only** | Gym Owner Registration & Onboarding |
| `app/subscription/` | **A. Owner Web Only** | GymPulse SaaS Tier & Billing Management |
| `app/member/` | **C. Member Leftover** | Previous member routes (now fully extracted into `apps/member-web/`) |
| `app/globals.css` | **B. Shared Web** | Global Tailwind CSS styling rules |
| `app/layout.tsx` | **B. Shared Web** | Root Next.js layout container |
| `app/page.tsx` | **A. Owner Web Only** | Entry role-selection page directing to `/login` or `/member/login` |
| `src/components/analytics/` | **A. Owner Web Only** | Business analytics charts & metrics |
| `src/components/attendance/` | **A. Owner Web Only** | Check-in ledger & manual attendance table |
| `src/components/classes/` | **A. Owner Web Only** | Group class scheduler & plan manager |
| `src/components/dashboard/` | **A. Owner Web Only** | Operational dashboard, quick action sheet, metric cards |
| `src/components/members/` | **A. Owner Web Only** | Member table, add member modal |
| `src/components/membership-plans/` | **A. Owner Web Only** | Plan pricing CRUD grid |
| `src/components/payments/` | **A. Owner Web Only** | Payments ledger, add payment modal |
| `src/components/subscription/` | **A. Owner Web Only** | Subscription pricing cards & billing view |
| `src/components/protected-dashboard-layout.tsx` | **A. Owner Web Only** | Owner sidebar navigation & header |
| `src/components/member/` | **C. Member Leftover** | Previous member components |
| `src/components/providers.tsx` | **B. Shared Web** | React Query + Toast context wrapper |
| `src/components/ui/` | **B. Shared Web** | Primitive UI components (`Button`, `Card`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Badge`, `Input`, `Select`) |
| `src/services/attendance.service.ts` | **A. Owner Web Only** | Attendance API service |
| `src/services/auth.service.ts` | **A. Owner Web Only** | Owner Auth API service |
| `src/services/bmi.service.ts` | **A. Owner Web Only** | BMI assessment API service |
| `src/services/class-plans.service.ts` | **A. Owner Web Only** | Class plans API service |
| `src/services/classes.service.ts` | **A. Owner Web Only** | Class management API service |
| `src/services/dashboard.service.ts` | **A. Owner Web Only** | Dashboard analytics API service |
| `src/services/gym-settings.service.ts` | **A. Owner Web Only** | Gym settings API service |
| `src/services/members.service.ts` | **A. Owner Web Only** | Members management API service |
| `src/services/membership-plans.service.ts` | **A. Owner Web Only** | Membership plans API service |
| `src/services/payments.service.ts` | **A. Owner Web Only** | Payments ledger API service |
| `src/services/reports.service.ts` | **A. Owner Web Only** | Financial reports API service |
| `src/services/staff.service.ts` | **A. Owner Web Only** | Staff management API service |
| `src/services/whatsapp.service.ts` | **A. Owner Web Only** | WhatsApp automation API service |
| `src/services/member/` | **C. Member Leftover** | Member API services |
| `src/hooks/member/` | **C. Member Leftover** | Member custom hooks |
| `src/lib/api-client.ts` | **B. Shared Web** | Axios HTTP client configured for `gympulse_token` |
| `src/lib/utils.ts` | **B. Shared Web** | Tailwind `cn` class merger helper |
| `src/lib/subscription-state.ts` | **A. Owner Web Only** | Owner subscription status checker |
| `src/config/class-type-config.ts` | **B. Shared Web** | Class category configuration |
| `src/types/api.ts` | **B. Shared Web** | `ApiResponse<T>` interface |
| `src/types/member-app.ts` | **C. Member Leftover** | Member TypeScript types |
| `src/data/workout-library.ts` | **C. Member Leftover** | Workout exercise library data |

---

## 2. Member Leftover Check

The following Member-specific items remain in `apps/web/`:
- `app/member/` (19 page files)
- `src/components/member/` (Member card components)
- `src/services/member/` (`member-api.service.ts`, `member-auth.service.ts`, `member-classes.service.ts`)
- `src/hooks/member/` (`use-member-auth.tsx`, `use-member-dashboard.ts`)
- `src/types/member-app.ts`
- `src/utils/member-format.ts`
- `src/data/workout-library.ts`
- `public/assets/member/`

**Status**: These files were retained in `apps/web/` during Phase 1 to guarantee zero regression risk for Owner Web. Because `apps/member-web/` is now 100% self-contained and verified, all of these leftover files **can safely be excluded / removed** when establishing `apps/owner-web/`.

---

## 3. Owner Web File Map

The exact list of files and directories required for `apps/owner-web/`:

### App Router Routes (`apps/owner-web/app/`)
- `app/dashboard/layout.tsx` & `app/dashboard/page.tsx`
- `app/dashboard/attendance/page.tsx`
- `app/dashboard/business-analytics/page.tsx`
- `app/dashboard/classes/page.tsx`
- `app/dashboard/gym-qr/page.tsx`
- `app/dashboard/members/page.tsx`
- `app/dashboard/membership-plans/page.tsx`
- `app/dashboard/payments/page.tsx`
- `app/dashboard/reception/page.tsx`
- `app/dashboard/reports/page.tsx`
- `app/dashboard/settings/page.tsx`
- `app/dashboard/staff/page.tsx`
- `app/dashboard/whatsapp/page.tsx`
- `app/login/page.tsx`
- `app/create-account/page.tsx`
- `app/subscription/page.tsx`
- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

### React Components (`apps/owner-web/src/components/`)
- `src/components/protected-dashboard-layout.tsx`
- `src/components/analytics/` (`business-analytics-view.tsx`)
- `src/components/attendance/` (`attendance-client.tsx`, `attendance-stats.tsx`)
- `src/components/classes/` (`class-plans-modal.tsx`, `classes-client.tsx`)
- `src/components/dashboard/` (`compact-mobile-dashboard.tsx`, `dashboard-client.tsx`, `date-banner.tsx`, `metric-card.tsx`, `todays-overview.tsx`, `quick-action-sheet.tsx`)
- `src/components/members/` (`add-member-modal.tsx`, `members-table.tsx`)
- `src/components/membership-plans/` (`add-plan-modal.tsx`, `plans-grid.tsx`)
- `src/components/payments/` (`add-payment-modal.tsx`, `payments-table.tsx`)
- `src/components/subscription/` (`subscription-page.tsx`)
- `src/components/providers.tsx`
- `src/components/ui/` (`badge`, `button`, `card`, `dialog`, `input`, `select`, `sheet`, `table`, `tabs`)

### API Services (`apps/owner-web/src/services/`)
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

### Utilities & Types (`apps/owner-web/src/`)
- `src/lib/api-client.ts`
- `src/lib/utils.ts`
- `src/lib/subscription-state.ts`
- `src/config/class-type-config.ts`
- `src/types/api.ts`

---

## 4. Shared Code Strategy

To keep the architecture simple, production-ready, and sellable:
- **`src/components/ui/*`**: Retained directly inside `apps/owner-web/src/components/ui/`.
- **`src/lib/api-client.ts`**: Retained directly inside `apps/owner-web/src/lib/api-client.ts`, dedicated to Owner JWT token storage (`gympulse_token`).
- **`src/lib/utils.ts`**: Retained directly inside `apps/owner-web/src/lib/utils.ts`.
- **`app/globals.css`**: Retained directly inside `apps/owner-web/app/globals.css`.

---

## 5. API Client Configuration

- **API URL Source**: `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api/v1`).
- **Token Key**: `localStorage.getItem("gympulse_token")`
- **User Profile Key**: `localStorage.getItem("gympulse_user")`
- **Gym Details Key**: `localStorage.getItem("gympulse_gym")`
- **Request Header**: `Authorization: Bearer <gympulse_token>`
- **Difference from Member Web**: Uses `gympulse_token` (Staff/Owner JWT) instead of `gympulse_member_token` (Member JWT).

---

## 6. Owner Authentication Audit

- **Login Route**: `app/login/page.tsx`
- **Account Registration**: `app/create-account/page.tsx`
- **Auth Service**: `src/services/auth.service.ts`
- **Layout Guard**: `ProtectedDashboardLayout` checks `localStorage.getItem("gympulse_token")` and redirects unauthenticated users to `/login`.
- **RBAC**: Staff role permissions (`Owner`, `Manager`, `Trainer`, `Receptionist`) checked in navigation menus.

---

## 7. Next.js Configuration Files

When creating `apps/owner-web/`:
- `package.json`: **COPY / RECREATE** (with `"name": "owner-web"`).
- `tsconfig.json`: **COPY** (configured for `@/*` alias).
- `next.config.ts`: **COPY**.
- `postcss.config.mjs`: **COPY**.
- `app/globals.css`: **COPY**.
- `app/layout.tsx`: **COPY**.
- `src/components/providers.tsx`: **COPY**.
- `.env.example`: **RECREATE**.

---

## 8. Public Assets Audit (`apps/web/public/`)

- **Owner-Only / Shared**: `file.svg`, `globe.svg`, `window.svg`, `next.svg`, `vercel.svg`, `favicon.ico`.
- **Member Leftover**: `public/assets/member/` (Safe to exclude from `apps/owner-web`).

---

## 9. Import Dependency Check

- **Dependencies on `apps/member-web/`**: **ZERO**.
- **Dependencies on Member leftover code**: **ZERO**.
- All Owner Web imports use `@/src/...` path aliases pointing internally.

---

## 10. Backend Impact

- **Backend Changes Required**: **NONE**. The Express REST API (`apps/api/`) remains 100% unchanged.

---

## 11. Database Impact

- **Database Changes Required**: **NONE**. PostgreSQL DDL and sequential migrations remain 100% unchanged.

---

## 12. Environment Variables

Only the non-secret client environment variable name is required:
- `NEXT_PUBLIC_API_URL`

---

## 13. Exact Migration Order

1. **Step 1 — Create `apps/owner-web` Workspace**: Set up `apps/owner-web` directory with root configuration (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`).
2. **Step 2 — Move Owner App Routes**: Copy `app/dashboard/`, `app/login/`, `app/create-account/`, `app/subscription/`, `app/page.tsx` to `apps/owner-web/app/`.
3. **Step 3 — Move Owner Components**: Copy `src/components/dashboard/`, `members/`, `analytics/`, `attendance/`, `classes/`, `membership-plans/`, `payments/`, `subscription/`, `protected-dashboard-layout.tsx`, `providers.tsx`, `ui/` to `apps/owner-web/src/components/`.
4. **Step 4 — Move Owner Services**: Copy `src/services/` (management services) to `apps/owner-web/src/services/`.
5. **Step 5 — Copy Shared Utilities & Types**: Copy `src/lib/`, `src/config/`, `src/types/api.ts` to `apps/owner-web/src/`.
6. **Step 6 — Exclude Member Leftovers**: Do not copy `app/member/`, `components/member/`, `services/member/`, `hooks/member/`, or `public/assets/member/`.
7. **Step 7 — Copy Public Assets**: Copy root assets to `apps/owner-web/public/`.
8. **Step 8 — Configure Environment**: Create `apps/owner-web/.env.example`.
9. **Step 9 — Execute TypeScript Check**: Run `npx tsc --noEmit` in `apps/owner-web`.
10. **Step 10 — Remove Legacy `apps/web/`**: Delete old `apps/web/` directory after verifying `apps/owner-web`.
11. **Step 11 — Real Data Owner Web QA**: Execute `scratch/real_data_integration_test.js`.
12. **Step 12 — Member Web Regression Verification**: Run `scratch/test_member_web_qa.js` to ensure zero impact on `apps/member-web`.

---

## 14. Rollback Plan

If any issue arises during extraction:
1. Revert Git working directory to the commit prior to extraction.
2. `apps/web/` and `apps/member-web/` remain intact and functional.

---

## 15. Risk Assessment

| Area | Risk Level | Rationale |
|---|---|---|
| **Owner App Routes & Components** | **LOW** | Cleanly isolated under `app/dashboard/` and `src/components/`. |
| **Owner API Services** | **LOW** | Management services have zero dependencies on Member code. |
| **Backend & DB Impact** | **ZERO** | Backend API and PostgreSQL DB remain untouched. |
| **Member Web Impact** | **ZERO** | `apps/member-web/` is completely standalone. |

---

## Final Recommendation

**Extraction Feasibility**: **HIGHLY SAFE & READY FOR EXECUTION**.

Transforming `apps/web` into `apps/owner-web` following the 12-step migration plan above completes the multi-app architecture cleanly and safely.
