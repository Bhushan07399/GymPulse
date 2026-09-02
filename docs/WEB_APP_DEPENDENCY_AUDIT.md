# GymPulse Web App Dependency Audit

**Audit Date**: September 2, 2026  
**Audited Target**: `apps/web/` Codebase & Dependency Map

---

## Current State

The current web application (`apps/web`) is a Next.js App Router project hosting **two distinct web experiences** in a single codebase:

1. **Gym Owner & Staff Management App** (`/dashboard/*`, `/login`, `/create-account`, `/subscription`)
2. **Gym Member Web Portal** (`/member/*`, `/member/login`, `/member/dashboard`)

While both experiences currently share standard UI primitives (`src/components/ui/`), CSS styles (`app/globals.css`), and the Axios API client (`src/lib/api-client.ts`), their page routes, business components, custom hooks, and API service layers are **already 95%+ decoupled**.

---

## Owner Web Files

The following files and folders in `apps/web/` are **exclusively used by Gym Owners & Staff**:

### App Router Routes (`apps/web/app/`)
- `app/dashboard/layout.tsx` (Owner dashboard header, sidebar, navigation container)
- `app/dashboard/page.tsx` (Dashboard home redirect)
- `app/dashboard/attendance/page.tsx` (Gym check-in ledger & manual check-in)
- `app/dashboard/business-analytics/page.tsx` (Revenue breakdowns & membership metrics)
- `app/dashboard/classes/page.tsx` (Class creation, session schedules, member enrollment)
- `app/dashboard/gym-qr/page.tsx` (Reception QR code generator)
- `app/dashboard/members/page.tsx` (Member CRUD, filter status, plan assignment)
- `app/dashboard/membership-plans/page.tsx` (Plan pricing & duration CRUD)
- `app/dashboard/payments/page.tsx` (Payments ledger, dues collection, invoice print)
- `app/dashboard/reception/page.tsx` (Reception desk scanner & fast check-in)
- `app/dashboard/reports/page.tsx` (Financial, attendance, and member export reports)
- `app/dashboard/settings/page.tsx` (Gym profile, branding, operating hours, GSTIN settings)
- `app/dashboard/staff/page.tsx` (Staff accounts & role permissions)
- `app/dashboard/whatsapp/page.tsx` (WhatsApp automation, logs, templates, broadcasts)
- `app/login/page.tsx` (Owner / Staff login portal)
- `app/create-account/page.tsx` (Gym registration & owner onboarding)
- `app/subscription/page.tsx` (GymPulse SaaS subscription tier management)

### Management Components (`apps/web/src/components/`)
- `src/components/protected-dashboard-layout.tsx` (Owner sidebar & navigation bar)
- `src/components/analytics/` (`business-analytics-view.tsx`)
- `src/components/attendance/` (`attendance-client.tsx`, `attendance-stats.tsx`)
- `src/components/classes/` (`class-plans-modal.tsx`, `classes-client.tsx`)
- `src/components/dashboard/` (`compact-mobile-dashboard.tsx`, `dashboard-client.tsx`, `date-banner.tsx`, `metric-card.tsx`, `todays-overview.tsx`, `quick-action-sheet.tsx`)
- `src/components/members/` (`add-member-modal.tsx`, `members-table.tsx`)
- `src/components/membership-plans/` (`add-plan-modal.tsx`, `plans-grid.tsx`)
- `src/components/payments/` (`add-payment-modal.tsx`, `payments-table.tsx`)
- `src/components/subscription/` (`subscription-page.tsx`)

### Management API Services (`apps/web/src/services/`)
- `src/services/attendance.service.ts`
- `src/services/auth.service.ts`
- `src/services/bmi.service.ts`
- `src/services/class-plans.service.ts`
- `src/services/classes.service.ts`
- `src/services/dashboard.service.ts`
- `src/services/gym-settings.service.ts`
- `src/services/members.service.ts`
- `src/services/membership-plans.service.ts`
- `src/services/payments.service.ts`
- `src/services/reports.service.ts`
- `src/services/staff.service.ts`
- `src/services/whatsapp.service.ts`

---

## Member Web Files

The following files and folders in `apps/web/` are **exclusively used by Gym Members**:

### App Router Routes (`apps/web/app/member/`)
- `app/member/layout.tsx` (Mobile bottom-navigation bar & member header)
- `app/member/page.tsx` (Member entry redirect)
- `app/member/login/page.tsx` (Member Phone / Member ID login portal)
- `app/member/dashboard/page.tsx` (Digital member pass, streak counter, crowd gauge)
- `app/member/announcements/page.tsx` (Gym notices & updates)
- `app/member/attendance/page.tsx` (Personal check-in history)
- `app/member/classes/page.tsx` (Class schedule booking & enrolled sessions)
- `app/member/crowd/page.tsx` (Real-time gym capacity gauge)
- `app/member/goals/page.tsx` (Fitness target setting)
- `app/member/measurements/page.tsx` (Weight & measurement tracking)
- `app/member/member-card/page.tsx` (Digital QR pass view)
- `app/member/membership/page.tsx` (Plan details & expiration countdown)
- `app/member/notifications/page.tsx` (Member alerts & notification history)
- `app/member/payments/page.tsx` (Personal payment history & dues)
- `app/member/profile/page.tsx` (Member profile & contact info)
- `app/member/progress/page.tsx` (Workout progress charts & BMI reports)
- `app/member/scan/page.tsx` (Native QR camera scanner)
- `app/member/settings/page.tsx` (Member app settings)
- `app/member/workout/page.tsx` (Workout library & exercise logger)

### Member Components (`apps/web/src/components/member/`)
- `src/components/member/attendance/` (`member-attendance-view.tsx`)
- `src/components/member/common/` (`empty-state.tsx`, `error-state.tsx`, `loading-state.tsx`, `plan-locked-state.tsx`)
- `src/components/member/dashboard/` (`attendance-card.tsx`, `classes-card.tsx`, `crowd-card.tsx`, `member-dynamic-hero.tsx`, `membership-card.tsx`, `payment-card.tsx`, `progress-card.tsx`)
- `src/components/member/layout/` (`member-bottom-nav.tsx`, `member-header.tsx`, `member-layout-wrapper.tsx`)
- `src/components/member/membership/` (`member-membership-view.tsx`)
- `src/components/member/payments/` (`member-payments-view.tsx`)
- `src/components/member/progress/` (`member-progress-view.tsx`)

### Member Services & Hooks
- `src/services/member/member-api.service.ts`
- `src/services/member/member-auth.service.ts`
- `src/services/member/member-classes.service.ts`
- `src/hooks/member/use-member-auth.tsx`
- `src/hooks/member/use-member-dashboard.ts`
- `src/utils/member-format.ts`

---

## Shared Files

The following files are **shared across Owner Web and Member Web**:

| File Path | Why Shared | Long-Term Target Location |
|---|---|---|
| `src/components/ui/*` (`badge`, `button`, `card`, `dialog`, `input`, `select`, `sheet`, `table`, `tabs`) | Shadcn/Radix UI primitive styling elements | Duplicate/Co-locate in both web apps OR extract into `@gympulse/ui` package |
| `src/components/providers.tsx` | Global React Query + Toast context providers | Co-locate in each web app's root |
| `src/lib/api-client.ts` | Axios HTTP client instance with bearer token interceptor | Co-locate in each web app (token key: `gympulse_token` vs `gympulse_member_token`) |
| `src/lib/utils.ts` | Tailwind `cn` class merger helper | Move to `packages/shared/src/utils/` |
| `src/types/api.ts` | Standard `ApiResponse<T>` interface | Move to `packages/shared/src/types/` |
| `src/config/class-type-config.ts` | Icon and color mapping for class categories | Move to `packages/shared/src/config/` |
| `app/globals.css` | Global Tailwind CSS styles and font definitions | Co-locate in each web app |
| `app/layout.tsx` | Root Next.js HTML layout container | Co-locate in each web app |
| `app/page.tsx` | Role-selection entry page directing users to `/login` or `/member/login` | Retain as entry router or co-locate |

---

## Cross Dependencies

- **Owner Web dependencies on Member Web code**: **ZERO**. Owner Web code in `app/dashboard/` and `src/components/dashboard/` does NOT import any files from `app/member/`, `src/components/member/`, `src/services/member/`, or `src/hooks/member/`.
- **Member Web dependencies on Owner Web code**: **ZERO**. Member Web code in `app/member/` does NOT import any owner dashboard components or management services.
- **Circular Dependencies**: **NONE**.
- **Direct Imports**: All imports use standard `@/src/...` path aliases.

---

## Services Classification

| File Path | Classification | Usage |
|---|---|---|
| `src/services/attendance.service.ts` | **Owner-Only** | Owner attendance ledger |
| `src/services/auth.service.ts` | **Owner-Only** | Owner/Staff login API |
| `src/services/bmi.service.ts` | **Owner-Only** | Owner BMI assessment CRUD |
| `src/services/class-plans.service.ts` | **Owner-Only** | Owner class pricing plans |
| `src/services/classes.service.ts` | **Owner-Only** | Owner class management |
| `src/services/dashboard.service.ts` | **Owner-Only** | Owner overview analytics |
| `src/services/gym-settings.service.ts` | **Owner-Only** | Owner gym settings API |
| `src/services/members.service.ts` | **Owner-Only** | Owner member CRUD API |
| `src/services/membership-plans.service.ts` | **Owner-Only** | Owner membership plans |
| `src/services/payments.service.ts` | **Owner-Only** | Owner payments ledger |
| `src/services/reports.service.ts` | **Owner-Only** | Owner financial reports |
| `src/services/staff.service.ts` | **Owner-Only** | Owner staff CRUD |
| `src/services/whatsapp.service.ts` | **Owner-Only** | Owner WhatsApp automation |
| `src/services/member/member-api.service.ts` | **Member-Only** | Member portal API |
| `src/services/member/member-auth.service.ts` | **Member-Only** | Member OTP login API |
| `src/services/member/member-classes.service.ts` | **Member-Only** | Member class bookings API |

---

## Components Classification

| Folder / File Path | Classification | Usage |
|---|---|---|
| `src/components/protected-dashboard-layout.tsx` | **Owner-Only** | Management layout |
| `src/components/analytics/` | **Owner-Only** | Revenue analytics view |
| `src/components/attendance/` | **Owner-Only** | Check-in ledger view |
| `src/components/classes/` | **Owner-Only** | Class scheduling view |
| `src/components/dashboard/` | **Owner-Only** | Operational dashboard |
| `src/components/members/` | **Owner-Only** | Member table & modal |
| `src/components/membership-plans/` | **Owner-Only** | Membership plans grid |
| `src/components/payments/` | **Owner-Only** | Payments table & modal |
| `src/components/subscription/` | **Owner-Only** | GymPulse subscription tier |
| `src/components/member/` | **Member-Only** | Member portal cards & layout |
| `src/components/ui/` | **Shared** | UI primitives (`Button`, `Card`, etc.) |
| `src/components/providers.tsx` | **Shared** | React Query provider wrapper |

---

## Hooks Classification

| File Path | Classification | Usage |
|---|---|---|
| `src/hooks/member/use-member-auth.tsx` | **Member-Only** | Member JWT authentication state |
| `src/hooks/member/use-member-dashboard.ts` | **Member-Only** | Member dashboard queries |

---

## Types Classification

| File Path | Classification | Usage |
|---|---|---|
| `src/types/api.ts` | **Shared** | Standard `ApiResponse<T>` wrapper |
| `src/types/member-app.ts` | **Member-Only** | Member profile & dashboard types |

---

## Public Assets

| File / Folder Path | Classification | Target Location |
|---|---|---|
| `public/assets/member/` | **Member-Only** | Move to `apps/member-web/public/assets/` |
| `public/file.svg`, `globe.svg`, `window.svg` | **Shared** | Copy to both web apps |
| `public/favicon.ico` | **Shared** | Copy to both web apps |

---

## Environment Variables

| Variable Name | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Shared** | Base URL for Express REST API (`http://localhost:5000/api/v1`) |

---

## Next.js Dependencies

When splitting `apps/web` into `apps/owner-web` and `apps/member-web`:
1. `app/layout.tsx` & `app/globals.css`: Copy to both apps.
2. `package.json`: Duplicate Next.js, React, Tailwind, Framer Motion, and Lucide React dependencies into both `apps/owner-web/package.json` and `apps/member-web/package.json`.
3. `tsconfig.json`: Update path alias `@/*` to point to each respective app's directory.

---

## `packages/shared/` Analysis

- **Current Content**: Empty directories (`src/types/`, `src/utils/`) without code or `package.json`.
- **Currently Imported by `apps/web`**: **NOTHING**.
- **What Should Belong There**:
  - `packages/shared/src/types/`: `ApiResponse<T>`, `MemberProfile`, `GymSettings`, `PaymentReceipt`.
  - `packages/shared/src/utils/`: `cn` class merger, date formatting helpers.
  - `packages/shared/src/config/`: `class-type-config.ts`.
- **What Should NOT Belong There**:
  - UI JSX components (`button.tsx`, `sheet.tsx`) should remain inside web app packages to avoid complex bundler setups.

---

## Files Safe to Move

1. `apps/web/app/member/` -> `apps/member-web/app/`
2. `apps/web/src/components/member/` -> `apps/member-web/src/components/`
3. `apps/web/src/services/member/` -> `apps/member-web/src/services/`
4. `apps/web/src/hooks/member/` -> `apps/member-web/src/hooks/`
5. `apps/web/public/assets/member/` -> `apps/member-web/public/assets/`
6. `apps/web/src/types/member-app.ts` -> `apps/member-web/src/types/`
7. `apps/web/src/utils/member-format.ts` -> `apps/member-web/src/utils/`

---

## Files Requiring Care

1. `apps/web/src/lib/api-client.ts`: Needs independent token storage keys (`gympulse_token` for owner vs `gympulse_member_token` for member).
2. `apps/web/src/components/ui/*`: Primitive components must be co-located or extracted into `@gympulse/ui`.

---

## Files That Should Stay

1. `apps/api/` (Standalone, perfectly isolated REST API).
2. `database/` (PostgreSQL DDL schema & migrations).
3. `docs/` (System documentation).
4. `infrastructure/` (Cloud deployment configuration).

---

## Recommended Migration Order

1. **Phase 1 — Workspace Shared Package Setup**: Add `packages/shared/package.json` and export common TS interfaces.
2. **Phase 2 — Member Web Extraction**: Create `apps/member-web/` and move `app/member/`, `components/member/`, `services/member/`, `hooks/member/`.
3. **Phase 3 — Owner Web Extraction**: Rename remaining `apps/web/` to `apps/owner-web/`.
4. **Phase 4 — Independent Builds**: Configure `npm run dev` and `npm run build` scripts for both apps independently.
5. **Phase 5 — End-to-End Regression Verification**: Run `npx tsc --noEmit` and database integration suites.

---

## Risk Assessment

- **Low Risk**: Member Web and Owner Web code are already 95%+ decoupled with zero cross-imports.
- **Mitigation**: Updating `@/*` TypeScript aliases during extraction ensures 100% build safety.

---

## Final Recommendation

Proceed with setting up `packages/shared` first, followed by clean extraction of `apps/member-web` and `apps/owner-web` when refactoring commences.
