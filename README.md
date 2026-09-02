# GymPulse Monorepo

GymPulse is a multi-tenant SaaS gym management platform built for gym owners, staff, and gym members. It features a shared PostgreSQL database, a unified Express REST API, a Next.js web dashboard for gym owners, native mobile apps for both gym owners and members, and full trilingual internationalization (English, Hindi, Marathi).

---

## 🏛️ Application Architecture

```
GymPulse/
├── apps/
│   ├── api/             # Shared Express REST API (Port 5000)
│   ├── owner-web/       # Gym Owner & Staff Web Dashboard (Next.js - Port 3000)
│   ├── owner-mobile/    # Gym Owner & Staff Mobile App (React Native + Expo)
│   └── member-mobile/   # Gym Member Mobile App (React Native + Expo)
│
├── packages/
│   ├── shared/          # Shared DTOs, Enums, and Utility Functions
│   └── i18n/            # Trilingual i18n Dictionaries (en, hi, mr) & TypeScript Types
│
├── database/            # PostgreSQL Schemas, Migrations & Seed Scripts
├── docs/                # Architecture Audits, Technical Reports & Deployment Checklists
├── infrastructure/      # Deployment Scripts & Environment Manifests
└── scratch/             # Automated Integration & Security Test Suites
```

---

## 🌐 Multi-Gym SaaS & Trilingual i18n (English / हिंदी / मराठी)

### 1. Multi-Gym Tenant Isolation
- Strict database & API level isolation via `gym_id` scoping.
- Cross-tenant access is automatically denied across all member, payment, attendance, class, staff, and settings routes.
- Gym A staff cannot access Gym B data; Gym B member QR passes are rejected at Gym A reception.

### 2. Trilingual i18n (English, Hindi, Marathi)
- Shared locale dictionaries in `packages/i18n/locales/` (`en.json`, `hi.json`, `mr.json`).
- 100% key parity across all 3 languages (353 keys each across 20 namespaces).
- Language switchers with `localStorage` (Web) and `expo-secure-store` (Mobile) persistence.
- Brand name "GymPulse" remains untranslated in English.

---

## 📱 Applications & Features

### 1. Backend API (`apps/api`)
- **Technology**: Node.js, Express, PostgreSQL, JWT Authentication, Zod Validation
- **Features**: Multi-tenant gym isolation, member management, membership plans, fee payments, attendance logging, group class scheduling/booking, gym settings, staff RBAC, and WhatsApp notifications integration.

### 2. Owner Web Dashboard (`apps/owner-web`)
- **Technology**: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, i18next
- **Features**: Gym owner analytics dashboard, member directory, membership plan manager, payment ledger, reception check-in desk, class schedule builder, reports export, gym settings profile, and inline English/Hindi/Marathi language switcher.

### 3. Owner Mobile App (`apps/owner-mobile`)
- **Technology**: React Native, Expo (SDK 52), TypeScript, TanStack React Query, Expo Secure Store, Expo Camera, i18next
- **Features**: On-the-go owner KPIs, member directory & search, fee recording, manual check-in, native reception camera QR scanner, live attendance ledger, and language selector modal.

### 4. Member Mobile App (`apps/member-mobile`)
- **Technology**: React Native, Expo (SDK 52), TypeScript, TanStack React Query, Expo Secure Store, QR Generator, i18next
- **Features**: Member login, live membership status card, dynamic digital QR pass for reception check-in, personal attendance history, group class schedule, one-tap session booking, and language selector modal.

---

## 🚀 Quick Start & Running Locally

### 1. Backend API (`apps/api`)
```bash
cd apps/api
npm install
npm run dev
# Running at http://localhost:5000/api/v1
```

### 2. Owner Web (`apps/owner-web`)
```bash
cd apps/owner-web
npm install
npm run dev
# Running at http://localhost:3000
```

### 3. Owner Mobile (`apps/owner-mobile`)
```bash
cd apps/owner-mobile
npm install
npm run start
```

### 4. Member Mobile (`apps/member-mobile`)
```bash
cd apps/member-mobile
npm install
npm run start
```

---

## 🧪 Testing & Verification Suite

Run the automated integration and security test scripts:

```bash
# 1. Multi-Gym Tenant Isolation Security Test (33/33 PASS)
node scratch/test_multi_gym_isolation.js

# 2. Shared i18n Locales Integrity Test (13/13 PASS)
node scratch/test_i18n.js

# 3. Real Data Integration & Financial Math Test (6/6 PASS)
node scratch/real_data_integration_test.js

# 4. Owner Mobile API QA Suite (15/15 PASS)
node scratch/test_owner_mobile_qa.js

# 5. Member Mobile API QA Suite (12/12 PASS)
node scratch/test_member_mobile_qa.js
```

---

## 🔒 Security & Environment Variables

- Copy `.env.example` to `.env` in the respective application root directory before starting.
- Never commit `.env` or real API keys to Git repository.
- All client requests are authenticated using JWT Bearer headers with multi-tenant `gym_id` authorization.

