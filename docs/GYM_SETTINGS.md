# GymPulse — Gym Settings System Documentation

## 1. Overview & Architecture

The **Gym Settings Module** in GymPulse enables gym owners and management to configure gym identity, location, branding, social media links, operating hours, business tax/invoicing information, receipt headers/footers, and member policies.

All operations are strictly scoped to the authenticated gym tenant via JWT tokens (`request.user.gymId`). Arbitrary client inputs for `gym_id` are rejected, enforcing strict multi-tenant isolation.

---

## 2. Database Schema

### `gyms` Table
- `id` (UUID, PK): Unique gym identifier.
- `name` (VARCHAR(255)): Display name of the gym.
- `owner_name` (VARCHAR(255)): Owner or manager full name.
- `email` (VARCHAR(255)): Primary gym contact email.
- `phone` (VARCHAR(30)): Primary gym contact telephone.
- `whatsapp_number` (VARCHAR(30)): WhatsApp Business contact number.
- `address` (TEXT): Street address.
- `city` (VARCHAR(100)): City.
- `state` (VARCHAR(100)): State.
- `country` (VARCHAR(100)): Country (default 'India').
- `pincode` (VARCHAR(20)): Postal code (6-digit format).
- `gst_number` (VARCHAR(50)): Optional GSTIN number.
- `legal_name` (VARCHAR(255)): Registered business legal entity name.
- `logo_url` (TEXT): Logo image DataURL or URL.
- `cover_image_url` (TEXT): Cover banner image DataURL or URL.
- `description` (TEXT): About/description of the gym.
- `google_maps_url` (TEXT): Google Maps location link.
- `instagram_url` (TEXT): Instagram profile URL.
- `facebook_url` (TEXT): Facebook page URL.
- `website_url` (TEXT): Official website URL.
- `management_contact` (TEXT): Secondary desk/management phone number.
- `terms_and_conditions` (TEXT): Gym rules and terms of service.
- `privacy_policy` (TEXT): Privacy policy text.

### `gym_settings` Table
- `gym_id` (UUID, PK, FK to `gyms(id)`).
- `currency` (VARCHAR(10)): Default currency (fixed 'INR' / ₹).
- `timezone` (VARCHAR(50)): Default timezone ('Asia/Kolkata').
- `date_format` (VARCHAR(20)): Display date format ('DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY').
- `time_format` (VARCHAR(10)): Time format ('12' or '24').
- `default_membership_duration` (INTEGER): Default plan duration in days (default 30).
- `default_payment_method` (VARCHAR(30)): Default payment method ('Cash', 'UPI', 'Card', 'Bank Transfer').
- `auto_generate_member_id` (BOOLEAN): Auto-generate member IDs.
- `has_classes_enabled` (BOOLEAN): Feature entitlement toggle for Classes & Group Sessions module.
- `receipt_header` (TEXT): Invoice header title.
- `receipt_footer` (TEXT): Invoice footer notes and terms.
- `show_gym_logo`, `show_gst`, `show_address`, `show_contact_number` (BOOLEAN): Receipt rendering options.
- `operating_hours` (JSONB): Structured weekly schedule object:
  ```json
  {
    "monday": { "isOpen": true, "openTime": "06:00", "closeTime": "22:00" },
    "tuesday": { "isOpen": true, "openTime": "06:00", "closeTime": "22:00" },
    "wednesday": { "isOpen": true, "openTime": "06:00", "closeTime": "22:00" },
    "thursday": { "isOpen": true, "openTime": "06:00", "closeTime": "22:00" },
    "friday": { "isOpen": true, "openTime": "06:00", "closeTime": "22:00" },
    "saturday": { "isOpen": true, "openTime": "06:00", "closeTime": "21:00" },
    "sunday": { "isOpen": false, "openTime": "07:00", "closeTime": "13:00" }
  }
  ```

---

## 3. Backend REST Endpoints

### 1. `GET /api/v1/gyms/profile`
- **Auth**: `authenticate` middleware required.
- **Response**: Returns current authenticated gym profile object.

### 2. `PUT /api/v1/gyms/profile`
- **Auth**: `authenticate`, `authorize('Owner')` middleware required.
- **Validation**: `updateGymProfileSchema` (Zod validation for phone, 6-digit pincode, email, valid URLs).
- **Response**: Returns updated gym profile object.

### 3. `GET /api/v1/gyms/settings`
- **Auth**: `authenticate`, `authorize('Owner')` middleware required.
- **Response**: Returns gym settings object including operating hours and display flags.

### 4. `PUT /api/v1/gyms/settings`
- **Auth**: `authenticate`, `authorize('Owner')` middleware required.
- **Validation**: `updateGymSettingsSchema` (Zod validation for enum options, numeric bounds, operating hours JSON).
- **Response**: Returns updated gym settings object.

---

## 4. Tenant Isolation & Security

- **Enforcement**: Tenant ID is derived directly from the signed JWT payload (`request.user.gymId`).
- **Isolation Check**: Every database query filters by `WHERE id = $1` or `WHERE gym_id = $1`. Gym A is strictly prevented from inspecting or modifying Gym B settings.

---

## 5. Module Consumption & Future Integrations

1. **Receipts & Invoices**: `receipt_header`, `receipt_footer`, `show_gym_logo`, `show_gst`, `show_address`, `show_contact_number`, `logo_url`, and `gst_number` are consumed by payment invoice rendering services.
2. **WhatsApp & Notifications**: `whatsapp_number`, `terms_and_conditions`, `management_contact`, and `name` are consumed when formatting notification bodies.
3. **Classes Entitlement**: `has_classes_enabled` controls visibility of Class management routes and dashboard components.
