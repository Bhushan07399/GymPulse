# GymPulse — Gym Settings Module Audit & Architectural Specification

**Audit Date**: September 2, 2026  
**Audited Target**: `Gym Settings & Profile Infrastructure` (`apps/api` + `apps/web` + `database/`)

---

## 1. Executive Summary

An audit of the Gym Settings module in GymPulse was performed to inspect existing schema definitions, migration scripts, backend REST APIs, repositories, controllers, validations, and Next.js frontend pages.

The existing implementation provides basic support for gym profiles and configuration settings split across the `gyms` and `gym_settings` PostgreSQL tables. However, several critical fields required for a production-ready SaaS product (such as structured operating hours, social media links like Facebook/Website, cover images, legal name, privacy policy, and Google Maps location URLs) were either missing from validations/repositories or unexposed in the UI.

---

## 2. Existing Database Schema Audit

### A. `gyms` Table (`database/schema.sql` & `apps/api/src/db/migrate.js`)
- `id` (UUID, Primary Key)
- `name` (VARCHAR(255)) — Gym Display Name
- `owner_name` (VARCHAR(255)) — Gym Owner / Manager Name
- `email` (VARCHAR(255)) — Contact Email
- `phone` (VARCHAR(30)) — Primary Contact Phone Number
- `address` (TEXT) — Street Address
- `city` (VARCHAR(100)) — City
- `state` (VARCHAR(100)) — State
- `country` (VARCHAR(100)) — Country (default 'India')
- `pincode` (VARCHAR(20)) — 6-digit postal code
- `gst_number` (VARCHAR(50)) — Optional GSTIN
- `logo_url` (TEXT) — Logo image (URL or DataURL)
- `whatsapp_number` (VARCHAR(30)) — WhatsApp contact number
- `instagram_url` (TEXT) — Instagram handle / link
- `terms_and_conditions` (TEXT) — Terms & Conditions text
- `management_contact` (TEXT) — Secondary management phone/contact
- `fitbhuz_playstore_url` / `fitbhuz_ios_url` (TEXT) — Mobile app links

### B. `gym_settings` Table (`database/schema.sql` & `apps/api/src/db/migrate.js`)
- `gym_id` (UUID, Primary Key, FK to `gyms(id)`)
- `currency` (VARCHAR(10), default 'INR')
- `timezone` (VARCHAR(50), default 'Asia/Kolkata')
- `date_format` (VARCHAR(20), default 'DD MMM YYYY')
- `time_format` (VARCHAR(10), default '12')
- `default_membership_duration` (INTEGER, default 30)
- `default_payment_method` (VARCHAR(30), default 'Cash')
- `auto_generate_member_id` (BOOLEAN, default TRUE)
- `has_classes_enabled` (BOOLEAN, default TRUE)
- `favicon_url` (TEXT)
- `receipt_header` (TEXT)
- `receipt_footer` (TEXT)
- `show_gym_logo`, `show_gst`, `show_address`, `show_contact_number` (BOOLEAN)
- `renewal_reminder`, `expiry_reminder`, `payment_confirmation`, `attendance_confirmation` (BOOLEAN)

---

## 3. Existing Backend APIs & Security Audit

### Routes (`apps/api/src/routes/gym.routes.js`)
- `GET /api/v1/gyms/profile` (Auth: `authenticate` — returns gym profile)
- `PUT /api/v1/gyms/profile` (Auth: `authenticate`, `authorize('Owner')` — updates profile)
- `GET /api/v1/gyms/settings` (Auth: `authenticate`, `authorize('Owner')` — returns settings)
- `PUT /api/v1/gyms/settings` (Auth: `authenticate`, `authorize('Owner')` — updates settings)
- `GET /api/v1/gyms/qr` (Auth: `authenticate`, `authorize('Owner', 'Receptionist')` — returns reception QR string)

### Security & Tenant Isolation Review
- **Tenant Isolation**: Every controller dereferences `request.user.gymId` from the verified JWT payload. Queries are strictly scoped with `WHERE id = $1` or `WHERE gym_id = $1`. Arbitrary `gym_id` sent in request body/params is ignored.
- **RBAC**: Profile/Settings mutation (`PUT`) is strictly protected by `authorize('Owner')`.

---

## 4. Existing UI Audit (`apps/web/app/dashboard/settings/page.tsx`)

- **Current Interface**: Basic single-page form with plain text inputs and file input for logo.
- **Deficiencies**:
  - Lacks sectioned navigation/tabs for large forms.
  - Missing fields: Operating Hours config, Facebook, Website, Google Maps link, Description, Legal Name, Privacy Policy.
  - Basic error handling without field-level validation feedback.
  - Minimal mobile responsive optimization.

---

## 5. Missing Functionality & Proposed Schema Additions

To deliver a production-grade Gym Settings system without duplicating fields or breaking existing logic:

### Schema Migration (`database/migrations/20260902_expand_gym_settings.sql`)
1. **`gyms` Table Additions**:
   - `description` TEXT NULL — About/Description of the gym
   - `google_maps_url` TEXT NULL — Google Maps location link
   - `cover_image_url` TEXT NULL — Gym cover/header image
   - `facebook_url` TEXT NULL — Facebook page link
   - `website_url` TEXT NULL — Gym website link
   - `legal_name` VARCHAR(255) NULL — Registered business legal name
   - `privacy_policy` TEXT NULL — Privacy policy / member guidelines

2. **`gym_settings` Table Additions**:
   - `operating_hours` JSONB NULL — Weekly schedule JSON (`monday` to `sunday` with `isOpen`, `openTime`, `closeTime`)

---

## 6. Proposed Reusable Settings Contract

```typescript
export type GymProfile = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstNumber?: string | null;
  legalName?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  googleMapsUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  managementContact?: string | null;
  termsAndConditions?: string | null;
  privacyPolicy?: string | null;
};

export type OperatingDaySchedule = {
  isOpen: boolean;
  openTime: string; // e.g. "06:00"
  closeTime: string; // e.g. "22:00"
};

export type WeeklyOperatingHours = {
  monday: OperatingDaySchedule;
  tuesday: OperatingDaySchedule;
  wednesday: OperatingDaySchedule;
  thursday: OperatingDaySchedule;
  friday: OperatingDaySchedule;
  saturday: OperatingDaySchedule;
  sunday: OperatingDaySchedule;
};

export type GymSettings = {
  currency: "INR";
  timezone: string;
  date_format: "DD MMM YYYY" | "DD/MM/YYYY" | "MM/DD/YYYY";
  time_format: "12" | "24";
  default_membership_duration: number;
  default_payment_method: "Cash" | "UPI" | "Card" | "Bank Transfer";
  auto_generate_member_id: boolean;
  has_classes_enabled: boolean;
  favicon_url?: string | null;
  receipt_header?: string | null;
  receipt_footer?: string | null;
  show_gym_logo: boolean;
  show_gst: boolean;
  show_address: boolean;
  show_contact_number: boolean;
  operating_hours?: WeeklyOperatingHours | null;
};
```
