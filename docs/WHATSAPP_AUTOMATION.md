# GymPulse — WhatsApp Automation Technical Manual

## 1. Executive Architecture

The **WhatsApp Automation System** in GymPulse provides real-time, event-driven member notifications, payment receipts, automated renewal/birthday reminders, and targeted manual broadcasts via the **Meta WhatsApp Cloud API (`v19.0` Graph API)**.

The system is designed to be **completely non-blocking**: any WhatsApp API delivery failure or unconfigured API credential will never block core database operations (Member creation, Payment receipt generation, Class booking, or BMI appointments).

```text
                                  ┌───────────────────────────────┐
                                  │   GymPulse Business Event     │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │    WhatsApp Trigger Engine    │
                                  └──────────────┬────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
    ┌─────────────────────────────┐                             ┌─────────────────────────────┐
    │   Meta WhatsApp Cloud API   │                             │  Unconfigured / Simulated   │
    │      (v19.0 Graph API)      │                             │        Fallback Log         │
    └──────────────┬──────────────┘                             └──────────────┬──────────────┘
                   │                                                           │
                   ▼                                                           ▼
    ┌─────────────────────────────┐                             ┌─────────────────────────────┐
    │   Status: SENT / FAILED     │                             │ Status: SIMULATED_UNCONFIG  │
    └─────────────────────────────┘                             └─────────────────────────────┘
```

---

## 2. Communication Flows & Triggers

### 1. Member Joined (`MEMBER_CREATED`)
- **Trigger**: New member account creation.
- **Content**: Consolidated welcome message containing Gym Name, Member Name, Gym Address, Primary Contact, Instagram, Terms & Conditions, and Management Contact.

### 2. Membership Added (`MEMBERSHIP_CREATED`)
- **Trigger**: New membership plan assigned to a member.
- **Content**: Member Name, Member ID, Membership Plan, Start Date, Expiry Date, Plan Duration, and Contact info.

### 3. Payment Receipt (`PAYMENT_RECEIPT`)
- **Trigger**: Payment recorded in payments ledger.
- **Content**: Official payment receipt containing Receipt Number, Payment Date, Member Name, Member ID, Plan Name, Total Amount, Amount Paid, Outstanding Dues, Payment Method, and Validity Period.

### 4. FitBhuz Special Message (`FITBHUZ_INTRO`)
- **Trigger**: Triggered as a **separate message AFTER Payment Receipt** if `fitbhuz_intro_sent` is `FALSE`.
- **Content**: One-line introduction to the FitBhuz Member App, Google Play Store link, Apple App Store link, and Member ID login instructions. Sets `fitbhuz_intro_sent = TRUE` on the member record.

### 5. Class Assigned (`CLASS_ASSIGNED`)
- **Trigger**: Member assigned to a class schedule.
- **Content**: Class Name, Schedule Slot, Sessions Allowed, Expiry Date, Instructor Name, and Gym Contact. Sent only to the assigned member.

### 6. Automated Background Reminders
- **Renewal Reminders** (`RENEWAL_7D`, `RENEWAL_3D`, `RENEWAL_1D`, `MEMBERSHIP_EXPIRED`): Automated notification background scheduler triggers daily renewal notices.
- **Outstanding Payment Reminders**: Triggered for members with `remaining_amount > 0`.
- **Birthday Wishes**: Triggered automatically on member birthdays.
- **Class Reminders & Schedule Changes**: Triggered when class schedules are modified or prior to class start.
- **BMI Appointment Reminders**: Scheduled reminders for free/paid BMI assessments.

---

## 3. Security, Scoping & Duplicate Prevention

- **Strict Tenant Isolation**: All messages, templates, logs, and broadcasts are filtered by `WHERE gym_id = $1`. Gym A cannot view or send messages to Gym B members.
- **Phone Normalization**: Input phone numbers are normalized to E.164 format (e.g., `919876543210`). Invalid numbers are logged as `FAILED` with `Invalid or missing recipient phone number` without crashing.
- **Daily Duplicate Prevention**: `hasDuplicateWhatsAppSentToday()` prevents sending duplicate daily reminders (`RENEWAL_*`, `BIRTHDAY_WISHES`) to the same member on the same calendar day.

---

## 4. Database Audit Log (`whatsapp_logs`)

All attempted deliveries (successful, failed, or simulated) are recorded in the `whatsapp_logs` table:
- `gym_id`, `member_id`, `automation_type`, `phone_number`, `template_name`, `provider_message_id`, `status` (`SENT`, `FAILED`, `SIMULATED_UNCONFIGURED`), `error_message`, `sent_at`.
