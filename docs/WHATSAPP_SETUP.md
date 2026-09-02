# GymPulse — Meta WhatsApp Cloud API Setup Guide

This guide details the step-by-step production setup for connecting **Meta WhatsApp Cloud API** with GymPulse.

---

## 1. Required Credentials & Environment Variables

Configure the following variables in `apps/api/.env`:

```env
# Meta WhatsApp Cloud API Production Credentials
META_WHATSAPP_ACCESS_TOKEN=EAAG... (Permanent System User Token)
META_WHATSAPP_PHONE_NUMBER_ID=10065... (WhatsApp Business Phone Number ID)
META_WHATSAPP_BUSINESS_ACCOUNT_ID=10928... (WhatsApp Business Account ID)
```

Alternatively, gym owners can configure their specific `phone_number_id` and `business_account_id` in the **Gym Management Dashboard** under **WhatsApp Settings** (`/dashboard/whatsapp`).

---

## 2. Meta Developer Portal Setup

1. **Create Meta Business App**:
   - Go to [Meta for Developers](https://developers.facebook.com/).
   - Click **My Apps** -> **Create App**.
   - Select **Other** -> **Business** app type.
   - Name your app `GymPulse WhatsApp Communication`.

2. **Add WhatsApp Product**:
   - In the App Dashboard, locate **WhatsApp** and click **Set Up**.
   - Link your **Meta Business Account**.

3. **Configure Phone Number**:
   - Go to **WhatsApp** -> **API Setup**.
   - Add your business phone number and verify via OTP.
   - Copy the **Phone Number ID** into `META_WHATSAPP_PHONE_NUMBER_ID`.

4. **Generate Permanent Access Token**:
   - Go to **Business Settings** -> **System Users**.
   - Create a System User with role **Admin**.
   - Assign the WhatsApp app asset to the System User with `whatsapp_business_messaging` permission.
   - Click **Generate Token** and copy it into `META_WHATSAPP_ACCESS_TOKEN`.

---

## 3. Approved Template Mapping

Meta requires business-initiated messages to use pre-approved Message Templates. Create the following templates in Meta WhatsApp Manager:

| GymPulse Event | Meta Template Name | Required Variables |
|---|---|---|
| `MEMBER_CREATED` | `gympulse_welcome_member` | `{{1}}` Member Name, `{{2}}` Gym Name, `{{3}}` Member ID |
| `MEMBERSHIP_CREATED` | `gympulse_membership_created` | `{{1}}` Member Name, `{{2}}` Plan Name, `{{3}}` Expiry Date |
| `PAYMENT_RECEIPT` | `gympulse_payment_receipt` | `{{1}}` Member Name, `{{2}}` Amount, `{{3}}` Payment Method, `{{4}}` Gym Name |
| `FITBHUZ_INTRO` | `gympulse_fitbhuz_intro` | `{{1}}` Member ID |
| `CLASS_ASSIGNED` | `gympulse_class_assigned` | `{{1}}` Member Name, `{{2}}` Class Name, `{{3}}` Schedule |
| `CLASS_REMINDER` | `gympulse_class_reminder` | `{{1}}` Member Name, `{{2}}` Class Name, `{{3}}` Schedule |
| `RENEWAL_REMINDER` | `gympulse_renewal_reminder` | `{{1}}` Member Name, `{{2}}` Expiry Date, `{{3}}` Gym Name |
| `BIRTHDAY_WISHES` | `gympulse_birthday_wishes` | `{{1}}` Member Name, `{{2}}` Gym Name |
| `BMI_APPOINTMENT` | `gympulse_bmi_appointment` | `{{1}}` Member Name, `{{2}}` Date, `{{3}}` Assessment Type |

---

## 4. Production Webhook Setup (Optional Status Tracking)

To receive real-time delivery status updates (`DELIVERED`, `READ`, `FAILED`) from WhatsApp:
1. In Meta App Dashboard, go to **WhatsApp** -> **Configuration**.
2. Set Webhook Callback URL to `https://your-api-domain.com/api/v1/whatsapp/webhook`.
3. Set Verify Token to match your configured webhook secret.
4. Subscribe to `messages` webhook field.
