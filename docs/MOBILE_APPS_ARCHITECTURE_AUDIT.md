# GymPulse Mobile Apps Architecture Audit

**Audit Date**: September 2, 2026  
**Status**: **COMPLETED**  
**Document Target**: `docs/MOBILE_APPS_ARCHITECTURE_AUDIT.md`

---

## 1. Current State

GymPulse is currently structured as a monorepo containing:

```text
GymPulse/
├── apps/
│   ├── api/                 ← Shared Express REST API & PostgreSQL Database Service (Port 5000)
│   ├── owner-web/           ← Standalone Gym Owner & Staff Web App (Next.js - Port 3000)
│   ├── member-web/          ← Standalone Gym Member Web App (Next.js - Port 3002)
│   └── web/                 ← Legacy combined web app (Intact as rollback source)
├── packages/
│   └── shared/              ← Shared package container for cross-platform code
├── database/                ← SQL Schema & PostgreSQL Migrations
├── docs/                    ← Architecture Audits & Extraction Reports
├── infrastructure/          ← Deployment & Docker Configuration
└── tests/                   ← Automated Integration & QA Test Suites
```

### Architecture Objective
Prepare GymPulse for native mobile expansion by defining the architecture, feature inventory, navigation hierarchy, API reuse matrix, and security protocols for:
1. **`apps/owner-mobile/`**: React Native + Expo app for Gym Owners & Staff (iOS + Android).
2. **`apps/member-mobile/`**: React Native + Expo app for Gym Members (iOS + Android).

Both mobile apps will connect to the **ONE existing shared Express REST API (`apps/api/`)** and **ONE PostgreSQL database**. No backend duplication or microservices required.

---

## 2. Owner Mobile Feature Audit

Audit of all existing Owner Web functionality (`apps/owner-web/`):

| Feature | Description | Classification | Justification |
| ------- | ----------- | -------------- | ------------- |
| **Owner & Staff Login** | Authentication via email/password or username | **A. MUST HAVE** | Essential mobile entry point for owners and front-desk staff. |
| **Overview Dashboard** | Real-time KPI metric cards (Active Members, Revenue, Today's Check-ins) | **A. MUST HAVE** | Quick operational status overview on smartphone screen. |
| **Reception QR Scanner** | Camera check-in scanner for member digital passes | **A. MUST HAVE** | Key front-desk mobile capability; turns smartphone/tablet into check-in kiosk. |
| **Member List & Search** | Member directory, instant search by phone/name, status filter | **A. MUST HAVE** | Crucial for looking up members on the gym floor or reception. |
| **Quick Member Add** | Register new member with plan assignment & payment | **A. MUST HAVE** | Allows front-desk staff to register walk-ins directly on mobile. |
| **Attendance Ledger** | Real-time check-in log and manual override check-in | **A. MUST HAVE** | Allows checking today's attendance and manual check-ins. |
| **Payments & Fee Collection** | Financial payments ledger and quick fee recording | **A. MUST HAVE** | Record cash/UPI fee payments immediately upon receipt. |
| **Class Schedule & Roster** | View daily group classes, sessions, and enrolled members | **A. MUST HAVE** | Instructors/staff can check class attendance on the floor. |
| **Gym Reception QR Display** | Display permanent reception QR poster for member self-scan | **B. SHOULD HAVE** | Useful for tablet mounting at reception desk. |
| **Membership Plans Manager** | View active plan list, durations, and pricing | **B. SHOULD HAVE** | Quick reference when explaining plans to prospects. |
| **WhatsApp Automation Status** | View automation trigger logs and gateway stats | **B. SHOULD HAVE** | Monitoring automated message delivery status on mobile. |
| **Business Analytics Summary** | High-level revenue and active member charts | **B. SHOULD HAVE** | Quick executive summary view for gym owners. |
| **Gym Operating Settings** | Gym name, logo, contact info, operating hours | **B. SHOULD HAVE** | Basic profile viewing and minor configuration updates. |
| **Staff Team Management** | Staff user list and access roles | **B. SHOULD HAVE** | Viewing staff accounts and access privileges. |
| **Reports Export (PDF/Excel)** | Download full financial and attendance CSV/PDF reports | **C. WEB ONLY** | Best suited for desktop browsers with file system downloads. |
| **Detailed Data Tables** | Multi-column multi-filter analytics tables | **C. WEB ONLY** | Dense data visualization optimized for desktop screens. |
| **SaaS Subscription Upgrade** | Upgrade GymPulse SaaS tier billing & invoices | **C. WEB ONLY** | Owner billing administrative task handled via web checkout. |
| **Gym Onboarding Wizard** | First-time gym registration (`/create-account`) | **C. WEB ONLY** | Initial tenant setup performed during web onboarding. |

---

## 3. Member Mobile Feature Audit

Audit of all existing Member Web functionality (`apps/member-web/`):

| Feature | Description | Classification | Justification |
| ------- | ----------- | -------------- | ------------- |
| **Member Auth & Login** | Member mobile login with phone/credential validation | **A. MUST HAVE** | Primary authentication for gym members. |
| **Member Dashboard** | Membership status card, expiration countdown, quick pass button | **A. MUST HAVE** | Central hub for member activity and gym status. |
| **Digital Member QR Pass** | Dynamic high-contrast QR code for gym entrance scanner | **A. MUST HAVE** | Core mobile utility; replaces physical plastic membership cards. |
| **Attendance History** | Monthly check-in log, total visits, calendar view | **A. MUST HAVE** | Allows members to track their gym attendance history. |
| **Class Schedule & Booking** | View available group classes and 1-tap booking/cancellation | **A. MUST HAVE** | Essential self-service feature for class reservation. |
| **Payments & Fee Receipts** | View payment history and digital payment receipts | **A. MUST HAVE** | Transparency on fee payments and due dates. |
| **Member Profile** | Personal details, emergency contact, gym details, logout | **A. MUST HAVE** | Profile information and app session management. |
| **Membership Plan Details** | Current active plan duration, benefits, renewal alerts | **B. SHOULD HAVE** | Keeps member informed of upcoming plan expiration. |
| **Workout Library & Tracker** | Exercise list and daily workout routine log | **B. SHOULD HAVE** | Value-added fitness feature during workout sessions. |
| **Weight & Progress Log** | Log body weight and track fitness progress over time | **B. SHOULD HAVE** | Enhances member engagement and retention. |
| **BMI Calculator** | Calculate Body Mass Index with fitness category feedback | **B. SHOULD HAVE** | Useful health utility tool. |
| **Full PDF Receipt Printing** | Desktop print layout for receipts | **C. WEB ONLY** | Mobile displays digital receipt card; full PDF printing on web. |

---

## 4. Owner Mobile Screen Inventory

Exact screen inventory for `apps/owner-mobile/`:

| Screen Name | Purpose | Source Owner Web Route / Component | Priority | Navigation Location |
| ----------- | ------- | ----------------------------------- | -------- | ------------------- |
| `OwnerLoginScreen` | Owner & Staff Login Portal | `app/login/page.tsx` | P0 | Auth Stack |
| `OwnerDashboardScreen` | KPI summary cards, today's check-ins, quick actions | `app/dashboard/page.tsx` | P0 | Bottom Tab (Home) |
| `MemberListScreen` | Searchable member directory with filter by status/plan | `app/dashboard/members/page.tsx` | P0 | Bottom Tab (Members) |
| `ReceptionScannerScreen` | Camera-based QR scanner for member check-in | `app/dashboard/reception/page.tsx` | P0 | Bottom Tab (Scan - Center) |
| `PaymentsScreen` | Fee payments ledger & fee collection history | `app/dashboard/payments/page.tsx` | P0 | Bottom Tab (Payments) |
| `ClassScheduleScreen` | Group class calendar, daily sessions & roster | `app/dashboard/classes/page.tsx` | P0 | Bottom Tab (Classes) |
| `MemberDetailScreen` | Member profile, attendance history, payment ledger | `src/components/members/member-detail.tsx` | P0 | Stack (Contextual) |
| `AddMemberScreen` | Quick member registration form | `src/components/members/add-member-dialog.tsx` | P0 | Bottom Sheet / Stack |
| `CollectPaymentScreen` | Record fee collection dialog | `src/components/payments/record-payment-dialog.tsx` | P0 | Bottom Sheet / Stack |
| `AttendanceLedgerScreen` | Today's full check-in ledger & manual check-in | `app/dashboard/attendance/page.tsx` | P0 | Stack (from Home) |
| `ClassDetailScreen` | Enrolled members & mark class attendance | `src/components/classes/class-detail.tsx` | P1 | Stack (Contextual) |
| `AnalyticsSummaryScreen` | Revenue & active member KPI overview | `app/dashboard/business-analytics/page.tsx` | P1 | Stack (More Menu) |
| `WhatsAppStatusScreen` | Automation trigger logs & gateway status | `app/dashboard/whatsapp/page.tsx` | P1 | Stack (More Menu) |
| `MembershipPlansScreen` | Active plan list & pricing | `app/dashboard/membership-plans/page.tsx` | P2 | Stack (More Menu) |
| `GymSettingsScreen` | Gym info, operating hours, tax details | `app/dashboard/settings/page.tsx` | P2 | Stack (More Menu) |
| `StaffManagementScreen` | Staff team list & roles | `app/dashboard/staff/page.tsx` | P2 | Stack (More Menu) |
| `GymQrPosterScreen` | Reception QR poster display for members | `app/dashboard/gym-qr/page.tsx` | P2 | Stack (More Menu) |

---

## 5. Member Mobile Screen Inventory

Exact screen inventory for `apps/member-mobile/`:

| Screen Name | Purpose | Source Member Web Route / Component | Priority | Navigation Location |
| ----------- | ------- | ----------------------------------- | -------- | ------------------- |
| `MemberLoginScreen` | Member phone/ID login portal | `app/member/login/page.tsx` | P0 | Auth Stack |
| `MemberDashboardScreen` | Membership status card, quick pass shortcut, notifications | `app/member/dashboard/page.tsx` | P0 | Bottom Tab (Home) |
| `DigitalQrPassScreen` | Dynamic digital QR code pass for gym entry scanner | `app/member/scan/page.tsx` | P0 | Bottom Tab (Pass - Center) |
| `MemberClassesScreen` | Group class schedule & 1-tap class booking | `app/member/classes/page.tsx` | P0 | Bottom Tab (Classes) |
| `MemberProfileScreen` | Personal details, emergency contact, logout | `app/member/profile/page.tsx` | P0 | Bottom Tab (Profile) |
| `MemberAttendanceScreen` | Member check-in history & monthly attendance log | `app/member/attendance/page.tsx` | P0 | Stack (from Home) |
| `MemberMembershipScreen` | Current plan details & expiration countdown | `app/member/membership/page.tsx` | P1 | Stack (from Home) |
| `MemberPaymentsScreen` | Fee payment history & digital receipts | `app/member/payments/page.tsx` | P1 | Stack (More Menu) |
| `MemberWorkoutScreen` | Exercise library & routine tracker | `app/member/workout/page.tsx` | P1 | Stack (More Menu) |
| `MemberProgressScreen` | Weight log & fitness progress tracker | `app/member/progress/page.tsx` | P2 | Stack (More Menu) |

---

## 6. Mobile Navigation

### Owner Mobile Navigation Structure

```text
RootNavigator (Stack)
├── AuthStack
│   └── OwnerLoginScreen
└── MainAppTabs (Bottom Navigation)
    ├── Tab 1: Home (OwnerDashboardScreen)
    ├── Tab 2: Members (MemberListScreen)
    ├── Tab 3: Scan [Action Button] (ReceptionScannerScreen)
    ├── Tab 4: Payments (PaymentsScreen)
    └── Tab 5: Classes (ClassScheduleScreen)
    
Contextual Stacks & Bottom Sheets:
├── MemberDetailScreen (Stack)
├── AddMemberScreen (Modal / Bottom Sheet)
├── CollectPaymentScreen (Modal / Bottom Sheet)
├── AttendanceLedgerScreen (Stack)
├── ClassDetailScreen (Stack)
└── MoreMenuStack (Settings Icon in Header)
    ├── AnalyticsSummaryScreen
    ├── WhatsAppStatusScreen
    ├── MembershipPlansScreen
    ├── GymSettingsScreen
    ├── StaffManagementScreen
    └── GymQrPosterScreen
```

### Member Mobile Navigation Structure

```text
RootNavigator (Stack)
├── AuthStack
│   └── MemberLoginScreen
└── MainAppTabs (Bottom Navigation)
    ├── Tab 1: Home (MemberDashboardScreen)
    ├── Tab 2: Pass [Action Button] (DigitalQrPassScreen)
    ├── Tab 3: Classes (MemberClassesScreen)
    └── Tab 4: Profile (MemberProfileScreen)

Contextual Stacks & Bottom Sheets:
├── MemberAttendanceScreen (Stack)
├── MemberMembershipScreen (Stack)
├── MemberPaymentsScreen (Stack)
├── MemberWorkoutScreen (Stack)
└── MemberProgressScreen (Stack)
```

---

## 7. API Reuse Audit

Evaluation of existing Express API routes (`apps/api/src/routes/`):

| API Domain | Backend Route File | API Endpoint | Used By Web | Mobile Reuse Classification |
| ---------- | ------------------ | ------------ | ----------- | --------------------------- |
| **Owner Auth** | `auth.routes.js` | `POST /api/v1/auth/login` | Owner Web | **Reusable as-is** |
| **Member Auth** | `member-app.routes.js` | `POST /api/v1/member-app/login` | Member Web | **Reusable as-is** |
| **Dashboard** | `dashboard.routes.js` | `GET /api/v1/dashboard/summary` | Owner Web | **Reusable as-is** |
| **Members** | `member.routes.js` | `GET /api/v1/members`, `POST /api/v1/members`, `GET /api/v1/members/:id`, `PUT /api/v1/members/:id` | Owner Web | **Reusable as-is** |
| **Attendance** | `attendance.routes.js` | `POST /api/v1/attendance/scan`, `GET /api/v1/attendance/ledger`, `POST /api/v1/attendance/check-in` | Owner Web | **Reusable as-is** |
| **Payments** | `payment.routes.js` | `GET /api/v1/payments`, `POST /api/v1/payments` | Owner Web | **Reusable as-is** |
| **Classes** | `classes.routes.js` | `GET /api/v1/classes`, `POST /api/v1/classes`, `GET /api/v1/classes/:id` | Owner Web | **Reusable as-is** |
| **Class Plans** | `class-plans.routes.js` | `GET /api/v1/class-plans`, `POST /api/v1/class-plans` | Owner Web | **Reusable as-is** |
| **Member App Data** | `member-app.routes.js` | `GET /api/v1/member-app/profile`, `GET /api/v1/member-app/attendance`, `GET /api/v1/member-app/payments`, `GET /api/v1/member-app/classes`, `POST /api/v1/member-app/classes/:id/book` | Member Web | **Reusable as-is** |
| **Digital QR Pass** | `member-app.routes.js` | `GET /api/v1/member-app/qr-pass` | Member Web | **Reusable as-is** |
| **WhatsApp Automation** | `whatsapp.routes.js` | `GET /api/v1/whatsapp/stats`, `GET /api/v1/whatsapp/logs` | Owner Web | **Reusable as-is** |
| **Gym Settings** | `gym.routes.js` | `GET /api/v1/gym/settings`, `PUT /api/v1/gym/settings` | Owner Web | **Reusable as-is** |
| **Staff Team** | `staff.routes.js` | `GET /api/v1/staff`, `POST /api/v1/staff` | Owner Web | **Reusable as-is** |

### Backend Reuse Conclusion
**100% of existing REST endpoints are Reusable as-is.**  
No new backend controllers, routes, or database changes are required to launch native mobile apps.

---

## 8. Authentication

### Owner Mobile Authentication Flow
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**: `{ email, password }`
- **Response**: `{ token, user: { id, gymId, role, firstName, lastName, email } }`
- **Token Key**: `gympulse_token`
- **Role Enforcement**: `owner` or `staff`
- **Secure Token Storage**: `expo-secure-store` (Encrypted SharedPreferences on Android, Keychain Services on iOS).

### Member Mobile Authentication Flow
- **Endpoint**: `POST /api/v1/member-app/login`
- **Request Body**: `{ identifier, password }`
- **Response**: `{ token, member: { id, memberId, gymId, firstName, lastName, phone } }`
- **Token Key**: `gympulse_member_token`
- **Role Enforcement**: `member`
- **Secure Token Storage**: `expo-secure-store`.

### HTTP Request Interceptor Pattern
Both mobile applications will instantiate a dedicated Axios client with request interceptors:
```typescript
// Example mobile API client interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('gympulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 9. QR / Camera

| Use Case | Target Mobile App | Camera Requirement | Current Web Implementation | Mobile Implementation | API Endpoint Used |
| -------- | ----------------- | ------------------ | -------------------------- | --------------------- | ----------------- |
| **Reception Check-in Scan** | Owner Mobile | **Camera Required** (Front/Rear) | HTML5 QR Scanner in browser | Native Camera via `expo-camera` or `react-native-camera-kit` | `POST /api/v1/attendance/scan` |
| **Digital Pass Generation** | Member Mobile | No Camera (Display Only) | Canvas SVG QR code | Native SVG QR code via `react-native-qrcode-svg` | `GET /api/v1/member-app/qr-pass` |
| **Member Self-Scan** | Member Mobile | **Camera Required** (Rear) | HTML5 QR Scanner in browser | Native Camera via `expo-camera` | `POST /api/v1/member-app/check-in-qr` |

---

## 10. Notifications

### Existing Notification System
- **WhatsApp Automation**: Server-side Twilio/Meta integration triggered on backend business events (Member registration, fee payment receipt, class booking confirmation, fee expiration reminder).
- **In-App Web Banners**: React Hot Toast in web browsers.

### Mobile Push Notifications (Future Capability)
- **Engine**: Expo Push Notifications (`expo-notifications`).
- **Token Storage**: Native push token (`ExponentPushToken[...]`) registered via `POST /api/v1/notifications/register-token`.
- **Push Scenarios**:
  1. Instant check-in confirmation to Member Mobile when scanned at reception.
  2. Fee payment receipt notification to Member Mobile.
  3. Class booking cancellation/reminder alerts.
  4. Instant new member registration alert to Owner Mobile.

---

## 11. Offline Requirements

| Feature Category | Offline Classification | Strategy |
| ---------------- | ---------------------- | -------- |
| **Authentication & Login** | **Online Only** | Requires live API validation. |
| **Member Registration & Payment Collection** | **Online Only** | Real-time financial & ledger update. |
| **Digital Member QR Pass** | **Cache Assisted** | Caches last generated QR pass token in `AsyncStorage` for offline display if member loses cellular signal at gym door. |
| **Member Directory & Profiles** | **Cache Assisted** | Stale-while-revalidate caching via TanStack React Query. |
| **Attendance & Payment History** | **Cache Assisted** | Local read cache with automatic background refetching. |
| **Class Booking** | **Online Only** | Prevents double-booking or slot overbooking. |

---

## 12. Shared Code Audit

Audit of code candidates for `packages/shared/`:

```text
packages/shared/src/
├── types/
│   ├── member.ts           ← Member, MemberInput, MembershipPlan DTOs
│   ├── payment.ts          ← Payment, PaymentInput, PaymentMethod DTOs
│   ├── attendance.ts       ← AttendanceRecord, CheckInInput DTOs
│   ├── classes.ts          ← GymClass, ClassSession, Booking DTOs
│   ├── gym.ts              ← GymSettings, OperatingHours DTOs
│   ├── staff.ts            ← StaffUser, RoleEnum DTOs
│   └── whatsapp.ts         ← WhatsAppLog, Template DTOs
└── utils/
    ├── formatters.ts       ← Currency (formatCurrency), Date (formatDate)
    ├── bmi.ts              ← BMI calculation logic
    └── validators.ts       ← Zod validation schemas for forms
```

### Classification
- **A. Good Candidate for `packages/shared`**: Platform-independent TypeScript types, DTOs, Enums, Zod validation schemas, pure utility functions (currency formatting, date formatting, BMI math).
- **B. Web-Only**: Next.js router hooks (`next/navigation`), DOM element references, Web Canvas printers.
- **C. Mobile-Only**: Expo camera hooks, SecureStore wrappers, React Navigation configs.
- **D. App-Local**: Layout wrappers, page components, screen styles.

---

## 13. React Native / Expo Architecture

Recommended Mobile Stack for `apps/owner-mobile/` and `apps/member-mobile/`:

- **Framework**: Expo (SDK 52+ with Managed Workflow & Development Builds).
- **Language**: TypeScript (`tsconfig.json`).
- **Routing & Navigation**: React Navigation (v7) or Expo Router (v4+).
- **HTTP Client**: Axios with interceptors and base URL configuration.
- **State Management & Data Fetching**: TanStack React Query (v5).
- **Secure Token Storage**: `expo-secure-store`.
- **Forms & Validation**: React Hook Form + Zod (reusing schemas from `packages/shared/`).
- **Camera & Scanning**: `expo-camera`.
- **QR Code Rendering**: `react-native-qrcode-svg`.
- **Styling**: NativeWind (v4) or React Native StyleSheet using GymPulse color tokens (`#0F172A` Slate, `#F59E0B` Amber, `#10B981` Emerald).
- **Push Notifications**: `expo-notifications`.

---

## 14. Android + iOS Strategy

- **Single Cross-Platform Codebase**:
  - `apps/owner-mobile/` -> ONE React Native + Expo codebase targeting both Android (`.apk`/`.aab`) and iOS (`.ipa`).
  - `apps/member-mobile/` -> ONE React Native + Expo codebase targeting both Android and iOS.
- **Justification**:
  - Expo managed workflow provides unified JavaScript APIs for cross-platform native modules (`expo-camera`, `expo-secure-store`, `expo-notifications`).
  - Achieves 98%+ code reuse between Android and iOS without writing platform-specific native Java/Swift code.

---

## 15. App Boundaries

Strict monorepo boundary rules:

```text
┌────────────────┐     ┌─────────────────┐
│ apps/owner-web │     │ apps/member-web │
└───────┬────────┘     └────────┬────────┘
        │                       │
        ▼                       ▼
┌────────────────────────────────────────┐
│               apps/api                 │  ◄── Primary API Communication
└───────────────────▲────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────┴──────────┐   ┌────────┴──────────┐
│apps/owner-mobile │   │apps/member-mobile │
└──────────────────┘   └───────────────────┘
```

- `apps/owner-mobile/` MUST NOT import from `apps/owner-web/`, `apps/member-web/`, or `apps/member-mobile/`.
- `apps/member-mobile/` MUST NOT import from `apps/owner-web/`, `apps/member-web/`, or `apps/owner-mobile/`.
- Web apps MUST NOT import mobile native UI code.
- All apps import platform-independent types, schemas, and utilities exclusively from `packages/shared/`.

---

## 16. Security

1. **Token Security**: Tokens stored in encrypted device storage (`expo-secure-store`) using Android Keystore System and iOS Keychain.
2. **Network Encryption**: HTTPS enforced for production API communication (`https://api.gympulse.com/v1`).
3. **Tenant Isolation**: Backend `extractTenantId` middleware extracts `gym_id` directly from validated JWT token; client cannot tamper with tenant scope.
4. **Runtime Permissions**: Explicit OS runtime prompts for Camera (`expo-camera`) and Notifications (`expo-notifications`).
5. **Auto-Logout**: 401 Unauthorized responses trigger automatic token clearance and redirect to login stack.

---

## 17. Deep Links & QR Links

- **Custom Scheme**: `gympulse://` (e.g., `gympulse://owner/reception`, `gympulse://member/pass`).
- **Universal Links / App Links**: `https://gympulse.com/m/*` opens Member Mobile App directly if installed.
- **QR Links**:
  - Scanning a member pass opens instant check-in confirmation on Owner Mobile App.
  - Scanning reception poster opens self-check-in screen on Member Mobile App.

---

## 18. Development Order

### Recommended Build Order
Build **`apps/owner-mobile/` FIRST**, followed by **`apps/member-mobile/`**.

### Rationale
1. **Operational Necessity**: Gym owners and reception staff require a mobile camera scanner at the front desk for instant member check-in and quick payment collection without relying on desktop hardware.
2. **Web Fallback**: Gym members can already use `apps/member-web/` on mobile web browsers (`http://localhost:3002/member/login`) during Phase 1.

### Phased Roadmap
- **Phase 1**: Populate `packages/shared/` with platform-independent types, DTOs, schemas, and formatters.
- **Phase 2**: Create `apps/owner-mobile/` workspace shell, install Expo dependencies, setup navigation and Axios API client.
- **Phase 3**: Implement Owner Mobile P0 screens (`OwnerLogin`, `OwnerDashboard`, `ReceptionScanner`, `MemberList`, `PaymentsScreen`).
- **Phase 4**: Test and verify Owner Mobile iOS & Android builds.
- **Phase 5**: Create `apps/member-mobile/` workspace shell and implement Member Mobile P0 screens (`MemberLogin`, `MemberDashboard`, `DigitalQrPass`, `MemberClasses`).
- **Phase 6**: Integrate Expo Push Notifications and prepare app store release packages.

---

## 19. Feature Priority Matrix

### OWNER MOBILE

| Priority Level | Features Included |
| -------------- | ----------------- |
| **P0 (Essential)** | Owner/Staff Auth, Dashboard KPIs, Camera QR Reception Scanner, Member Directory & Search, Quick Member Registration, Fee Payment Recording, Attendance Ledger. |
| **P1 (Important)** | Class Schedule & Enrolled Members, WhatsApp Automation Status, Gym Profile Settings View, Business Analytics Summary. |
| **P2 (Later)** | Staff Team List, Membership Plan Definitions, Gym Reception QR Poster Display. |
| **WEB ONLY** | Financial PDF/Excel Report Downloads, SaaS Tier Upgrade Checkout, Detailed Data Analytics Tables, Gym Onboarding Wizard. |

### MEMBER MOBILE

| Priority Level | Features Included |
| -------------- | ----------------- |
| **P0 (Essential)** | Member Auth, Dashboard Status Card, Dynamic Digital QR Pass, Attendance History, Group Class Schedule & 1-Tap Booking. |
| **P1 (Important)** | Membership Plan & Expiry Countdown, Payment History & Digital Receipts, Exercise Library & Workout Log, Profile & Emergency Contact. |
| **P2 (Later)** | Body Weight Tracker & Progress Chart, BMI Calculator. |
| **WEB ONLY** | Full-page PDF Print Receipts. |

---

## 20. Risks

| Risk | Severity | Area | Mitigation |
| ---- | -------- | ---- | ---------- |
| **Camera Permission Rejection** | **MEDIUM** | QR Scanner | Provide clear rationale screen before requesting permission; include manual phone/ID lookup fallback. |
| **API Protocol Mismatch** | **LOW** | API Reuse | Enforce single source of truth for DTOs in `packages/shared/`. |
| **Token Expiration in Field** | **LOW** | Security | Axios 401 interceptor automatically clears token and routes user to login. |
| **Mobile Screen Density** | **LOW** | Native UI | Use native scrolling lists (`FlatList`) and collapsible cards instead of multi-column tables. |
| **Monorepo Build Bloat** | **LOW** | Architecture | Ensure `packages/shared/` contains ZERO UI dependencies (types and pure logic only). |

---

## 21. Final Architecture

Recommended Monorepo Structure:

```text
GymPulse/
├── apps/
│   ├── api/                 ← Shared Express REST API & PostgreSQL Models (Port 5000)
│   ├── owner-web/           ← Owner & Staff Web Portal (Next.js - Port 3000)
│   ├── owner-mobile/        ← Owner & Staff Native Mobile App (React Native + Expo - iOS/Android)
│   ├── member-web/          ← Member Web Portal (Next.js - Port 3002)
│   └── member-mobile/       ← Member Native Mobile App (React Native + Expo - iOS/Android)
├── packages/
│   └── shared/              ← Platform-Independent Types, Schemas, Constants & Utilities
├── database/                ← SQL Schema & Database Migrations
├── docs/                    ← Architecture Audits, Specifications & Reports
├── infrastructure/          ← Production Deployment Configurations
└── tests/                   ← Automated E2E & Integration Tests
```

---

## 22. Final Recommendation

1. Maintain **ONE shared Express REST API (`apps/api/`)** and **ONE PostgreSQL database**.
2. Populate `packages/shared/` with platform-independent types, schemas, and utilities before creating mobile applications.
3. Build **`apps/owner-mobile/` first** to solve front-desk camera scanning and floor management.
4. Build **`apps/member-mobile/` second** to deliver native digital passes and class reservations.
5. Keep mobile architecture simple: avoid microservices, premature offline synchronization layers, or duplicate backends.

---

## AUDIT METRICS REPORT

Code Modified: NO  
Database Modified: NO  
Backend Modified: NO  
Dependencies Modified: NO  
Owner Web Modified: NO  
Member Web Modified: NO  
Mobile Apps Created: NO  
Files Moved: NO  
Files Deleted: NO  
Audit Document Created: YES  
