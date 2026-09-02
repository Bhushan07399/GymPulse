# Member Web Extraction Report

**Extraction Date**: September 2, 2026  
**Status**: **COMPLETED & VERIFIED**  
**Extracted Workspace**: `apps/member-web/`

---

## What Was Extracted

1. **Member Routes (`apps/member-web/app/member/`)**:
   - `/member/login` (Member OTP / Member ID login portal)
   - `/member/dashboard` (Digital member pass, streak counter, crowd status)
   - `/member/announcements` (Gym notices & news feed)
   - `/member/attendance` (Personal check-in ledger)
   - `/member/classes` (Class schedules & booking)
   - `/member/crowd` (Real-time gym capacity gauge)
   - `/member/goals` (Fitness target tracking)
   - `/member/measurements` (Body measurements & weight log)
   - `/member/member-card` (Full-screen digital QR pass)
   - `/member/membership` (Plan status & renewal countdown)
   - `/member/notifications` (Member alerts & notification history)
   - `/member/payments` (Personal receipts & dues history)
   - `/member/profile` (Member profile & emergency contact)
   - `/member/progress` (Progress charts & BMI reports)
   - `/member/scan` (Native QR camera scanner)
   - `/member/settings` (Member app preferences)
   - `/member/workout` (Workout library & exercise logger)
   - Root redirect (`app/page.tsx`) sending `/` to `/member/dashboard`.

2. **Member React Components (`apps/member-web/src/components/member/`)**:
   - `attendance/` (`member-attendance-view.tsx`)
   - `common/` (`empty-state.tsx`, `error-state.tsx`, `loading-state.tsx`, `plan-locked-state.tsx`)
   - `dashboard/` (`attendance-card.tsx`, `classes-card.tsx`, `crowd-card.tsx`, `member-dynamic-hero.tsx`, `membership-card.tsx`, `payment-card.tsx`, `progress-card.tsx`)
   - `layout/` (`member-bottom-nav.tsx`, `member-header.tsx`, `member-layout-wrapper.tsx`)
   - `membership/` (`member-membership-view.tsx`)
   - `payments/` (`member-payments-view.tsx`)
   - `progress/` (`member-progress-view.tsx`)

3. **Member Services & Hooks (`apps/member-web/src/services/` & `src/hooks/`)**:
   - `src/services/member-api.service.ts`
   - `src/services/member-classes.service.ts`
   - `src/hooks/use-member-auth.tsx`
   - `src/utils/member-format.ts`
   - `src/types/member-app.ts`
   - `src/data/workout-library.ts`

4. **Member Assets (`apps/member-web/public/assets/member/`)**:
   - All member illustration graphics, badges, and card backgrounds.

---

## New Structure

```text
apps/member-web/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx (Redirects to /member/dashboard)
│   └── member/ (17 member app routes)
├── src/
│   ├── components/
│   │   ├── member/
│   │   ├── providers.tsx
│   │   └── ui/ (Badge, Button, Card, Dialog, Sheet, Table, Tabs)
│   ├── config/
│   │   └── class-type-config.ts
│   ├── data/
│   │   └── workout-library.ts
│   ├── hooks/
│   │   └── use-member-auth.tsx
│   ├── lib/
│   │   ├── api-client.ts (Member JWT bearer interceptor)
│   │   └── utils.ts
│   ├── services/
│   │   ├── member-api.service.ts
│   │   └── member-classes.service.ts
│   ├── types/
│   │   ├── api.ts
│   │   └── member-app.ts
│   └── utils/
│       └── member-format.ts
├── public/
│   └── assets/member/
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Shared Dependencies

- UI primitives (`src/components/ui/`) have been safely co-located inside `apps/member-web/src/components/ui/`.
- Axios HTTP client (`src/lib/api-client.ts`) is configured to send `gympulse_member_token` in `Authorization` headers.

---

## Authentication

- **Session Key**: `localStorage.getItem("gympulse_member_token")`
- **Member Profile**: `localStorage.getItem("gympulse_member")`
- **Route Guard**: `MemberLayoutWrapper` evaluates `useMemberAuth()` and redirects unauthenticated visitors to `/member/login`.

---

## Environment Configuration

Created `apps/member-web/.env.example`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Import Changes

- All imports inside `apps/member-web` use `@/*` path aliases pointing to `apps/member-web` root.
- Re-export bridges (`src/hooks/member/` and `src/services/member/`) guarantee 100% backwards-compatible import resolution.

---

## Tests Performed & Real Data QA

1. **TypeScript Verification**:
   - `apps/member-web`: `tsc --noEmit` -> **PASS (0 errors)**.
   - `apps/web` (Owner Web): `tsc --noEmit` -> **PASS (0 errors)**.

2. **Real Data Member Web QA (`scratch/test_member_web_qa.js`)**:
   - **PASS (15 / 15)**: Member login, dashboard profile query, membership plan status, attendance ledger, class bookings, payments receipts, digital pass QR token, workout library, progress metrics, and route guards verified against PostgreSQL database.

3. **Owner Web Regression**:
   - **PASS (6 / 6)**: `scratch/real_data_integration_test.js` executed with 0 errors, confirming Owner Web management functionality in `apps/web` is 100% unaffected.

---

## Known Issues

- **None**.

---

## Rollback Information

If rollback is required, `apps/member-web` can be removed or reverted via Git. `apps/web` remains functional.

---

## Final Status

**MEMBER WEB EXTRACTION FULLY SUCCESSFUL**.
