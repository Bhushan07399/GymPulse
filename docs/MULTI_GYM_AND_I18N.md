# GymPulse — Multi-Gym SaaS & Trilingual i18n Architecture

## 1. Multi-Gym Tenant Isolation Architecture

GymPulse is a multi-tenant SaaS platform where multiple gyms independently use the same database, REST API, and front-end applications.

### Tenant Isolation Model
- Every gym record in the database is associated with a unique UUID (`gym_id`).
- All tenant-owned tables (`members`, `membership_plans`, `attendance`, `payments`, `classes`, `staff`, `gym_settings`) contain `gym_id` foreign key columns with `ON DELETE CASCADE`.
- When an owner or staff member authenticates, their JWT payload contains `gymId`.
- The API authentication middleware (`apps/api/src/middleware/authenticate.js`) parses `gymId` into `request.user.gymId`.
- Every repository database query injects `WHERE gym_id = $1` using parameterized SQL queries.

### Verified Security Guarantees
- Cross-tenant data access is denied across all endpoints.
- Staff of Gym A cannot view, edit, or delete members, payments, attendance, staff, or settings of Gym B.
- Members scanning QR passes at Reception are checked against the authenticated gym ID. Scanning a Gym B member's QR at Gym A reception is rejected with `HTTP 404 (Member not found)`.
- Member authentication produces JWT tokens scoped strictly to their registered gym. Members cannot access staff or owner API routes (`HTTP 403 Forbidden`).

---

## 2. Trilingual i18n System Architecture (English / Hindi / Marathi)

GymPulse supports full internationalization across English, Hindi (हिंदी), and Marathi (मराठी).

### Architecture & Key Distribution
```
packages/i18n/
├── locales/
│   ├── en.json    (Master English dictionary — 353 keys across 20 namespaces)
│   ├── hi.json    (Devanagari Hindi translations — 353 keys)
│   └── mr.json    (Devanagari Marathi translations — 353 keys)
├── types.ts       (Type-safe union definitions for supported languages)
└── index.ts       (Unified export module)
```

### Namespace Coverage (353 Keys)
1. `common` — General UI actions, states, and buttons
2. `auth` — Login, authentication, and session handling
3. `nav` — Sidebar and navigation groups
4. `dashboard` — Dashboard KPIs, tiles, and reception quick actions
5. `members` — Member directory, forms, and profiles
6. `attendance` — Check-in/out, methods, and attendance ledgers
7. `classes` — Group classes, booking, and schedules
8. `qrPass` — Digital QR pass and reception instructions
9. `payments` — Fee collection, payment methods (Cash, UPI, Card, EMI), and receipts
10. `plans` — Membership plan creation, features, and durations
11. `staff` — Staff management and roles (Owner, Receptionist, Trainer)
12. `settings` — Gym profile, operational flags, and settings
13. `reports` — Business reports and CSV exports
14. `analytics` — Business revenue and membership growth analytics
15. `whatsapp` — WhatsApp notification automation
16. `gymQR` — Reception printable QR code
17. `reception` — Reception desk scanner and lookup
18. `subscription` — Gym SaaS subscription plan tiers
19. `language` — Language selection options and labels
20. `errors` — System, validation, network, and error states

### Brand & User Data Rules
- **Brand Name**: "GymPulse" remains untranslated in English across all languages.
- **Dynamic Content**: Gym names, member names, plan names, and user-entered notes are displayed as entered by users and not auto-translated.
- **Natural Terminology**: Standard Indian fitness/gym vocabulary is used (e.g., हिंदी: उपस्थिति, सदस्यता; मराठी: उपस्थिती, सदस्यत्व).

### Client Persistence
- **Owner Web**: Language preference persisted in `localStorage` under key `gympulse.language`. Default: `en`.
- **Owner Mobile & Member Mobile**: Language preference persisted in `expo-secure-store` under key `gympulse.language`. Default: `en`.
