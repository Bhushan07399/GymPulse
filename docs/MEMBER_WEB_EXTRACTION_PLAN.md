# GymPulse — Member Web Extraction Plan

**Planning Date**: September 2, 2026  
**Target Application**: `apps/member-web/`  
**Purpose**: Step-by-step technical plan to extract the Gym Member Web Portal from `apps/web/` into a dedicated, production-ready Next.js application without breaking Owner Web or backend functionality.

---

## 1. Exact Member File List

The following files and directories in `apps/web/` will be moved to `apps/member-web/`:

### App Router Routes (`apps/web/app/member/` -> `apps/member-web/app/member/`)
- `app/member/layout.tsx` (Member mobile bottom-navigation & header wrapper)
- `app/member/page.tsx` (Root member route redirect)
- `app/member/login/page.tsx` (Member OTP / Member ID login portal)
- `app/member/dashboard/page.tsx` (Digital member pass, streak counter, crowd status)
- `app/member/announcements/page.tsx` (Gym notices & news feed)
- `app/member/attendance/page.tsx` (Personal attendance history)
- `app/member/classes/page.tsx` (Group class booking & schedule)
- `app/member/crowd/page.tsx` (Real-time gym occupancy gauge)
- `app/member/goals/page.tsx` (Fitness target tracking)
- `app/member/measurements/page.tsx` (Body measurements & weight log)
- `app/member/member-card/page.tsx` (Full-screen digital QR pass)
- `app/member/membership/page.tsx` (Membership plan status & renewal countdown)
- `app/member/notifications/page.tsx` (Member notification history)
- `app/member/payments/page.tsx` (Personal payment receipts & history)
- `app/member/profile/page.tsx` (Member profile & emergency contact)
- `app/member/progress/page.tsx` (Progress charts & BMI reports)
- `app/member/scan/page.tsx` (Native QR camera scanner)
- `app/member/settings/page.tsx` (Member app preferences)
- `app/member/workout/page.tsx` (Workout library & exercise logger)

### Member React Components (`apps/web/src/components/member/` -> `apps/member-web/src/components/`)
- `src/components/member/attendance/` (`member-attendance-view.tsx`)
- `src/components/member/common/` (`empty-state.tsx`, `error-state.tsx`, `loading-state.tsx`, `plan-locked-state.tsx`)
- `src/components/member/dashboard/` (`attendance-card.tsx`, `classes-card.tsx`, `crowd-card.tsx`, `member-dynamic-hero.tsx`, `membership-card.tsx`, `payment-card.tsx`, `progress-card.tsx`)
- `src/components/member/layout/` (`member-bottom-nav.tsx`, `member-header.tsx`, `member-layout-wrapper.tsx`)
- `src/components/member/membership/` (`member-membership-view.tsx`)
- `src/components/member/payments/` (`member-payments-view.tsx`)
- `src/components/member/progress/` (`member-progress-view.tsx`)

### Member Services & Hooks (`apps/web/src/services/member/` -> `apps/member-web/src/services/`)
- `src/services/member/member-api.service.ts`
- `src/services/member/member-auth.service.ts`
- `src/services/member/member-classes.service.ts`
- `src/hooks/member/use-member-auth.tsx`
- `src/hooks/member/use-member-dashboard.ts`
- `src/utils/member-format.ts`
- `src/types/member-app.ts`

### Member Public Assets (`apps/web/public/assets/member/` -> `apps/member-web/public/assets/`)
- All member illustration assets, badges, and avatars.

---

## 2. Required Root Files

To create `apps/member-web/` as an independent Next.js project, the following root/configuration files will be set up:

| File Name | Strategy | Description |
|---|---|---|
| `package.json` | **Recreate** | Copy dependencies (`next`, `react`, `react-dom`, `@tanstack/react-query`, `axios`, `lucide-react`, `framer-motion`, `react-hot-toast`, `tailwindcss`, `typescript`). Name set to `"name": "member-web"`. |
| `tsconfig.json` | **Copy & Modify** | Copy from `apps/web` and configure `@/*` alias pointing to `./src/*` and `./app/*`. |
| `next.config.ts` | **Copy** | Standard Next.js configuration. |
| `postcss.config.mjs` | **Copy** | Tailwind CSS v4 PostCSS plugin setup. |
| `app/globals.css` | **Copy** | Tailwind CSS global styling rules and custom font definitions. |
| `app/layout.tsx` | **Recreate** | Root HTML container, metadata (`title: "GymPulse Member Portal"`), and provider wrapper. |
| `src/components/providers.tsx` | **Copy** | TanStack React Query + React Hot Toast provider context. |
| `src/lib/api-client.ts` | **Copy & Adjust** | Axios HTTP client configured to send `gympulse_member_token` in `Authorization` headers. |
| `src/lib/utils.ts` | **Copy** | Tailwind `cn` class merger helper. |
| `public/favicon.ico` | **Copy** | Member portal browser favicon. |

---

## 3. Shared Dependencies Classification

| Dependency | Classification | Handling Strategy |
|---|---|---|
| `src/components/ui/*` (`button`, `card`, `dialog`, `sheet`, `tabs`, `badge`, `input`, `select`, `table`) | **A. Must be shared / B. Temporarily duplicated** | Copy to `apps/member-web/src/components/ui/`. Eventually move to `@gympulse/ui` package. |
| `src/lib/api-client.ts` | **B. Can remain duplicated** | Co-locate in `apps/member-web/src/lib/api-client.ts` configured for member JWT token key (`gympulse_member_token`). |
| `src/lib/utils.ts` | **C. Should move to packages/shared** | Copy to `apps/member-web/src/lib/utils.ts` initially; move to `@gympulse/shared` in Phase 4. |
| `src/types/api.ts` | **C. Should move to packages/shared** | Copy `ApiResponse<T>` interface to `apps/member-web/src/types/api.ts`. |
| `src/config/class-type-config.ts` | **C. Should move to packages/shared** | Copy class icon mapping to `apps/member-web/src/config/class-type-config.ts`. |
| `app/globals.css` | **B. Temporarily duplicated** | Copy global CSS to `apps/member-web/app/globals.css`. |

---

## 4. Import Changes Map

Because `apps/member-web` will use the standard `@/*` path alias pointing to its own root, import paths remain extremely clean:

| Source File | Current Import | Expected Import After Extraction |
|---|---|---|
| `app/member/dashboard/page.tsx` | `import { getMemberDashboard } from "@/src/services/member/member-api.service";` | `import { getMemberDashboard } from "@/src/services/member-api.service";` |
| `app/member/dashboard/page.tsx` | `import { MemberLayoutWrapper } from "@/src/components/member/layout/member-layout-wrapper";` | `import { MemberLayoutWrapper } from "@/src/components/layout/member-layout-wrapper";` |
| `app/member/classes/page.tsx` | `import { getClassTypeConfig } from "@/src/config/class-type-config";` | `import { getClassTypeConfig } from "@/src/config/class-type-config";` (No change) |
| `app/member/attendance/page.tsx` | `import { formatMemberDate } from "@/src/utils/member-format";` | `import { formatMemberDate } from "@/src/utils/member-format";` (No change) |
| `src/components/member/dashboard/membership-card.tsx` | `import { Badge } from "@/src/components/ui/badge";` | `import { Badge } from "@/src/components/ui/badge";` (No change) |

---

## 5. Asset Paths Audit

- **Asset Directory**: `apps/web/public/assets/member/`
- **Asset References**: Member components reference `/assets/member/card-bg.png`, `/assets/member/streak-flame.svg`, `/assets/member/qr-badge.png`.
- **Extraction Handling**: Move `public/assets/member/` to `apps/member-web/public/assets/member/`. All relative root image paths (`/assets/member/...`) remain 100% valid with zero path breakages.

---

## 6. API Configuration

- **API Endpoint Base**: `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api/v1`).
- **HTTP Client**: Axios instance in `apps/member-web/src/lib/api-client.ts`.
- **Authentication Header**:
  ```typescript
  apiClient.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("gympulse_member_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

---

## 7. Authentication Flow

- **Login Route**: `app/member/login/page.tsx`
- **Auth Service**: `src/services/member/member-auth.service.ts`
- **Auth Hook**: `src/hooks/member/use-member-auth.tsx`
- **Session Keys**:
  - Token: `localStorage.setItem("gympulse_member_token", token)`
  - Profile: `localStorage.setItem("gympulse_member", JSON.stringify(member))`
- **Route Guard**: `MemberLayoutWrapper` evaluates `useMemberAuth()`. Unauthenticated requests redirect to `/member/login`.

---

## 8. Next.js Routing Strategy

During extraction to `apps/member-web`:
- **Preserved Route Pattern**: Retain `/member/*` routes (`/member/login`, `/member/dashboard`, `/member/scan`, `/member/membership`) for 100% backwards compatibility.
- **Root Entry Point (`app/page.tsx`)**: `apps/member-web/app/page.tsx` automatically redirects visitors from `/` to `/member/dashboard` or `/member/login`.
- **Domain Deployment Target**: Can be deployed at `member.gympulse.in` or as a sub-path on reverse proxy.

---

## 9. Owner Web Impact Assessment

- **Owner Web Dependencies on Member Code**: **ZERO**.
- **Shared Primitives Required by Owner Web**: Owner Web in `apps/web` (renamed to `apps/owner-web`) retains all of its own `src/components/ui/`, `src/services/`, and `app/dashboard/` routes intact.
- **Regression Risk for Owner Web**: **ZERO**.

---

## 10. Step-by-Step Migration Order

1. **Step 1 — Create `apps/member-web` Shell**: Initialize folder structure and copy `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`.
2. **Step 2 — Move Member Routes**: Move `apps/web/app/member/` to `apps/member-web/app/member/`.
3. **Step 3 — Move Member Components**: Move `apps/web/src/components/member/` to `apps/member-web/src/components/`.
4. **Step 4 — Move Member Services & Hooks**: Move `apps/web/src/services/member/`, `apps/web/src/hooks/member/`, `apps/web/src/utils/member-format.ts`, `apps/web/src/types/member-app.ts`.
5. **Step 5 — Copy Shared UI Primitives**: Copy `src/components/ui/`, `src/lib/api-client.ts`, `src/lib/utils.ts`, `src/config/class-type-config.ts`, `src/components/providers.tsx`.
6. **Step 6 — Copy Public Assets**: Move `apps/web/public/assets/member/` to `apps/member-web/public/assets/member/`.
7. **Step 7 — Configure Member HTTP Client**: Ensure `api-client.ts` dereferences `gympulse_member_token`.
8. **Step 8 — Rename `apps/web` to `apps/owner-web`**: Rename remaining directory and clean up orphan references.
9. **Step 9 — Run TypeScript Check**: Execute `npx tsc --noEmit` in both `apps/member-web` and `apps/owner-web`.
10. **Step 10 — Member Web QA Verification**: Test login, digital pass, QR scanner, workout logger, and payment history in `apps/member-web`.
11. **Step 11 — Owner Web Regression QA**: Run `scratch/real_data_integration_test.js` to confirm zero breakages in `apps/owner-web`.

---

## 11. Rollback Plan

If any unexpected compilation issue occurs during extraction:
1. Revert Git working directory to the commit prior to extraction.
2. The current `apps/web` structure is preserved in Git history as a fully functional single codebase.

---

## 12. Risk Level Assessment

| Area | Risk Level | Rationale / Mitigation |
|---|---|---|
| **Member Routes & Pages** | **LOW** | 100% isolated inside `app/member/`. |
| **Member Services & Hooks** | **LOW** | 100% isolated inside `src/services/member/` and `src/hooks/member/`. |
| **Shared Primitives Copying** | **LOW** | `components/ui/` primitives are standard React components with no side effects. |
| **Authentication Session Keys** | **LOW** | Uses isolated `gympulse_member_token` key in `localStorage`. |
| **Owner Web Impact** | **ZERO** | Owner Web code contains zero imports of member code. |

---

## 13. Final Recommendation

**Extraction Feasibility**: **HIGHLY SAFE & READY FOR EXTRACTION**.

Because Member Web and Owner Web code are already 95%+ decoupled with **zero cross-imports**, extracting `apps/member-web` can be executed cleanly following the 11-step migration sequence above without risking regression to Owner Web, backend API, or database operations.
