# GymPulse Member Mobile App - Technical Specification & Single Source of Truth

> **Document Status**: Draft / Approved for V1 Scope  
> **Target Version**: V1.0  
> **Repository Target**: `apps/web` (Frontend Router Extensions) & `apps/api` (Member Domain Endpoints)  
> **Author**: GymPulse Engineering Team  

---

## 1. PROJECT OVERVIEW

### What GymPulse Is
GymPulse is a modern, high-performance, multi-tenant SaaS platform built to empower gym owners, staff, and members. The platform automates core gym operations, including member lifecycle management, membership plan tracking, check-in attendance, payment collection, business reporting, and member engagement.

### Owner/Admin Side vs. Member Side
- **Gym Owner/Admin Side (`apps/web/app/dashboard/*`)**: A comprehensive management dashboard designed for desktop/tablet viewports. Owners manage member records, configure membership plans, log manual attendance and payments, view revenue analytics, update gym settings, and generate system reports.
- **Member Side (`apps/web/app/member/*`)**: A mobile-first web app/PWA tailored specifically for gym members. Members use this app to view their digital membership card, check into the gym via QR scanning, observe live gym crowd occupancy, track attendance history, monitor body measurements and physical progress, review payment receipts, follow workout routines, and receive gym announcements.

### SaaS Subscription & Business Model
- **No Separate SaaS Charge for Members**: Members do **NOT** pay a separate SaaS subscription fee to GymPulse.
- **Enabled by Owner Subscription**: The member mobile experience is entirely unlocked by the Gym Owner’s active GymPulse SaaS subscription plan (`gyms.subscription_plan`, `gyms.is_active`).
- **Single Gym Association**: Each member account belongs to **exactly one gym** (`members.gym_id`).
- **Member ID Identity**: The Member ID (e.g., `GP0001`) uniquely identifies the member within their gym and across the GymPulse system sequence.

---

## 2. MEMBER ACCESS MODEL

### Access Flow
1. **GymPulse Subscription Active**: Gym Owner maintains an active SaaS account (`is_active = TRUE`, `subscription_end_date >= CURRENT_DATE`).
2. **Member Onboarding**: Gym Owner creates a new member entry via the Owner Dashboard (`POST /api/v1/members`).
3. **Member ID Generation**: PostgreSQL sequence `member_id_sequence` automatically assigns a formatted identifier (e.g., `GP0001`).
4. **Member Credentials Setup**: Member receives their Member ID (`GP0001`) and sets up/receives a secure password or 4-digit PIN.
5. **App Authentication**: Member logs into the Member App (`POST /api/v1/auth/member/login`) using their `memberId` / `phone` + `password`.
6. **Tenant Connection**: Backend issues a signed JWT containing `{ sub: member.id, memberId: member.member_id, gymId: member.gym_id, role: 'Member' }`.
7. **Sandbox Authorization**: All subsequent requests enforce both tenant isolation (`gym_id = req.user.gymId`) and personal identity isolation (`id = req.user.id`).

```
+------------------+     Owner Creates     +---------------------+     Auto-Assigns     +----------------------+
| Gym Owner / Admin| --------------------> | Member Record       | -------------------> | Member ID (GP0001)   |
+------------------+                       +---------------------+                      +----------------------+
                                                                                                  |
                                                                                                  v
+------------------+     Issues JWT Token  +---------------------+   Logs In (ID+Pass)  +----------------------+
| Member Mobile App| <-------------------- | Express Auth API    | <------------------- | Gym Member           |
+------------------+  {role:'Member',...}  +---------------------+                      +----------------------+
```

### Security & Privacy Guarantee
- **Zero Cross-Member Access**: A member must **NEVER** be able to query, view, or modify another member's attendance, payment history, body measurements, or personal details.
- **Credential Integrity**: The public `memberId` (e.g., `GP0001`) or QR string is **NOT** treated as a secret credential. Access to sensitive routes requires a cryptographically verified JWT signature.

---

## 3. V1 FEATURE SCOPE

### In Scope for V1
- **Member Authentication**: Secure sign-in with `memberId`/`phone` + `password`/`PIN` and session management.
- **Member Dashboard**: Personal hero banner, membership status badge, live crowd status, quick stats, and action cards.
- **QR Attendance**: Built-in camera scanner to check in/out by scanning the gym's official QR code.
- **Attendance History**: Monthly calendar/list view of check-in and check-out logs.
- **Live Gym Crowd & Peak Hours**: Real-time occupancy gauge (Low/Medium/High) and hourly occupancy trends.
- **Digital Member Card**: Visual mobile card displaying gym logo, member details, active status, and personal check-in QR.
- **Membership Management**: View active plan details, start/expiry dates, days remaining, and plan terms.
- **Membership Renewal**: Select renewal plans and review renewal invoices.
- **Payment History & Receipts**: List of past transactions, payment methods, transaction references, and downloadable receipts.
- **Body Measurements**: Log and view metrics (Weight, Height, Chest, Waist, Arms, Thighs, Body Fat %, Muscle Mass, BMI).
- **Progress Tracking & Charts**: Visual timeline charts for weight and body measurements over time.
- **Progress Photos**: Upload and compare before/after physical progress photos.
- **Fitness Goals**: Target weight and body composition goals with visual completion percentage.
- **Workout Routines**: View assigned workout routines, exercises, sets, reps, and rest intervals.
- **Notifications**: In-app notifications for renewals, payment confirmations, and attendance check-ins.
- **Gym Announcements**: Broadcast board for owner/gym notices (holidays, event notices, timing adjustments).
- **Attendance Streaks & Badges**: Gamified consecutive attendance streaks and milestone achievements.
- **Member Profile & Settings**: Update contact information, profile photo, notification preferences, and password.

### Out of Scope for V1 (Reserved for V2 Architecture)
- ❌ Trainer module & trainer assignment management.
- ❌ Real-time trainer-to-member direct chat.
- ❌ AI-driven meal planning or diet/nutrition tracker.
- ❌ AI automated fitness coaching recommendations.
- ❌ Social feeds, member-to-member posts, or public comments.
- ❌ Cross-gym leaderboards or multi-gym membership roaming.

---

## 4. MOBILE APP INFORMATION ARCHITECTURE

The Member App routes will exist within the Next.js App Router under the `/member` path segment:

```
/member
├── /login                   -> Member Authentication Screen
├── /dashboard               -> Core Member Dashboard (Protected)
├── /scan                    -> QR Camera Check-in / Check-out (Protected)
├── /attendance              -> Full Attendance Logs & History (Protected)
├── /membership              -> Current Plan Details & Expiry Info (Protected)
├── /membership/renew        -> Plan Selection & Renewal Flow (Protected)
├── /payments                -> Payment History & Digital Receipts (Protected)
├── /member-card             -> Fullscreen Digital Gym ID Pass (Protected)
├── /progress                -> Overview Charts & Before/After Photos (Protected)
├── /measurements            -> Body Metrics Log & Form Entry (Protected)
├── /goals                   -> Personal Fitness Goals Tracker (Protected)
├── /workout                 -> Workout Plan & Exercise Guide (Protected)
├── /notifications           -> Notifications Inbox (Protected)
├── /announcements          -> Gym Broadcast Bulletin Board (Protected)
├── /profile                 -> Personal Profile Management (Protected)
└── /settings                -> Preferences & Security Settings (Protected)
```

---

## 5. BOTTOM NAVIGATION

The mobile app utilizes a persistent, thumb-friendly bottom navigation bar across all protected views:

1. **Home (`/member/dashboard`)**: Icon: `Home`. Overview hero, membership status card, crowd widget, and quick actions.
2. **Scan (`/member/scan`)**: Icon: `QrCode` (Elevated primary action button). Instant camera scanner for QR check-in.
3. **Progress (`/member/progress`)**: Icon: `TrendingUp`. Weight/measurement charts, fitness goals, and progress photos.
4. **Workout (`/member/workout`)**: Icon: `Dumbbell`. Assigned daily workout routines, exercise sets, and reps.
5. **Profile (`/member/profile`)**: Icon: `User`. Personal info, digital member card launcher, notification inbox, and settings.

---

## 6. DESIGN SYSTEM

### Visual Aesthetics
- **Mobile-First**: Optimized for single-hand touch interactions, responsive safe areas, and 44px+ touch targets.
- **Style**: Modern, clean, high-contrast, slate-white aesthetic with subtle glassmorphic card overlays and crisp borders.

### Color Tokens
Mapped to Tailwind CSS v4 CSS variables:

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--color-primary` | `#0F172A` (Slate 900) | Primary buttons, active nav icons, main headings |
| `--color-primary-hover` | `#1E293B` (Slate 800) | Interactive states, hover fills |
| `--color-primary-light` | `#F1F5F9` (Slate 100) | Secondary button fill, subtle badge background |
| `--color-accent` | `#2563EB` (Blue 600) | Interactive links, focus rings, progress bars |
| `--color-text-primary` | `#0F172A` (Slate 900) | Card titles, primary text |
| `--color-text-secondary` | `#475569` (Slate 600) | Subtitles, body labels |
| `--color-text-muted` | `#94A3B8` (Slate 400) | Placeholders, timestamps, helper text |
| `--color-border` | `#E2E8F0` (Slate 200) | Card dividers, input borders |
| `--color-background` | `#F8FAFC` (Slate 50) | App page background |
| `--color-surface` | `#FFFFFF` (White) | Card containers, modal overlays, bottom bar |
| `--color-success` | `#16A34A` (Green 600) | Active status, streak badges, checked-in indicator |
| `--color-warning` | `#D97706` (Amber 600) | Renewal warning (expiring soon), medium crowd level |
| `--color-error` | `#DC2626` (Red 600) | Expired membership, high crowd level, validation errors |
| `--color-info` | `#0284C7` (Sky 600) | Announcements, general notifications |

### Typography Scale
Using Inter (`var(--font-inter)`):
- **H1**: 24px (`1.5rem`), SemiBold (`font-semibold`), Tracking Tight.
- **H2**: 20px (`1.25rem`), SemiBold (`font-semibold`).
- **H3**: 16px (`1rem`), Medium (`font-medium`).
- **Body**: 14px (`0.875rem`), Regular (`font-normal`), Line-height `1.5`.
- **Small**: 12px (`0.75rem`), Regular (`font-normal`).
- **Caption**: 11px (`0.6875rem`), Medium (`font-medium`), Uppercase Tracking Wider.
- **Button Text**: 14px (`0.875rem`), SemiBold (`font-semibold`).

### Spacing & Layout
- Spacing scale: `4px` (`0.25rem`), `8px` (`0.5rem`), `12px` (`0.75rem`), `16px` (`1rem`), `24px` (`1.5rem`), `32px` (`2rem`).
- Container padding: Horizontal `16px` (`px-4`) on mobile viewports.

### Border Radius & Elevation
- **Small (`rounded-md`)**: 6px (Badges, tags).
- **Medium (`rounded-lg`)**: 8px (Inputs, dropdowns).
- **Large (`rounded-xl`)**: 12px (Action buttons, standard cards).
- **Extra Large (`rounded-2xl`)**: 16px (Hero cards, digital member pass).
- **Shadows**:
  - `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Cards, input fields).
  - `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1)` (Floating bottom nav, popovers).

### Iconography
- Standardized strictly on **Lucide React** (`lucide-react`), matching existing packages in [`apps/web/package.json`](file:///c:/Users/bhush/OneDrive/Desktop/GymPulse/apps/web/package.json).

---

## 7. 3D VISUAL DESIGN

To deliver a high-end visual experience, key screens incorporate curated, high-performance 3D visual assets:

1. **Login Screen 3D Hero**:
   - **Concept**: A sleek, dark/metallic 3D gym dumbbell or stylized pulse emblem.
   - **Placement**: Centered top hero area above the login card.
   - **Dimensions**: Max height `180px`, rendered responsively.
2. **Dashboard 3D Header**:
   - **Concept**: An energetic 3D fitness ring / streak flame icon.
   - **Placement**: Top hero banner right side of the greeting.
   - **Dimensions**: `80px x 80px`.
3. **Performance Optimization Rules**:
   - Static WebP/PNG 3D renders with transparent backgrounds or lightweight CSS/Framer Motion rotation effects.
   - Lazy-loaded (`loading="lazy"`) to prevent render-blocking on lower-end mobile devices.
   - Total 3D image assets size budget: `< 150 KB` combined.

---

## 8. MEMBER LOGIN SCREEN (`/member/login`)

### Key Components
- **Header**: GymPulse brand logo & title.
- **Visual**: Optimized 3D fitness element.
- **Form Fields**:
  - `Member ID or Phone`: Input field with prefix validation (`GP0001` format or 10-digit mobile number).
  - `Password / PIN`: Password input with show/hide toggle.
- **Controls**:
  - `Remember Member ID` checkbox (persists public ID in `localStorage`).
  - `Sign In` primary button with active loading spinner state.
  - `Need Help?`: Modal trigger to contact gym receptionist/owner.
- **Security Features**:
  - Rate limiting handling (`429 Too Many Requests`).
  - Clear error toast notifications (`"Invalid Member ID or Password"`).

---

## 9. MEMBER DASHBOARD (`/member/dashboard`)

### Dashboard Modules
1. **Header Bar**:
   - Greeting (e.g., *"Good Morning, Alex"*).
   - Member Avatar with active status indicator dot.
   - Notification Bell button with unread count badge.
2. **Hero Banner**:
   - Integrated 3D visual.
   - Displays `Member ID` badge (`GP0001`).
   - Active gym name (`"Powerhouse Fitness"`).
3. **Membership Status Card**:
   - Current plan name (`"Annual Gold VIP"`).
   - Expiry counter pill (`"24 Days Remaining"`).
   - Quick `"Renew"` CTA trigger.
4. **Attendance & Streak Summary**:
   - Today's Check-in status (`"Checked In at 07:30 AM"` / `"Not Checked In Yet"`).
   - Monthly consistency percentage gauge.
   - Current attendance streak (`"🔥 12 Days Streak"`).
5. **Live Gym Crowd Widget**:
   - Live member count inside the gym (e.g., `18 / 50 Members`).
   - Occupancy level badge (`LOW`, `MEDIUM`, `HIGH`).
6. **Progress Snapshot**:
   - Starting Weight vs. Current Weight vs. Goal Weight.
   - Sparkline chart showing last 30-day weight trajectory.
7. **Quick Action Grid**:
   - `[Scan QR]` | `[Digital Card]` | `[My Workouts]` | `[Payments]`

---

## 10. QR ATTENDANCE (`/member/scan`)

### Scan & Check-in Architecture
```
Member opens /member/scan
  ├── 1. Request Browser Camera Permission
  ├── 2. Render Live Video Feed with Scan Overlay Guide
  ├── 3. User Scans Gym QR Code Token
  ├── 4. Client Sends POST /api/v1/member/attendance/check-in { qrPayload }
  ├── 5. Backend Validates:
  │      ├── Gym ID matches req.user.gymId
  │      ├── QR Code matches Gym's active code / dynamic token
  │      ├── Member membership is ACTIVE and NOT EXPIRED
  │      └── Member doesn't already have an open active check-in
  └── 6. Response Success -> Render Animated Check-In Card & Haptic Feedback
```

### Check-Out Support
- If the member is currently checked in, scanning the QR code again automatically records `check_out_time` and closes the session.

---

## 11. LIVE GYM CROWD (`/member/crowd`)

### Occupancy Calculation Engine
- **Active Occupancy Query**:
  `COUNT(*) FROM attendance WHERE gym_id = $gymId AND check_in_time IS NOT NULL AND check_out_time IS NULL AND attendance_date = CURRENT_DATE`
- **Threshold Definitions**:
  - `Low`: `0% - 40%` of max gym capacity (`gym_settings` or default 50).
  - `Medium`: `41% - 75%` capacity.
  - `High`: `76% - 100%+` capacity.
- **Privacy Enforcement**: The API returns **only aggregate metrics** (count, capacity percentage, crowd state). No individual member list or names are ever exposed to members.
- **Peak Hour Analytics Chart**: Hourly bar chart displaying typical crowd levels from 06:00 AM to 10:00 PM based on 30-day historical attendance averages.

---

## 12. DIGITAL MEMBER CARD (`/member/member-card`)

### Digital Pass Specification
- Designed as a full-screen, high-contrast digital membership card optimized for screen scanning:
  - **Header**: Gym Name & Gym Logo.
  - **Body**: Member Full Name, Member ID (`GP0001`), Membership Tier Name.
  - **Dynamic QR Code**: Encoded string containing `{ gymId, memberId, timestamp }` for reception scanner verification.
  - **Footer**: Membership Valid Until date and active verification seal.

---

## 13. MEMBERSHIP (`/member/membership`)

### Features
- **Active Plan Summary**: Plan title, price, duration, start date, end date, and remaining days progress ring.
- **Plan Benefits List**: List of included amenities (e.g., *"Steam Bath Access"*, *"Cardio Zone"*, *"Locker Facilities"*).
- **Plan History**: Timeline list of previous membership plans held by the member at this gym.

---

## 14. PAYMENTS (`/member/payments`)

### Transaction Logs & Receipts
- **List View**: Chronological order of past payments.
- **Card Metadata**: Payment Amount (`₹2,500`), Date (`12 Aug 2026`), Payment Method (`UPI` / `Cash` / `Card`), Transaction Reference ID, Payment Status (`Paid`, `Pending`, `Refunded`).
- **Digital Receipt View**: Modal presenting an official itemized breakdown (Base amount, Tax amount, Discount, Total) with Gym header info, invoice number, and print/download button.

---

## 15. RENEWAL (`/member/membership/renew`)

### Renewal Flow
1. Member clicks `"Renew Membership"`.
2. App fetches active plans offered by the gym (`GET /api/v1/membership-plans`).
3. Member selects desired plan & duration.
4. App presents renewal summary (Plan cost, tax breakdown, calculated new expiry date).
5. Payment Gateway Readiness: Present payment options or request staff payment collection trigger.
6. Upon payment confirmation, backend updates `members.expiry_date` and creates a new `payments` record.

---

## 16. BODY MEASUREMENTS (`/member/measurements`)

### Data Model & Fields
- `weight` (kg), `height` (cm), `chest` (in), `waist` (in), `arms` (in), `thigh` (in), `body_fat_percentage` (%), `muscle_mass` (kg), `bmi` (Auto-calculated: $\text{weight} / \text{height}^2$).
- **History & Comparison**: Table showing current reading vs. previous reading with delta indicators (`-1.5 kg` in green for weight loss goal).
- **Permission Scoping**: Members can view and log their own measurements. Gym trainers/owners can also log measurements for members via the admin panel.

---

## 17. PROGRESS (`/member/progress`)

### Tracking Dashboard
- **Interactive Charts**: Line charts powered by SVG/Recharts displaying progress over 1 month, 3 months, 6 months, or All Time for Weight, Body Fat, and Body Measurements.
- **Before / After Photo Gallery**: Side-by-side visual photo comparison with date tags. Photos are privately stored per member.

---

## 18. GOALS (`/member/goals`)

### Fitness Goal Management
- Goal Types: `Weight Loss`, `Muscle Gain`, `Maintenance`, `Strength Building`.
- Fields: `target_weight`, `target_body_fat`, `target_date`.
- Visual UI: Dynamic radial progress bar showing percentage towards goal target ($\frac{\text{Initial} - \text{Current}}{\text{Initial} - \text{Target}} \times 100\%$).

---

## 19. WORKOUT (`/member/workout`)

### Daily Routine Display
- View daily workout routines assigned to the member.
- Exercise cards detailing: Exercise Name, Category, Machine/Equipment, Target Sets, Reps range, and Recommended Rest Seconds (e.g., `4 Sets x 12 Reps | Rest: 60s`).
- Extensible schema structure allowing future trainer assignment integrations without breaking V1 schema.

---

## 20. NOTIFICATIONS (`/member/notifications`)

### Notification Center
- Lists logs from the `notifications` table filtered by `member_id`.
- Types: `Membership Expiry`, `Payment Reminder`, `Attendance Reminder`, `Announcement`.
- Functionality: Mark single/all as read (`is_read = TRUE`), view timestamps, filter by category.

---

## 21. GYM ANNOUNCEMENTS (`/member/announcements`)

### Broadcast Bulletin Board
- Read-only stream of gym announcements created by the Gym Owner/Admin (`notification_type = 'Announcement'`).
- Display cards featuring Title, Message Body, Date Posted, and Priority Tag (`Important`, `Event`, `Timing`).

---

## 22. STREAKS AND GAMIFICATION

### Member Motivation System
- **Attendance Streak Counter**: Tracks consecutive days of gym attendance.
- **Milestone Badges**:
  - 🥉 `First Step`: Completed 1st Check-in.
  - 🥈 `Iron Will`: 10-day active streak.
  - 🥇 `Gym Addict`: 30-day active streak.
  - 🏆 `Century Club`: 100 total check-ins.

---

## 23. PROFILE (`/member/profile`)

### Member Profile Screen
- **Read-Only Fields**: `Member ID` (`GP0001`), `Join Date`, `Assigned Gym Name`, `Membership Status`.
- **Editable Fields**: `First Name`, `Last Name`, `Phone`, `Email`, `Emergency Contact`, `Address`, `Profile Photo`.

---

## 24. SETTINGS (`/member/settings`)

### Configuration Options
- Toggle push/email notification reminders.
- Change Account Password / Security PIN.
- Theme preference indicator (Default Light Mode).
- App version details (`GymPulse Member v1.0.0`).
- Logout Action (Clears session tokens and redirects to `/member/login`).

---

## 25. DATA SECURITY

### Security Guidelines
1. **Server-Side Authorization**: Never trust `memberId` or `gymId` sent in the request body/params without verifying that it matches the authenticated JWT claims (`req.user`).
2. **Prevent IDOR Vulnerabilities**: All database queries must evaluate:
   `WHERE gym_id = req.user.gymId AND member_id = req.user.id`
3. **No Cross-Gym / Cross-Member Data Leaks**: Strict unit tests verifying that Member A cannot query Member B's endpoints even if Member A manually inputs Member B's UUID.
4. **QR Validation Security**: QR payload signature verification to prevent spoofed or forged check-ins.

---

## 26. MULTI-TENANCY

GymPulse enforces strict multi-tenant isolation at every layer:

```
[ Gym A Tenant ]                                      [ Gym B Tenant ]
  ├── Gym A Settings & QR                                ├── Gym B Settings & QR
  ├── Members (Gym A ID)                                 ├── Members (Gym B ID)
  │    └── Member A1 (GP0001)                            │    └── Member B1 (GP0002)
  │         └── Personal Data Only                       │         └── Personal Data Only
  └── Attendance / Payments (Gym A)                      └── Attendance / Payments (Gym B)
```

- Query Enforcement: All repository functions check `gym_id = req.user.gymId`.

---

## 27. DATABASE

### Existing Models to Reuse (from [`database/schema.sql`](file:///c:/Users/bhush/OneDrive/Desktop/GymPulse/database/schema.sql))
- `gyms`: Gym tenant details.
- `membership_plans`: Membership plan definitions.
- `members`: Existing member entity (Needs addition of `password_hash`).
- `attendance`: Check-in / check-out history.
- `payments`: Financial payment logs.
- `gym_settings`: Gym settings & max capacity settings.
- `notifications`: Notifications & broadcast announcements.

### New Tables / Migrations Required for Member App
- `members`: Add `password_hash TEXT NULL`, `reset_token TEXT NULL`, `reset_token_expiry TIMESTAMPTZ NULL`.
- `body_measurements`: New table for tracking physical measurements over time.
- `progress_photos`: New table for storing member progress photos.
- `fitness_goals`: New table for tracking fitness targets.
- `workouts`: New table for exercise routines and assigned daily plans.

---

## 28. API ARCHITECTURE

### API Specifications for Member App

#### Authentication & Profile
- `POST /api/v1/auth/member/login`
  - Body: `{ memberId, password }`
  - Response: `{ token, member: { id, memberId, firstName, lastName, gymId } }`
- `GET /api/v1/member/profile` (Auth: Member) -> Fetch current profile.
- `PUT /api/v1/member/profile` (Auth: Member) -> Update editable profile fields.

#### Attendance & QR
- `POST /api/v1/member/attendance/check-in` (Auth: Member)
  - Body: `{ qrCode }`
  - Validation: Confirms QR matches `req.user.gymId` and membership is active.
- `GET /api/v1/member/attendance` (Auth: Member) -> Query parameter paginated attendance logs for logged-in member.

#### Gym Crowd
- `GET /api/v1/member/crowd` (Auth: Member)
  - Response: `{ currentOccupancy, maxCapacity, crowdLevel: 'LOW'|'MEDIUM'|'HIGH', peakHours: [...] }`

#### Membership & Payments
- `GET /api/v1/member/membership` (Auth: Member) -> Active plan, days left, renewal options.
- `GET /api/v1/member/payments` (Auth: Member) -> Personal payment history logs & receipts.

#### Measurements & Progress
- `GET /api/v1/member/measurements` (Auth: Member) -> Historical measurements.
- `POST /api/v1/member/measurements` (Auth: Member) -> Log new body measurements.
- `GET /api/v1/member/progress-photos` (Auth: Member) -> Progress photo timeline.
- `POST /api/v1/member/progress-photos` (Auth: Member) -> Upload new progress photo.

#### Workouts & Notifications
- `GET /api/v1/member/workouts` (Auth: Member) -> Assigned workout routines.
- `GET /api/v1/member/notifications` (Auth: Member) -> Personal notifications inbox.
- `GET /api/v1/member/announcements` (Auth: Member) -> Gym broadcast notices.

---

## 29. FRONTEND FOLDER STRUCTURE

Recommended addition within [`apps/web`](file:///c:/Users/bhush/OneDrive/Desktop/GymPulse/apps/web):

```
apps/web/
├── app/
│   └── member/                     -> Member App Route Group
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       ├── scan/page.tsx
│       ├── attendance/page.tsx
│       ├── membership/page.tsx
│       ├── payments/page.tsx
│       ├── member-card/page.tsx
│       ├── progress/page.tsx
│       ├── measurements/page.tsx
│       ├── goals/page.tsx
│       ├── workout/page.tsx
│       ├── notifications/page.tsx
│       ├── announcements/page.tsx
│       ├── profile/page.tsx
│       └── settings/page.tsx
├── src/
│   ├── components/
│   │   └── member/                 -> Reusable Member UI Components
│   │       ├── bottom-nav.tsx
│   │       ├── member-header.tsx
│   │       ├── membership-card.tsx
│   │       ├── crowd-widget.tsx
│   │       ├── digital-card.tsx
│   │       ├── qr-scanner.tsx
│   │       ├── streak-badge.tsx
│   │       └── progress-chart.tsx
│   ├── services/
│   │   └── member-api.service.ts   -> API Service methods for member app
│   └── hooks/
│       └── use-member-auth.ts      -> Hook for member auth session
```

---

## 30. COMPONENT SYSTEM

Reusable member-side UI components:
- `MemberHeader`: Top navigation header with avatar & notifications bell.
- `BottomNavigation`: Fixed bottom bar with 5 primary section triggers.
- `MembershipCard`: Status card displaying active tier and remaining days.
- `AttendanceCard`: Check-in summary and active streak status.
- `CrowdCard`: Live gym capacity gauge widget.
- `DigitalMemberCard`: High-contrast mobile member ID card with QR code.
- `QRScanner`: Camera-integrated scanner modal with target overlay.
- `ProgressChart`: Reusable SVG line chart for weight/measurement tracking.
- `PaymentCard`: Transaction record item with receipt modal trigger.
- `AnnouncementCard`: Notice banner with category icon and date tag.

---

## 31. STATE MANAGEMENT

- Uses existing `@tanstack/react-query` setup for asynchronous server state, cache invalidation, and data refetching.
- React Context / `localStorage` for local member session state (`gympulse.member-token`).

---

## 32. API / SERVICE LAYER

- Extends [`api-client.ts`](file:///c:/Users/bhush/OneDrive/Desktop/GymPulse/apps/web/src/lib/api-client.ts).
- Automatically appends `Authorization: Bearer <member_token>` for request URLs matching `/member/*`.
- Standard error interceptors format backend `AppError` payloads into toast notifications.

---

## 33. UX STATES

Every member screen must handle 4 core states gracefully:
1. **Loading State**: Skeleton pulse placeholders matching component layout.
2. **Empty State**: Friendly illustrations/icons with action triggers (e.g., *"No payment history found"*).
3. **Error State**: Non-blocking alert cards with a `"Try Again"` retry button.
4. **Success State**: Smooth transition animations (`framer-motion`) presenting real data.

---

## 34. RESPONSIVE / MOBILE RULES

- Viewport target: `320px` to `430px` mobile screens.
- Touch target minimum: `44px x 44px`.
- Keyboard safe layout: Form inputs scroll automatically above the software keyboard.
- Safe areas: Bottom navigation respects iOS Home Indicator safe area (`padding-bottom: env(safe-area-inset-bottom)`).

---

## 35. ACCESSIBILITY

- High Contrast Ratio: Text meets WCAG AA standards against Slate 50/White backgrounds.
- Screen-Reader Support: `aria-label` attributes on all icon-only buttons and bottom nav items.
- Focus Indicators: Visible focus rings (`focus:ring-2 focus:ring-blue-600`) for accessibility navigation.

---

## 36. PERFORMANCE

- **Initial Load Budget**: `< 2.0s` First Contentful Paint (FCP) on 4G connections.
- **Bundle Optimization**: Dynamic imports (`next/dynamic`) for camera QR scanner and chart libraries.
- **Image Optimization**: WebP format with `next/image` lazy loading for member profile photos and progress shots.

---

## 37. ERROR HANDLING

- Standardized Error Handling:
  - 401 Unauthorized: Redirect to `/member/login`.
  - 403 Forbidden: Display access boundary message (`"Expired membership. Please renew to access check-in."`).
  - 429 Rate Limit: Toast warning (`"Too many scan attempts. Please wait 1 minute."`).
  - Network Failure: Persistent top banner warning (`"Offline - Reconnecting..."`).

---

## 38. OWNER ↔ MEMBER DATA FLOW

```
+------------------------------------+          +------------------------------------+
|         Gym Owner Action           |          |        Member App Reaction         |
+------------------------------------+          +------------------------------------+
| Owner registers new member         | -------> | Member receives Member ID & login  |
| Owner creates membership plan      | -------> | Member sees plan in Renewal list   |
| Owner logs manual payment          | -------> | Member sees payment log & receipt  |
| Owner updates gym capacity setting | -------> | Live Crowd gauge updates max cap   |
| Owner publishes gym announcement   | -------> | Announcement appears in feed       |
| Member scans QR check-in           | -------> | Owner Attendance dashboard updates |
+------------------------------------+          +------------------------------------+
```

---

## 39. FEATURE DEPENDENCIES

```
Member Authentication
  ├── Required by -> All Protected Member Routes
  └── Linked to -> Member Profile & Digital ID Card

Gym QR & Settings
  └── Required by -> QR Attendance Check-In -> Feeds -> Live Gym Crowd & Streaks

Membership Plan & Payments
  └── Required by -> Renewal Flow & Access Authorization Status

Body Measurements
  └── Required by -> Progress Charts & Fitness Goals
```

---

## 40. V1 DEFINITION OF DONE

The Member App is considered **V1 Complete** only when:
- [ ] Member Login & Token Auth function securely.
- [ ] Member data is strictly sandboxed (Zero cross-member / cross-gym access).
- [ ] Member Dashboard renders live metrics and hero banner.
- [ ] QR Scan Check-In/Check-Out successfully records attendance.
- [ ] Live Gym Crowd gauge accurately calculates active occupancy.
- [ ] Digital Member Card displays dynamic QR code and membership status.
- [ ] Payments history and downloadable digital receipts function.
- [ ] Membership view and renewal flows operate seamlessly.
- [ ] Body measurements, progress charts, and goals function properly.
- [ ] Daily assigned workout routines display correctly.
- [ ] Notifications and Gym Announcements feeds populate accurately.
- [ ] Mobile UI is responsive with 0 horizontal overflow.
- [ ] 0 TypeScript compiler errors and 0 console warnings.
- [ ] Existing Gym Owner/Admin functionality remains 100% intact.

---

## 41. V2 ROADMAP

Future expansion modules planned for V2:
- 🚀 **Trainer Module**: Assign personal trainers, view trainer profile, and schedule personal sessions.
- 💬 **In-App Messaging**: Real-time chat between member and assigned gym trainer.
- 🥗 **Diet & Nutrition**: Calorie tracker, macro breakdown, and customized meal plans.
- 🤖 **AI Fitness Coach**: Automated workout recommendations based on progress analytics.
- ⌚ **Wearable Integration**: Sync steps, heart rate, and active calories from Apple Health and Google Fit.

---

## 42. IMPLEMENTATION RULES

1. **Treat this document as the Single Source of Truth** for all Member App development.
2. **Preserve Owner/Admin Functionality**: Existing APIs in `apps/api` and web pages in `apps/web/app/dashboard` must remain unaffected.
3. **No Unnecessary Dependencies**: Reuse existing project libraries (`lucide-react`, `zod`, `framer-motion`, `@tanstack/react-query`, `axios`, `express`).
4. **Strict Server-Side Security**: Never rely on client-provided IDs without verifying against JWT claims.
5. **Zero Mock Data in Production**: All UI widgets must consume real backend database APIs.

---

## 43. IMPLEMENTATION ORDER

Development must proceed sequentially across the following phases:

- **Phase 1**: DB Migration (`password_hash` on `members`) + Auth APIs + Member Navigation & Login + Dashboard Frame.
- **Phase 2**: Digital Member Card + Membership Details + Payment History & Receipts.
- **Phase 3**: Gym QR Generation (Owner side) + Mobile QR Scanner + Attendance Check-In API + Live Gym Crowd.
- **Phase 4**: Body Measurements DB Table & APIs + Progress Charts + Fitness Goals.
- **Phase 5**: Workout Routine Display + Notifications & Gym Announcements Feed.
- **Phase 6**: Streaks & Gamification Badges + Mobile UI Polish & Micro-animations.
- **Phase 7**: Security Audit + Performance Optimization + End-to-End Verification.

---

## 44. CHANGE LOG

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| **2026-08-21** | `v1.0.0` | Initial creation of GymPulse Member Mobile App Specification | GymPulse Engineering Team |

---
*End of Specification Document.*
