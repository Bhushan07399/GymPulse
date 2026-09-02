BEGIN;
CREATE TABLE IF NOT EXISTS gym_settings (
  gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR', timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  date_format VARCHAR(30) NOT NULL DEFAULT 'DD MMM YYYY', time_format VARCHAR(2) NOT NULL DEFAULT '12',
  default_membership_duration INTEGER NOT NULL DEFAULT 30, default_payment_method VARCHAR(30) NOT NULL DEFAULT 'Cash', auto_generate_member_id BOOLEAN NOT NULL DEFAULT TRUE,
  favicon_url TEXT NULL, receipt_header TEXT NULL, receipt_footer TEXT NULL, show_gym_logo BOOLEAN NOT NULL DEFAULT TRUE, show_gst BOOLEAN NOT NULL DEFAULT TRUE, show_address BOOLEAN NOT NULL DEFAULT TRUE, show_contact_number BOOLEAN NOT NULL DEFAULT TRUE,
  renewal_reminder BOOLEAN NOT NULL DEFAULT FALSE, expiry_reminder BOOLEAN NOT NULL DEFAULT FALSE, payment_confirmation BOOLEAN NOT NULL DEFAULT FALSE, attendance_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (default_membership_duration > 0), CHECK (time_format IN ('12','24'))
);
COMMIT;
