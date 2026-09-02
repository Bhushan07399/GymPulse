# Owner Web Extraction Report

**Extraction Date**: September 2, 2026  
**Status**: **COMPLETED & VERIFIED**  
**Extracted Workspace**: `apps/owner-web/`

---

## What Was Extracted

1. **Owner App Routes (`apps/owner-web/app/`)**:
   - `/dashboard` (Operational Overview & KPI Metric Cards)
   - `/dashboard/attendance` (Check-in Ledger & Manual Check-in)
   - `/dashboard/business-analytics` (Revenue Breakdowns & Growth Metrics)
   - `/dashboard/classes` (Group Class Scheduler & Enrolled Members)
   - `/dashboard/gym-qr` (Reception QR Poster Generator)
   - `/dashboard/members` (Member CRUD & Plan Assignment)
   - `/dashboard/membership-plans` (Plan Pricing Grid)
   - `/dashboard/payments` (Financial Payments Ledger & Invoices)
   - `/dashboard/reception` (Reception Desk Fast Scanner)
   - `/dashboard/reports` (Financial & Attendance Export Reports)
   - `/dashboard/settings` (Gym Profile, Branding, GSTIN, Operating Hours)
   - `/dashboard/staff` (Staff Accounts & RBAC Roles)
   - `/dashboard/whatsapp` (WhatsApp Automation, Logs, Templates, Broadcasts)
   - `/login` (Owner & Staff Login Portal)
   - `/create-account` (Gym Onboarding Registration)
   - `/subscription` (SaaS Subscription Tier Billing)
   - Root role-selection page (`app/page.tsx`).

2. **Owner Components (`apps/owner-web/src/components/`)**:
   - `protected-dashboard-layout.tsx` (Sidebar Navigation & Header)
   - `analytics/`, `attendance/`, `classes/`, `dashboard/`, `members/`, `membership-plans/`, `payments/`, `subscription/`, `common/plan-locked-state.tsx`.
   - Primitive UI components (`src/components/ui/` - Badge, Button, Card, Dialog, Input, Select, Sheet, Table, Tabs).

3. **Owner Services & Utilities (`apps/owner-web/src/services/` & `src/lib/`)**:
   - Management Services: `members.service.ts`, `payments.service.ts`, `attendance.service.ts`, `classes.service.ts`, `gym-settings.service.ts`, `whatsapp.service.ts`, `reports.service.ts`, `staff.service.ts`, `dashboard.service.ts`, `auth.service.ts`, `bmi.service.ts`, `class-plans.service.ts`.
   - `src/lib/api-client.ts` (Configured to attach `gympulse_token` in `Authorization` headers).
   - `src/lib/utils.ts` & `src/lib/subscription-state.ts`.
   - `src/config/class-type-config.ts` & `src/types/api.ts`.

4. **Public Assets (`apps/owner-web/public/`)**:
   - All management icons, logos, and entry page visuals. Leftover `public/assets/member/` excluded.

---

## Final Owner Web Structure

```text
apps/owner-web/
├── app/
│   ├── dashboard/ (13 management routes & layout)
│   ├── login/
│   ├── create-account/
│   ├── subscription/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx (Role selection entry page)
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   ├── attendance/
│   │   ├── classes/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── membership-plans/
│   │   ├── payments/
│   │   ├── subscription/
│   │   ├── protected-dashboard-layout.tsx
│   │   ├── providers.tsx
│   │   └── ui/ (Shadcn/Radix primitive UI)
│   ├── config/
│   ├── lib/
│   │   ├── api-client.ts (Owner JWT token handler)
│   │   └── utils.ts
│   ├── services/ (12 management API services)
│   └── types/
│       ├── api.ts
│       └── member.ts
├── public/
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Shared Dependencies

- UI primitives (`src/components/ui/*`) are co-located in `apps/owner-web/src/components/ui/`.
- Axios HTTP client (`src/lib/api-client.ts`) attaches `gympulse_token` in `Authorization` headers.

---

## Authentication

- **Session Token**: `localStorage.getItem("gympulse_token")`
- **User Record**: `localStorage.getItem("gympulse_user")`
- **Gym Details**: `localStorage.getItem("gympulse_gym")`
- **Protected Layout**: `ProtectedDashboardLayout` validates token and redirects unauthenticated users to `/login`.

---

## Environment Variables

Created `apps/owner-web/.env.example`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Verification & Test Results

1. **TypeScript Verification (`apps/owner-web/`)**:
   - `node node_modules/typescript/bin/tsc --noEmit` -> **PASS (0 errors)**.

2. **Production Build (`apps/owner-web/`)**:
   - `npm run build` -> **PASS (0 errors, 19 static pages prerendered)**.

3. **Owner Real Data QA (`scratch/real_data_integration_test.js`)**:
   - **PASS (6 / 6)**: Revenue calculations, class revenue isolation, period analytics, member count increment, and tenant security isolation verified against database.

4. **Member Web Regression QA (`scratch/test_member_web_qa.js`)**:
   - **PASS (15 / 15)**: Confirmed `apps/member-web/` functions with 0 errors.

---

## Legacy `apps/web/` Status

- Preserved intact as safe rollback source.

---

## Final Status

**OWNER WEB EXTRACTION FULLY SUCCESSFUL & PRODUCTION BUILD VERIFIED**.
