# GymPulse Project Structure Audit Report

**Date of Audit**: September 2, 2026  
**Audited Repository**: `GymPulse` (`c:\Users\bhush\OneDrive\Desktop\GymPulse`)

---

## 1. Current Complete Project Structure

```text
GymPulse/
├── .git/
├── ASSET_LICENSES.md
├── GYMPULSE_MEMBER_APP.md
├── README.md
├── apps/
│   ├── api/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   └── src/
│   └── web/
│       ├── .gitignore
│       ├── .next/
│       ├── AGENTS.md
│       ├── CLAUDE.md
│       ├── README.md
│       ├── app/
│       ├── eslint.config.mjs
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── package-lock.json
│       ├── page.tsx                     (MISPLACED / DUPLICATE)
│       ├── postcss.config.mjs
│       ├── public/
│       ├── src/
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
├── database/
│   ├── migrations/
│   │   ├── 20260808_add_gym_settings.sql
│   │   └── 20260808_add_member_id.sql
│   ├── schema.sql
│   └── seed.sql
├── docs/                               (EMPTY SUBDIRECTORIES)
│   ├── api/
│   ├── architecture/
│   └── runbooks/
├── infrastructure/                     (EMPTY SUBDIRECTORIES)
│   ├── docker/
│   ├── k8s/
│   ├── monitoring/
│   └── terraform/
├── packages/                           (EMPTY UNUSED MONOREPO PLACEHOLDER)
│   └── shared/
│       └── src/
│           ├── types/
│           └── utils/
├── prisma/
│   └── schema.prisma
├── scratch/
│   ├── qa_test_runner.js
│   └── real_data_integration_test.js
└── tests/                              (EMPTY SUBDIRECTORIES)
    ├── e2e/
    ├── integration/
    └── unit/
```

---

## 2. `apps/api` Structure

`apps/api` is a Node.js Express REST API connecting to PostgreSQL via `pg` connection pool.

```text
apps/api/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── src/
    ├── app.js                          (Express app initialization & middleware configuration)
    ├── server.js                       (Server entry point & HTTP listener)
    ├── config/
    │   ├── env.js                      (Environment variable schema & assertion)
    │   └── logger.js                   (Application logger setup)
    ├── controllers/                    (15 REST controller modules)
    ├── db/
    │   ├── migrate.js                  (Database schema migration executor)
    │   └── pool.js                     (PostgreSQL pg pool instance)
    ├── middleware/                     (6 Express custom middleware handlers)
    ├── models/                         (EMPTY DIRECTORY)
    ├── repositories/                   (17 Data access modules executing PostgreSQL queries)
    ├── routes/                         (16 Express route modules + index router)
    ├── services/                       (16 Service modules encapsulating business logic)
    ├── utils/                          (Error formatting & pagination helpers)
    └── validations/                    (10 Joi input validation schema modules)
```

---

## 3. `apps/web` Structure

`apps/web` is a Next.js (App Router) web application serving both the Gym Management Dashboard and Member Web Interface.

```text
apps/web/
├── .gitignore
├── .next/                              (Next.js dev/build cache)
├── AGENTS.md
├── CLAUDE.md                           (EMPTY 11-BYTE PLACEHOLDER)
├── README.md
├── app/                                (Next.js App Router routes)
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                        (Public landing page)
│   ├── create-account/page.tsx
│   ├── login/page.tsx
│   ├── subscription/page.tsx
│   ├── dashboard/                      (Management Web Application routes)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── business-analytics/page.tsx
│   │   ├── classes/page.tsx
│   │   ├── gym-qr/page.tsx
│   │   ├── members/page.tsx
│   │   ├── membership-plans/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── reception/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── staff/page.tsx
│   │   └── whatsapp/page.tsx
│   └── member/                         (Member Web Application routes)
│       ├── layout.tsx
│       ├── page.tsx
│       ├── announcements/page.tsx
│       ├── attendance/page.tsx
│       ├── classes/page.tsx
│       ├── crowd/page.tsx
│       ├── dashboard/page.tsx
│       ├── goals/page.tsx
│       ├── login/page.tsx
│       ├── measurements/page.tsx
│       ├── member-card/page.tsx
│       ├── membership/page.tsx
│       ├── notifications/page.tsx
│       ├── payments/page.tsx
│       ├── profile/page.tsx
│       ├── progress/page.tsx
│       ├── scan/page.tsx
│       ├── settings/page.tsx
│       └── workout/page.tsx
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── page.tsx                            (MISPLACED / ORPHANED FILE IN WEB ROOT)
├── postcss.config.mjs
├── public/
│   ├── assets/member/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/                                (React components, state, & service client layer)
│   ├── components/
│   │   ├── protected-dashboard-layout.tsx
│   │   ├── providers.tsx
│   │   ├── analytics/
│   │   ├── attendance/
│   │   ├── classes/
│   │   ├── dashboard/
│   │   ├── member/
│   │   ├── members/
│   │   ├── membership-plans/
│   │   ├── payments/
│   │   ├── subscription/
│   │   └── ui/
│   ├── config/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── utils/
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

---

## 4. Backend Architecture Details (`apps/api`)

- **Controllers** (`apps/api/src/controllers/`):
  - `attendance.controller.js`, `auth.controller.js`, `bmi.controller.js`, `class-plans.controller.js`, `classes.controller.js`, `dashboard.controller.js`, `gym.controller.js`, `health.controller.js`, `member-app.controller.js`, `member.controller.js`, `membership-plan.controller.js`, `payment.controller.js`, `report.controller.js`, `staff.controller.js`, `whatsapp.controller.js`.
- **Routes** (`apps/api/src/routes/`):
  - `index.js` (main router mounting all modular routers under `/api/v1/*`), `attendance.routes.js`, `auth.routes.js`, `bmi.routes.js`, `class-plans.routes.js`, `classes.routes.js`, `dashboard.routes.js`, `gym.routes.js`, `health.routes.js`, `member-app.routes.js`, `member.routes.js`, `membership-plan.routes.js`, `payment.routes.js`, `report.routes.js`, `staff.routes.js`, `whatsapp.routes.js`.
- **Services** (`apps/api/src/services/`):
  - `attendance.service.js`, `auth.service.js`, `base.service.js`, `bmi.service.js`, `classes.service.js`, `dashboard.service.js`, `gym.service.js`, `member-app.service.js`, `member.service.js`, `membership-plan.service.js`, `notification-scheduler.service.js`, `payment.service.js`, `report.service.js`, `revenue-analytics.service.js`, `staff.service.js`, `whatsapp.service.js`.
- **Repositories** (`apps/api/src/repositories/`):
  - `attendance.repository.js`, `auth.repository.js`, `base.repository.js`, `bmi.repository.js`, `class-memberships.repository.js`, `class-plans.repository.js`, `classes.repository.js`, `dashboard.repository.js`, `gym.repository.js`, `member-app.repository.js`, `member.repository.js`, `membership-plan.repository.js`, `notification.repository.js`, `payment.repository.js`, `report.repository.js`, `staff.repository.js`, `whatsapp.repository.js`.
- **Validations** (`apps/api/src/validations/`):
  - Joi schemas: `attendance.validation.js`, `auth.validation.js`, `gym.validation.js`, `list-query.validation.js`, `member-app.validation.js`, `member.validation.js`, `membership-plan.validation.js`, `payment.validation.js`, `report.validation.js`, `validate.js`.
- **Database & Migrations**:
  - `database/schema.sql`: Full DDL database initialization schema.
  - `database/seed.sql`: Initial seed data script.
  - `database/migrations/`: Dedicated SQL migration scripts (`20260808_add_gym_settings.sql`, `20260808_add_member_id.sql`).
  - `apps/api/src/db/migrate.js`: Programmatic database migrator executed on app boot.
  - `apps/api/src/db/pool.js`: Centralized PostgreSQL client pool initialization using standard `pg.Pool`.
- **Middleware** (`apps/api/src/middleware/`):
  - `async-handler.js`, `authenticate.js` (JWT bearer authentication), `authorize-plan-feature.js` (subscription feature flags), `authorize.js` (RBAC), `error-handler.js`, `not-found.js`.
- **Configuration** (`apps/api/src/config/`):
  - `env.js`: Strongly-typed process.env validation and runtime assertion.
  - `logger.js`: Winston/Console logging configuration.

---

## 5. Frontend Architecture Details (`apps/web`)

- **Pages / Routes** (`apps/web/app/`):
  - Public pages: `/`, `/login`, `/create-account`, `/subscription`.
  - Management App (`/dashboard/*`): Operational home dashboard, members management, attendance system, payments ledger, business analytics, classes/schedules, WhatsApp automation, reports, staff management, reception scanner, gym QR code, gym settings.
  - Member Web Interface (`/member/*`): Member login, dashboard home, attendance history, membership plan details, payment history, workout library, measurements/BMI, goals, announcements, notifications, profile, settings.
- **Components** (`apps/web/src/components/`):
  - Module components: `analytics/`, `attendance/`, `classes/`, `dashboard/`, `members/`, `membership-plans/`, `payments/`, `subscription/`, `ui/`.
  - Member Portal components (`src/components/member/`): `attendance/`, `common/`, `dashboard/`, `layout/`, `membership/`, `payments/`, `progress/`.
- **Hooks** (`apps/web/src/hooks/`):
  - `member/use-member-auth.tsx`: Custom React context hook managing member web app authentication state.
- **Services / API** (`apps/web/src/services/`):
  - Axios HTTP client (`apps/web/src/lib/api-client.ts`).
  - Web services: `attendance.service.ts`, `auth.service.ts`, `bmi.service.ts`, `class-plans.service.ts`, `classes.service.ts`, `dashboard.service.ts`, `gym-settings.service.ts`, `members.service.ts`, `membership-plans.service.ts`, `payments.service.ts`, `reports.service.ts`, `staff.service.ts`, `whatsapp.service.ts`.
- **UI Components** (`apps/web/src/components/ui/`):
  - `mobile-bottom-sheet.tsx`: Reusable drawer bottom sheet modal with framer-motion slide-up animation.
- **Assets** (`apps/web/public/`):
  - `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, `public/assets/member/`.

---

## 6. Existing Documentation

- `README.md` (Workspace root description)
- `ASSET_LICENSES.md` (Media and asset licensing credits)
- `GYMPULSE_MEMBER_APP.md` (Specification document for the Member Web Experience)
- `apps/web/README.md`, `apps/web/AGENTS.md`

*Empty Documentation Folders*:
- `docs/api/` (empty)
- `docs/architecture/` (empty)
- `docs/runbooks/` (empty)

---

## 7. Existing Scripts

- **Backend (`apps/api/package.json`)**:
  - `npm run start`: Starts Node server (`node src/server.js`)
  - `npm run dev`: Runs server with nodemon (`nodemon src/server.js`)
- **Frontend (`apps/web/package.json`)**:
  - `npm run dev`: Starts Next.js development server
  - `npm run build`: Compiles production build
  - `npm run check`: Executes TypeScript compiler (`tsc --noEmit`) and ESLint checks
- **Developer Test Scripts**:
  - `scratch/qa_test_runner.js`: API endpoint validation script
  - `scratch/real_data_integration_test.js`: PostgreSQL database integration test suite

---

## 8. Existing Tests

- `scratch/qa_test_runner.js`: Automated API test runner.
- `scratch/real_data_integration_test.js`: Direct database integration test runner verifying metrics and tenant scoping.

*Empty Test Directory Structure*:
- `tests/e2e/` (empty)
- `tests/integration/` (empty)
- `tests/unit/` (empty)

---

## 9. Generated / Cache / Build Folders

- `apps/web/.next/`: Next.js build cache & dev compilation artifacts.
- `apps/web/tsconfig.tsbuildinfo`: TypeScript build cache file.
- `apps/api/node_modules/` & `apps/web/node_modules/`: Local node package installations.

---

## 10. Duplicate or Suspicious Files

1. **`apps/web/page.tsx`**:
   - **Location**: `c:\Users\bhush\OneDrive\Desktop\GymPulse\apps\web\page.tsx`
   - **Finding**: Misplaced duplicate file sitting directly under `apps/web/`. The actual landing page route used by Next.js App Router is located at `apps/web/app/page.tsx`.
2. **`apps/web/CLAUDE.md`**:
   - **Location**: `c:\Users\bhush\OneDrive\Desktop\GymPulse\apps\web\CLAUDE.md`
   - **Finding**: 11-byte empty placeholder file.

---

## 11. Temporary Development Files

- `scratch/qa_test_runner.js`
- `scratch/real_data_integration_test.js`

---

## 12. Misplaced Files

- `apps/web/page.tsx`: Belongs nowhere in root `apps/web/` since `apps/web/app/page.tsx` is the real App Router page.

---

## 13. Files/Folders That Could Safely Be Reorganized or Cleaned

- **Empty Placeholder Directories**:
  - `docs/api`, `docs/architecture`, `docs/runbooks`
  - `infrastructure/docker`, `infrastructure/k8s`, `infrastructure/monitoring`, `infrastructure/terraform`
  - `packages/shared/src/types`, `packages/shared/src/utils`, `packages/shared/src`, `packages/shared`, `packages`
  - `tests/e2e`, `tests/integration`, `tests/unit`, `tests`
  - `apps/api/src/models`
- **Orphaned / Empty Files**:
  - `apps/web/page.tsx` (misplaced root duplicate)
  - `apps/web/CLAUDE.md` (empty file)

---

## 14. Files/Folders That Should NOT Be Moved

- `apps/api/src/app.js`, `apps/api/src/server.js`
- `apps/api/src/controllers/`, `apps/api/src/routes/`, `apps/api/src/services/`, `apps/api/src/repositories/`, `apps/api/src/middleware/`, `apps/api/src/config/`, `apps/api/src/db/`
- `apps/web/app/` (Next.js App Router pages and layouts)
- `apps/web/src/components/`, `apps/web/src/services/`, `apps/web/src/lib/`, `apps/web/src/hooks/`, `apps/web/src/types/`, `apps/web/src/utils/`
- `database/schema.sql`, `database/seed.sql`, `database/migrations/`
- `prisma/schema.prisma`

---

## 15. Files Where Moving Them Could Break Imports/Configuration

- `apps/web/src/lib/api-client.ts`: Referenced across all web services via `@/src/lib/api-client`.
- `apps/api/src/db/pool.js`: Referenced across all repositories via relative imports (`../db/pool`).
- `apps/api/src/config/env.js`: Imported at entry points (`app.js`, `server.js`).
- Next.js page files under `apps/web/app/**/page.tsx`: Moving any `page.tsx` file changes or breaks web routes.

---

## 16. Recommended Simple Professional Structure

Keep a clean, straightforward structure:
- **`apps/api/`**: Express.js REST API server.
- **`apps/web/`**: Next.js App Router web application (Management Dashboard + Member Web Portal).
- **`database/`**: SQL schemas and migration scripts.
- **`scratch/`**: Developer test scripts.
- Remove empty unreferenced directories (`docs/`, `infrastructure/`, `packages/`, `tests/`, `apps/api/src/models/`).

---

## 17. Recommended Final Folder Tree

```text
GymPulse/
├── ASSET_LICENSES.md
├── GYMPULSE_MEMBER_APP.md
├── README.md
├── apps/
│   ├── api/
│   │   ├── .env
│   │   ├── package.json
│   │   └── src/
│   │       ├── app.js
│   │       ├── server.js
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── db/
│   │       ├── middleware/
│   │       ├── repositories/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── utils/
│   │       └── validations/
│   └── web/
│       ├── app/
│       ├── public/
│       ├── src/
│       ├── package.json
│       ├── next.config.ts
│       └── tsconfig.json
├── database/
│   ├── migrations/
│   ├── schema.sql
│   └── seed.sql
├── prisma/
│   └── schema.prisma
└── scratch/
    ├── qa_test_runner.js
    └── real_data_integration_test.js
```

---

## 18. Exact Proposed Moves / Renames / Deletions (PROPOSED ONLY)

*Note: As requested, no files have been moved, renamed, or deleted during this audit pass.*

- **Proposed Deletions**:
  - Delete file `apps/web/page.tsx` (orphaned root duplicate of `apps/web/app/page.tsx`)
  - Delete file `apps/web/CLAUDE.md` (empty 11-byte placeholder)
  - Remove empty directory `docs/` (`api`, `architecture`, `runbooks`)
  - Remove empty directory `infrastructure/` (`docker`, `k8s`, `monitoring`, `terraform`)
  - Remove empty directory `packages/` (`shared/src/types`, `shared/src/utils`)
  - Remove empty directory `tests/` (`e2e`, `integration`, `unit`)
  - Remove empty directory `apps/api/src/models/`

---

```text
SAFE TO RESTRUCTURE:
- Delete misplaced orphaned file apps/web/page.tsx
- Delete empty file apps/web/CLAUDE.md
- Remove empty boilerplate placeholder directories (docs/, infrastructure/, packages/, tests/, apps/api/src/models/)

RISKY / DO NOT TOUCH:
- apps/api/src/ (controllers, routes, services, repositories, validations, middleware, config, db)
- apps/web/app/ (Next.js App Router layout and route structure)
- apps/web/src/ (components, services, hooks, lib, types, utils)
- database/ (schema.sql, seed.sql, migrations/)
- Configuration files (package.json, tsconfig.json, next.config.ts, .env)

NO FUNCTIONALITY CHANGES REQUIRED:
YES
```
