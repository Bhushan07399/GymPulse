# obo Unified Mobile App Architecture & Migration Plan

**Document Version**: 1.0.0  
**Status**: Approved Architecture Foundation  
**Repository**: `D:\Dev\GymPulse`  
**Target Path**: `apps/mobile/`  
**Language**: English Only (Multilingual / i18n support cancelled)  

---

## 1. Target Architecture

The unified mobile application consolidates the functionality of two legacy applications (`apps/owner-mobile` and `apps/member-mobile`) into a single, high-performance React Native / Expo application located at `apps/mobile/`.

### 1.1 High-Level Architecture Diagram

```
                              obo Unified Mobile App
                                  (apps/mobile/)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
          Unauthenticated Flow                        Authenticated Flow
            (AuthNavigator)                             (RoleNavigator)
                   │                                           │
         ┌─────────┴─────────┐                  ┌──────────────┼──────────────┐
         ▼                   ▼                  ▼              ▼              ▼
    Owner / Staff       Member Pass           Owner          Staff          Member
     Credentials        Credentials         Navigator      Navigator      Navigator
         │                   │                  │              │              │
         ▼                   ▼                  ▼              ▼              ▼
    POST /auth/login  POST /member/auth/login   Owner UI       Staff UI       Member UI
         │                   │                  (Dashboard,    (Reception,    (Digital Pass,
         └─────────┬─────────┘                   Members,       Check-in,      Gym Scanner,
                   ▼                             Ledgers,       Payments)      Classes,
          Signed Server JWT                      Multi-Gym)                    History)
                   │                                    │              │              │
                   └────────────────────────────────────┴──────────────┴──────────────┘
                                                        │
                                                        ▼
                                                Express API Server
                                                (/api/v1/* routes)
                                                        │
                                                        ▼
                                                PostgreSQL Database
```

### 1.2 Target Directory Structure

```text
apps/mobile/
├── assets/                       # App icons, splash screens, logos (from packages/branding/assets/)
├── src/
│   ├── api/                      # Consolidated API clients and services
│   │   ├── client.ts             # Axios instance, interceptors, error formatters
│   │   ├── auth.service.ts       # Unified authentication service
│   │   ├── owner.service.ts      # Owner metrics, gym management
│   │   ├── staff.service.ts      # Staff operations, reception
│   │   ├── member.service.ts     # Member profile, passes, card
│   │   ├── attendance.service.ts # Unified attendance check-in / check-out
│   │   ├── payments.service.ts   # Fees collection, receipts, history
│   │   └── classes.service.ts    # Class schedules, booking, attendance
│   ├── components/
│   │   ├── common/               # Button, Card, Input, StatusBadge, Header
│   │   ├── forms/                # Form controls, validation helpers
│   │   ├── feedback/             # LoadingState, ErrorState, EmptyState
│   │   └── navigation/           # TabBar, ScreenContainer, Drawer
│   ├── owner/                    # Owner-specific screens & modules
│   │   ├── OwnerDashboardScreen.tsx
│   │   ├── MemberListScreen.tsx
│   │   ├── MemberDetailScreen.tsx
│   │   ├── AddMemberModalScreen.tsx
│   │   ├── AttendanceLedgerScreen.tsx
│   │   ├── CollectPaymentModalScreen.tsx
│   │   ├── ReceptionScannerScreen.tsx
│   │   └── GymSwitcherModal.tsx
│   ├── staff/                    # Staff-specific screens & modules
│   │   ├── StaffReceptionScreen.tsx
│   │   ├── StaffScannerScreen.tsx
│   │   └── StaffAttendanceScreen.tsx
│   ├── member/                   # Member-specific screens & modules
│   │   ├── MemberDashboardScreen.tsx
│   │   ├── QrPassScreen.tsx
│   │   ├── GymQrScannerModal.tsx
│   │   ├── AttendanceHistoryScreen.tsx
│   │   └── ClassScheduleScreen.tsx
│   ├── navigation/               # Navigation containers & navigators
│   │   ├── RootNavigator.tsx     # Root auth switch
│   │   ├── AuthNavigator.tsx     # Login screen stack
│   │   ├── RoleNavigator.tsx     # Role-based router
│   │   ├── OwnerNavigator.tsx    # Owner tab & stack navigator
│   │   ├── StaffNavigator.tsx    # Staff tab & stack navigator
│   │   └── MemberNavigator.tsx   # Member tab & stack navigator
│   ├── store/                    # Context & state stores
│   │   ├── auth.context.tsx      # Unified AuthContext & Session Provider
│   │   └── secure-store.ts       # expo-secure-store abstraction
│   ├── theme/                    # Slate SaaS design system (from Phase 1)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript interfaces & types
│   │   ├── role.ts
│   │   ├── session.ts
│   │   ├── navigation.ts
│   │   ├── attendance.ts
│   │   ├── member.ts
│   │   ├── payment.ts
│   │   └── class.ts
│   └── utils/                    # Formatters, QR helpers, date utilities
├── app.json                      # Expo application manifest
├── package.json                  # Unified mobile dependencies
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 2. Role Model

The application enforces three distinct user roles derived exclusively from verified backend JWT tokens:

| Role | Database Source | Description | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **`Owner`** | `staff` table (`role = 'Owner'`) | Gym business owner | Full administrative access: business KPIs, member directory, attendance ledger, payment collection, Multi-Gym branch switching, subscription management. |
| **`Staff`** | `staff` table (`role = 'Staff' \| 'Trainer'`) | Front desk staff or trainer | Operational reception access: member lookup, quick check-in / check-out, QR pass scanning, fee collection. Restricted from sensitive owner financials. |
| **`Member`** | `members` table | Registered gym member | Personal member portal: digital QR pass, physical gym QR scanner, workout check-in/out, attendance history, class schedules & booking, receipts. |

### 2.1 Security Invariant: Server-Authoritative Roles
- The client **NEVER** decides or overrides user privileges via client-side storage, local flags, route parameters, or dropdowns.
- Role identity is signed inside the JWT payload by the backend (`jwt.sign({ role, gymId, ... })`) and re-verified on every single protected API request.

---

## 3. Navigation Model

The application uses React Navigation v7 with a single top-level `RootNavigator` that dynamically renders the appropriate navigator based on authenticated session state:

```
RootNavigator
│
├── [Not Authenticated] ──> AuthNavigator
│                             └── LoginScreen (Owner/Staff & Member Pass)
│
└── [Authenticated] ─────> RoleNavigator
                              │
                              ├── [role === 'Owner'] ──> OwnerNavigator (Bottom Tabs + Modals)
                              │                            ├── HomeTab (OwnerDashboardScreen)
                              │                            ├── MembersTab (MemberListScreen)
                              │                            ├── ScanTab (ReceptionScannerScreen)
                              │                            ├── AttendanceTab (AttendanceLedgerScreen)
                              │                            ├── PaymentsTab (CollectPaymentScreen)
                              │                            └── MoreTab (GymSwitcher, Settings, Profile)
                              │
                              ├── [role === 'Staff'] ──> StaffNavigator (Bottom Tabs)
                              │                            ├── ReceptionTab (StaffReceptionScreen)
                              │                            ├── AttendanceTab (AttendanceLedgerScreen)
                              │                            ├── PaymentsTab (CollectPaymentScreen)
                              │                            ├── MembersTab (MemberListScreen)
                              │                            └── ProfileTab (StaffProfileScreen)
                              │
                              └── [role === 'Member'] ─> MemberNavigator (Bottom Tabs + Modals)
                                                           ├── HomeTab (MemberDashboardScreen)
                                                           ├── PassTab (QrPassScreen)
                                                           ├── AttendanceTab (AttendanceHistoryScreen)
                                                           ├── ClassesTab (ClassScheduleScreen)
                                                           └── ProfileTab (MemberProfileScreen)
```

### 3.1 Navigation Reset on Auth State Change
When an authenticated session is created or terminated, the navigation tree resets cleanly:
- On `login`: Stack state is replaced with the corresponding `RoleNavigator`; back button cannot return to login.
- On `logout`: Stack state is replaced with `AuthNavigator`; all caches are cleared.
- On `switchGym`: Active stack is reset to `HomeTab` with freshly refetched queries for the newly selected gym location.

---

## 4. Authentication Model

### 4.1 Login Endpoints Audited
1. **Owner / Staff Login**: `POST /api/v1/auth/login`
   - Accepts: `{ email: string, password: string }`
   - Queries: `staff` table where `email = $1` and `is_active = true`
   - Returns: `{ data: { token: string, owner: User, gym: GymInfo } }`
   - JWT Claims: `{ gymId, role: 'Owner' | 'Staff', email }`
2. **Member Login**: `POST /api/v1/member/auth/login`
   - Accepts: `{ identifier: string, password: string }` (where identifier is Member ID or Phone)
   - Queries: `members` table where `(member_id = $1 OR phone = $1)` and `is_active = true`
   - Returns: `{ data: { token: string, member: MemberUser } }`
   - JWT Claims: `{ memberId, gymId, role: 'Member' }`

### 4.2 Unified Login Architecture (Anti-Collision Design)
**Critical Vulnerability Avoided**: A naive client implementation that tries owner login, fails, and then tries member login creates severe security and usability hazards:
1. *Account Collisions*: A user who is both a gym owner/staff and a gym member with the same email/phone would have non-deterministic access.
2. *Information Disclosure*: Sequential login attempts leak account existence through differing error responses.
3. *Brute-force Amplification*: Two login requests per attempt doubles attack surface.

**The Solution: Explicit Intent Segmentation**:
The unified login screen features a high-clarity segmented control:
- **"Owner / Staff"**: Prompts for Email & Password -> routes strictly to `/api/v1/auth/login`.
- **"Member Pass"**: Prompts for Member ID or Phone & Password -> routes strictly to `/api/v1/member/auth/login`.

This ensures:
- Zero endpoint ambiguity.
- Complete compatibility with existing, unmodified production backend routes.
- Deterministic session resolution.
- Constant-time password validation on the appropriate table.

---

## 5. Tenant & Gym Scoping Model

The backend is the sole authority for tenant scoping:
- Every query on the backend enforces `gym_id = req.user.gymId`.
- The client cannot supply an arbitrary `gymId` in request bodies or headers to access another tenant's data.

### 5.1 Multi-Gym Branch Switching
For owners managing multi-location gyms:
1. Owner requests branch list: `GET /api/v1/auth/my-gyms` (authorized by owner JWT).
2. Server validates ownership of multiple branches and returns active locations.
3. Owner selects a different location: `POST /api/v1/auth/switch-gym` with `{ targetGymId }`.
4. The server validates that the owner genuinely owns `targetGymId`, creates a **new signed JWT** with `{ gymId: targetGymId, role: 'Owner' }`, and returns it.
5. The mobile client replaces the stored token with the new server-signed token and invalidates all React Query caches.
6. Members and Staff cannot switch gyms; their JWT is permanently bound to their enrolled gym.

---

## 6. Owner Flows

1. **Dashboard & KPIs**:
   - Total Members, Active Members, Checked In Today, Monthly Revenue.
   - Quick action shortcuts: Scan QR Pass, Add Member, Record Fee, View Ledger.
   - Attention cards: Memberships expiring within 7 days, overdue fee balances.
2. **Member Management**:
   - Member search with real-time text filter and status pills (All, Active, Expiring, Expired).
   - Member details: profile, plan info, join date, emergency contact, attendance history, payment history.
   - Add Member: quick registration modal capturing name, phone, gender, plan, start date, and fee.
3. **Attendance Ledger**:
   - Real-time check-in stream for current date.
   - Manual check-in override for members without phone/app.
   - Check-out recording.
4. **Reception Scanner**:
   - Camera scanner powered by `expo-camera`.
   - Reads member digital QR pass (`GYMPULSE-MEMBER:<id>:<gymId>`).
   - High-contrast visual feedback: Success (Green), Already Checked In (Amber), Expired/Invalid (Red).
5. **Payments & Fees**:
   - Record Fee modal: amount, payment mode (Cash, UPI, Card), plan duration, receipt notes.
   - Financial summaries and receipt generation.
6. **Multi-Gym Switching**:
   - Branch switcher drawer displaying all authorized locations.
   - Instant tenant context switch with cache purge.

---

## 7. Staff Flows

1. **Reception Portal**:
   - Streamlined front-desk dashboard focused on operations rather than financial analytics.
   - Quick check-in counter and member search bar.
2. **Attendance Operations**:
   - Scan member QR pass.
   - Manual check-in / check-out.
   - View today's attendance log.
3. **Payment Collection**:
   - Collect pending membership dues.
   - Generate member digital receipt.
4. **Staff Profile**:
   - View assigned gym location, staff shift info, logout action.

---

## 8. Member Flows

1. **Member Dashboard**:
   - Membership Status Card: Active/Expiring indicator, days remaining, expiry date.
   - Today's workout status (Checked In time, Checked Out time).
   - Quick action buttons: View QR Pass, Scan Gym QR.
2. **Digital QR Pass**:
   - High-resolution dynamic QR code generated via `react-native-qrcode-svg`.
   - Encodes member identity for reception scanning.
   - Member ID, photo, gym name display.
3. **Gym QR Scanner**:
   - Scans physical gym QR poster posted at gym entrance.
   - Immediate check-in recording.
   - Automatic detection of eligible classes happening during check-in window.
   - Direct "Check Out Now" action button.
4. **Attendance History**:
   - Monthly workout ledger: date, check-in time, check-out time, workout duration.
   - Total workouts this month counter.
5. **Classes & Schedules**:
   - Weekly timetable categorized by class type (Yoga, CrossFit, HIIT, Zumba, Pilates).
   - Class capacity indicator, trainer name, room location.
   - 1-tap class reservation and cancellation.
6. **Payments & Receipts**:
   - History of all membership payments made.
   - Detailed receipt view with transaction reference.

---

## 9. API Layer Plan

The API layer is consolidated into `apps/mobile/src/api/client.ts` using a unified Axios instance:

```typescript
// Core API Client Specifications
export const apiClient = axios.create({
  baseURL: getEnvironmentApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Interceptor 1: Automatic Bearer Token Attachment from SecureStore
// Interceptor 2: 401 Session Invalidation & Automatic Logout Callback
// Interceptor 3: Normalized User-Friendly Error Formatting
```

### 9.1 Consolidated API Services
- `authService`: `loginOwner()`, `loginMember()`, `logout()`, `switchGym()`, `getMyGyms()`.
- `ownerService`: `getDashboardSummary()`, `getMembers()`, `getMemberDetail()`, `createMember()`.
- `attendanceService`: `getTodayLedger()`, `scanReceptionQr()`, `scanGymQr()`, `checkOut()`.
- `paymentService`: `collectFee()`, `getPaymentHistory()`, `getReceipt()`.
- `classesService`: `getSchedule()`, `bookClass()`, `cancelBooking()`, `markAttendance()`.

---

## 10. State Management

1. **Server State (`@tanstack/react-query`)**:
   - All server data (KPIs, members, attendance, classes) is managed through React Query.
   - Query keys are scoped by gym and role (`['owner', 'members', gymId]`).
   - Query invalidation ensures instant UI updates upon scanning or fee collection.
2. **Session State (`AuthContext`)**:
   - Manages active JWT, user profile, role, and current gym.
   - Persisted encrypted via `expo-secure-store`.
   - On app startup, restores session asynchronously before rendering navigators.

---

## 11. Environment Strategy

### 11.1 Dynamic Base URL Resolution
To support development, Android emulator, iOS simulator, and physical Android devices on local Wi-Fi:

```typescript
export const getEnvironmentApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // Android Emulator host loopback
    return 'http://10.0.2.2:5000/api/v1';
  }
  // iOS Simulator / Web
  return 'http://localhost:5000/api/v1';
};
```

### 11.2 Physical Android Device Testing
For physical Android device testing on local LAN:
- Create `.env.development` with `EXPO_PUBLIC_API_URL=http://<DEVELOPER_PC_LAN_IP>:5000/api/v1`.
- Never commit hardcoded PC IP addresses to repository configuration.

---

## 12. Branding Strategy

- **Brand Name**: `obo`
- **Tagline**: "Smart Gym Management Software"
- **Color Identity**: Slate Monochrome SaaS (`#0F172A` primary, `#F8FAFC` background)
- **Assets Source**: Directly consumes approved assets from `packages/branding/assets/`:
  - App Icon: `packages/branding/assets/app/app-icon-dark.png`
  - Splash: `packages/branding/assets/splash/splash-dark.png`
  - Notification Icon: `packages/branding/assets/notification/notification-icon.png`
  - Logos: `packages/branding/assets/primary/` and `horizontal/`
- **Application Identifiers**:
  - Target Android Package: `com.obo.mobile` (Preserves legacy `com.gympulse.owner` and `com.gympulse.member` during migration until verification).
  - Target iOS Bundle ID: `com.obo.mobile`.

---

## 13. Legacy App Migration Strategy (12-Point Gate)

Neither `apps/owner-mobile` nor `apps/member-mobile` will be removed until all 12 validation criteria pass:

1. **Feature Parity**: All 18 owner features and 12 member features implemented in `apps/mobile/`.
2. **API Parity**: Every endpoint consumed by legacy apps is supported by the unified client.
3. **Navigation Parity**: All tab, stack, and modal flows verified across all 3 roles.
4. **Authentication Verification**: Owner, Staff, and Member logins succeed with correct role routing.
5. **UI Parity**: All screens adhere strictly to the Owner Web Slate SaaS design tokens.
6. **QR Code Testing**: Reception scanning and Gym QR poster scanning verified with active camera view.
7. **Payment Testing**: Fee recording, receipts, and history verified end-to-end.
8. **Class Testing**: Schedule rendering, booking limits, and check-ins verified.
9. **Multi-Gym Testing**: Branch listing and switching verified for multi-location owners.
10. **Physical Android Testing**: APK build runs and communicates with API on a physical device.
11. **Regression Suite**: Scratch test suites for tenant isolation and classes pass 100%.
12. **Production Build Verification**: `expo build` or EAS build completes cleanly with zero errors.

---

## 14. Testing Strategy

1. **Automated Typechecks**: `npx tsc --noEmit` across all mobile files.
2. **API Contract Verification**: Unit tests for API service response parsing.
3. **Tenant Isolation Verification**: Verify member queries and staff operations cannot leak across gym IDs.
4. **Scanner Simulation**: Support manual entry fallbacks for testing scanner flows without physical camera.

---

## 15. Security Invariants

1. **Client gymId is Never Authority**: Authorization is derived entirely from server-decoded JWT claims.
2. **Constant-Time Password Comparison**: Passwords are verified with bcrypt; no plain-text comparisons.
3. **Encrypted Storage**: Sensitive auth tokens stored in iOS Keychain and Android Keystore via `expo-secure-store`.
4. **Automatic 401 Purge**: Stale or revoked tokens trigger immediate session purge and redirection to login.

---

## 16. Known Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Account Collision** | User exists in both `staff` and `members` with same identifier | Explicit UI segmentation ("Owner / Staff" vs "Member Pass") on login screen |
| **Camera Permission Denial** | User denies camera access; scanner unusable | Graceful permission card with manual code entry fallback for check-in |
| **Network Latency / Timeout** | Check-in requests hang on weak gym Wi-Fi | 10s request timeout with automatic retry prompt and clear error banners |
| **Multi-Gym Stale Cache** | Data from Branch A shows after switching to Branch B | Immediate React Query cache purge (`queryClient.clear()`) on gym switch |

---

## 17. Decisions Still Requiring Implementation (Phase 3+)

1. Scaffolding `apps/mobile/package.json` and running dependency installation.
2. Building reusable UI components matching the Slate SaaS design system.
3. Porting screens from legacy apps into role-specific folders.
4. Final store release signing and package ID migration.
