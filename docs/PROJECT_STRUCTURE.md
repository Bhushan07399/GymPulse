# GymPulse SaaS — Project Structure & Handover Guide

Welcome to the **GymPulse** production SaaS repository. This document provides a comprehensive technical overview of the project structure, architectural design patterns, module organization, database configuration, developer test suite, and handover guidelines for engineers and technical acquirers.

---

## 1. Top-Level Repository Blueprint

GymPulse is structured as a production-grade, modular SaaS repository.

```text
GymPulse/
├── ASSET_LICENSES.md                    # Media and asset licensing credits
├── GYMPULSE_MEMBER_APP.md              # Specification document for the Member Web Experience
├── PROJECT_STRUCTURE_AUDIT.md          # Architectural audit report
├── README.md                           # Primary repository entry point & quickstart guide
│
├── apps/                               # Core SaaS Applications
│   ├── api/                            # Node.js / Express.js REST API Backend
│   └── web/                            # Next.js App Router Web App (Management + Member Portal)
│
├── database/                           # Database Architecture & Migrations
│   ├── migrations/                     # Versioned SQL migration scripts
│   ├── schema.sql                      # Base DDL database creation schema
│   └── seed.sql                        # Initial seed data script
│
├── docs/                               # Production & Handover Documentation
│   ├── api/                            # API specification & OpenAPI docs (reserved)
│   ├── architecture/                   # Architectural decision records (ADRs) (reserved)
│   ├── runbooks/                       # Ops & deployment runbooks (reserved)
│   └── PROJECT_STRUCTURE.md            # This architectural reference guide
│
├── infrastructure/                     # Cloud Infrastructure & DevOps Configuration
│   ├── docker/                         # Dockerfile and Docker Compose configurations (reserved)
│   ├── k8s/                            # Kubernetes deployment & service manifests (reserved)
│   ├── monitoring/                     # Prometheus/Grafana dashboards & alerts (reserved)
│   └── terraform/                      # Infrastructure as Code provisioning (reserved)
│
├── packages/                           # Shared Monorepo Packages
│   └── shared/                         # Reserved scope for shared TS types/utilities
│
├── prisma/                             # Prisma ORM Schema Reference
│   └── schema.prisma                   # Reference Prisma schema file
│
├── scratch/                            # Developer Utilities & Integration Test Suites
│   ├── qa_test_runner.js               # API integration test runner
│   └── real_data_integration_test.js   # Live PostgreSQL mathematical data verification suite
│
└── tests/                              # Automated Test Framework
    ├── e2e/                            # End-to-end Cypress/Playwright suites (reserved)
    ├── integration/                    # Backend API integration tests (reserved)
    └── unit/                           # Isolated unit test suites (reserved)
```

---

## 2. Backend Architecture (`apps/api/`)

The backend is a Node.js REST API built with **Express.js** and PostgreSQL using standard data access patterns.

### Directory Breakdown
- **`src/app.js`**: Express application setup, global middleware registration (CORS, JSON parsing, logging, error handling), and route mounting.
- **`src/server.js`**: HTTP server bootstrap, port listener initialization, and graceful shutdown handling.
- **`src/config/`**:
  - `env.js`: Strongly-typed `dotenv` configuration parsing and runtime environment assertion.
  - `logger.js`: Centralized logging setup.
- **`src/controllers/`**: HTTP request handlers validating request parameters, calling business services, and shaping JSON responses (`auth`, `member`, `payment`, `attendance`, `classes`, `dashboard`, `whatsapp`, `report`, `staff`, `gym`, `bmi`, `health`, `member-app`).
- **`src/services/`**: Business logic layer managing domain operations, transaction flow, analytics aggregations, and scheduler notifications.
- **`src/repositories/`**: Data access layer executing raw SQL queries via PostgreSQL connection pool (`pg.Pool`). Includes parameterized queries for security and performance.
- **`src/validations/`**: Joi schema validation modules ensuring payload contract integrity before hitting controllers.
- **`src/middleware/`**:
  - `authenticate.js`: JWT Bearer authentication token verifier.
  - `authorize.js`: Role-Based Access Control (RBAC) middleware (`Owner`, `Manager`, `Staff`, `Trainer`).
  - `authorize-plan-feature.js`: Subscription entitlement gating middleware (e.g. `has_classes_enabled`).
  - `async-handler.js`: Exception wrapper catching unhandled async errors.
  - `error-handler.js`: Centralized HTTP error handler mapping `AppError` to JSON API error responses.
- **`src/db/`**:
  - `pool.js`: Single `pg.Pool` instance shared across all database queries.
  - `migrate.js`: Startup schema migrator automatically executing missing SQL migrations.

---

## 3. Frontend Web Architecture (`apps/web/`)

The frontend is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. It hosts two primary user experiences within a single web application:

### A. Management Web Application (`/dashboard/*`)
Designed for gym owners and staff to manage operational workflows:
- **Overview Dashboard** (`/dashboard`): Operational snapshot with real-time check-ins, attendance, revenue indicators, and bottom-sheet drawers on mobile views.
- **Members Management** (`/dashboard/members`): Member CRUD, membership plan assignment, payment status tracking, and member status filters.
- **Business Analytics** (`/dashboard/business-analytics`): Separate deep analytics page featuring historical revenue breakdown, membership breakdown, and class analytics.
- **Attendance Ledger** (`/dashboard/attendance`): Daily check-in logging, member lookup, and attendance reports.
- **Payments & Billing** (`/dashboard/payments`): Payment collection, invoice recording, and outstanding dues tracking.
- **Classes & Sessions** (`/dashboard/classes`): Class creation, instructor assignment, session scheduling, and member enrollments (*feature-gated*).
- **WhatsApp Automation** (`/dashboard/whatsapp`): Automated reminder triggers, payment due alerts, and custom messaging templates.
- **Settings & QR Code** (`/dashboard/settings`, `/dashboard/gym-qr`): Gym profile, feature flags, staff permissions, and check-in QR code generation.

### B. Member Web Interface (`/member/*`)
Designed for gym members on mobile or desktop browsers:
- **Member Entry/Login** (`/member/login`): Phone number / OTP / Member ID authentication.
- **Member Dashboard** (`/member/dashboard`): Digital membership ID card, QR camera scanner button, attendance streak indicator, and quick links.
- **QR Check-in Scanner** (`/member/scan`): Native browser camera integration scanning gym QR codes for instant check-in.
- **Workouts & Progress** (`/member/workout`, `/member/progress`): Interactive workout library, exercise logging, and BMI/measurement tracking.
- **Membership & Payments** (`/member/membership`, `/member/payments`): Plan details, expiry countdown, payment history, and renewal options.

---

## 4. Database Schema & Migrations (`database/`)

GymPulse uses PostgreSQL as its primary transactional database.
- **`database/schema.sql`**: Full DDL schema creating all tables (`gyms`, `gym_settings`, `users`, `staff`, `membership_plans`, `members`, `payments`, `attendance`, `classes`, `class_schedules`, `class_memberships`, `class_payments`, `whatsapp_templates`, `whatsapp_logs`).
- **`database/seed.sql`**: Sample development seed data for multi-tenant gyms.
- **`database/migrations/`**: Chronologically ordered SQL migration scripts automatically executed on backend boot by `apps/api/src/db/migrate.js`.

---

## 5. Testing & Quality Assurance

- **Developer Test Suite (`scratch/`)**:
  - `scratch/real_data_integration_test.js`: Direct PostgreSQL integration test suite validating real-data numerical correctness, mathematical total business revenue calculations (`Total = Gym Membership Revenue + Class Revenue`), date-range period filtering, member creation metrics, and strict gym tenant isolation (`gym_id` scoping).
  - `scratch/qa_test_runner.js`: Automated REST API endpoint verification script.
- **CI/CD Test Framework (`tests/`)**:
  - Reserved top-level directory containing `unit/`, `integration/`, and `e2e/` targets for automated continuous integration testing pipelines.

---

## 6. Local Setup & Execution Guide

### Prerequisites
- Node.js >= 18.x
- PostgreSQL database

### 1. Backend Setup (`apps/api`)
```bash
cd apps/api
npm install

# Configure environment variables in apps/api/.env
# DATABASE_URL=postgresql://user:password@localhost:5432/gympulse_db
# JWT_SECRET=your_jwt_secret_key
# PORT=5000

# Start API server
npm run dev
```

### 2. Frontend Setup (`apps/web`)
```bash
cd apps/web
npm install

# Start Next.js development server
npm run dev
```
Access the application at `http://localhost:3001` (or `http://localhost:3000`).

---

## 7. Developer Guidelines for Adding Features

1. **Backend Extensions**:
   - Add Joi validation schema in `apps/api/src/validations/`.
   - Add database queries in `apps/api/src/repositories/`.
   - Add service logic in `apps/api/src/services/`.
   - Add controller handler in `apps/api/src/controllers/`.
   - Mount endpoint in `apps/api/src/routes/`.
2. **Frontend Extensions**:
   - Define API response type in `apps/web/src/types/`.
   - Add API request helper in `apps/web/src/services/`.
   - Build React component under `apps/web/src/components/`.
   - Mount App Router page under `apps/web/app/`.
