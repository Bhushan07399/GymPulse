const { pool } = require('./pool');
const { logger } = require('../config/logger');

const ensureSchema = async () => {
  try {
    // 1. Add missing columns to members table if not exists
    await pool.query(`
      ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;
      ALTER TABLE members ADD COLUMN IF NOT EXISTS left_date DATE NULL;
      ALTER TABLE members ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;
    `);

    // 2. Drop global member_id unique index and replace with tenant-scoped unique index UNIQUE(gym_id, member_id)
    await pool.query(`
      DROP INDEX IF EXISTS idx_members_member_id;
      ALTER TABLE members DROP CONSTRAINT IF EXISTS uq_members_member_id;
      ALTER TABLE members DROP CONSTRAINT IF EXISTS members_member_id_key;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_members_gym_member_id ON members (gym_id, member_id);
    `);

    // 3. Add missing columns to gyms table if not exists & drop global email constraints for multi-gym support
    await pool.query(`
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) NOT NULL DEFAULT 'Growth';
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS subscription_start_date DATE NOT NULL DEFAULT CURRENT_DATE;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS subscription_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year');
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS is_multi_gym BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS max_locations INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly';
      UPDATE gyms SET is_multi_gym = TRUE, max_locations = 5, subscription_plan = 'Growth' WHERE LOWER(subscription_plan) LIKE '%multi%';
      ALTER TABLE gyms DROP CONSTRAINT IF EXISTS gyms_email_key;
      ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_email_key;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_gym_email ON staff (gym_id, LOWER(email));
    `);

    // 4. Add outstanding payment columns to payments table & backfill paid_amount
    await pool.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
      UPDATE payments SET paid_amount = total_amount, remaining_amount = 0 WHERE (paid_amount IS NULL OR paid_amount = 0) AND payment_status = 'Paid' AND total_amount > 0;
    `);

    // 5. Create gym_settings table if not exists & add has_classes_enabled column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gym_settings (
        gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
        date_format VARCHAR(20) NOT NULL DEFAULT 'DD MMM YYYY',
        time_format VARCHAR(10) NOT NULL DEFAULT '12',
        default_membership_duration INTEGER NOT NULL DEFAULT 30,
        default_payment_method VARCHAR(30) NOT NULL DEFAULT 'Cash',
        auto_generate_member_id BOOLEAN NOT NULL DEFAULT TRUE,
        renewal_reminder BOOLEAN NOT NULL DEFAULT TRUE,
        expiry_reminder BOOLEAN NOT NULL DEFAULT TRUE,
        payment_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
        attendance_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
        has_classes_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS has_classes_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    // 6. Create whatsapp_settings table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        phone_number_id VARCHAR(255) NULL,
        business_account_id VARCHAR(255) NULL,
        welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        birthday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Create whatsapp_logs table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NULL,
        automation_type VARCHAR(50) NOT NULL,
        phone_number VARCHAR(30) NOT NULL,
        template_name VARCHAR(100) NOT NULL,
        provider_message_id VARCHAR(255) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'SENT',
        error_message TEXT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Create body_measurements table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS body_measurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
        weight NUMERIC(5, 2) NULL,
        height NUMERIC(5, 2) NULL,
        chest NUMERIC(5, 2) NULL,
        waist NUMERIC(5, 2) NULL,
        hips NUMERIC(5, 2) NULL,
        biceps NUMERIC(5, 2) NULL,
        thighs NUMERIC(5, 2) NULL,
        body_fat_percentage NUMERIC(4, 2) NULL,
        muscle_mass NUMERIC(5, 2) NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
      CREATE INDEX IF NOT EXISTS idx_body_measurements_member ON body_measurements (gym_id, member_id, measurement_date DESC) WHERE deleted_at IS NULL;
    `);

    // 9. Create fitness_goals table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fitness_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        goal_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        target_value NUMERIC(10, 2) NOT NULL,
        starting_value NUMERIC(10, 2) NOT NULL,
        current_value NUMERIC(10, 2) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'kg',
        target_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
      CREATE INDEX IF NOT EXISTS idx_fitness_goals_member ON fitness_goals (gym_id, member_id, status) WHERE deleted_at IS NULL;
    `);

    // 10. Add read_at column to notifications if not exists & drop restrictive type constraint
    await pool.query(`
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;
      ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;
    `);

    // 11. Create Classes module tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT NULL,
        instructor_name VARCHAR(100) NULL,
        capacity INTEGER NOT NULL DEFAULT 20,
        monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        drop_in_price NUMERIC(10, 2) DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
      CREATE INDEX IF NOT EXISTS idx_classes_gym ON classes (gym_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS class_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON class_schedules (gym_id, class_id);

      CREATE TABLE IF NOT EXISTS class_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 20,
        status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions (gym_id, class_id, session_date);

      CREATE TABLE IF NOT EXISTS class_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'Booked',
        booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        cancelled_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_class_bookings_session_member ON class_bookings (gym_id, session_id, member_id) WHERE status != 'Cancelled';
      CREATE INDEX IF NOT EXISTS idx_class_bookings_member ON class_bookings (gym_id, member_id);

      CREATE TABLE IF NOT EXISTS class_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'Attended',
        marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (gym_id, session_id, member_id)
      );
      CREATE INDEX IF NOT EXISTS idx_class_attendance_session ON class_attendance (gym_id, session_id);
    `);

    // 12. Create Class Plans, Class Memberships, and Class Payments tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        billing_period VARCHAR(20) NOT NULL DEFAULT 'Monthly',
        session_limit INTEGER NULL,
        is_unlimited BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
      CREATE INDEX IF NOT EXISTS idx_class_plans_gym ON class_plans (gym_id, class_id) WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS class_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        class_plan_id UUID NOT NULL REFERENCES class_plans(id) ON DELETE CASCADE,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expiry_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        sessions_allowed INTEGER NULL,
        sessions_used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_class_memberships_member ON class_memberships (gym_id, member_id, status);

      CREATE TABLE IF NOT EXISTS class_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        class_plan_id UUID NULL REFERENCES class_plans(id) ON DELETE SET NULL,
        class_membership_id UUID NULL REFERENCES class_memberships(id) ON DELETE SET NULL,
        total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'Paid',
        receipt_number VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_class_payments_gym ON class_payments (gym_id, payment_date);
      CREATE INDEX IF NOT EXISTS idx_class_payments_member ON class_payments (gym_id, member_id);
    `);

    // 13. Add allowed_class_ids and allowed_categories to class_plans
    await pool.query(`
      ALTER TABLE class_plans ADD COLUMN IF NOT EXISTS allowed_class_ids UUID[] NULL;
      ALTER TABLE class_plans ADD COLUMN IF NOT EXISTS allowed_categories TEXT[] NULL;
    `);

    // 14. Add checkout_at to class_attendance
    await pool.query(`
      ALTER TABLE class_attendance ADD COLUMN IF NOT EXISTS checkout_at TIMESTAMPTZ NULL;
    `);

    // 15. Add Gym Branding and FitBhuz link columns to gyms and gym_settings
    await pool.query(`
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30) NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS management_contact TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS fitbhuz_playstore_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS fitbhuz_ios_url TEXT NULL;

      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30) NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS management_contact TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS fitbhuz_playstore_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS fitbhuz_ios_url TEXT NULL;
    `);

    // 16. Add tracking columns to members table
    await pool.query(`
      ALTER TABLE members ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE members ADD COLUMN IF NOT EXISTS fitbhuz_intro_sent BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE members ADD COLUMN IF NOT EXISTS bmi_required BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 17. Create automation_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automation_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        template_body TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(gym_id, event_type)
      );
      CREATE INDEX IF NOT EXISTS idx_automation_settings_gym ON automation_settings (gym_id, event_type);
    `);

    // 18. Create member_class_schedules table for member specific schedule slot assignments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_class_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        class_membership_id UUID NULL REFERENCES class_memberships(id) ON DELETE CASCADE,
        schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(gym_id, member_id, schedule_id)
      );
      CREATE INDEX IF NOT EXISTS idx_member_class_schedules_member ON member_class_schedules (gym_id, member_id);
    `);

    // 19. Create member_bmi_assessments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_bmi_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        assessment_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
        price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
        payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
        appointment_date DATE NOT NULL,
        appointment_time TIME NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
        height NUMERIC(5, 2) NULL,
        weight NUMERIC(5, 2) NULL,
        bmi_score NUMERIC(5, 2) NULL,
        report_url TEXT NULL,
        notes TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_bmi_assessments_gym_member ON member_bmi_assessments (gym_id, member_id, appointment_date);
    `);

    // 20. Create manual_broadcasts and manual_broadcast_recipients tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manual_broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        media_url TEXT NULL,
        audience_type VARCHAR(50) NOT NULL,
        audience_filter JSONB NULL,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_manual_broadcasts_gym ON manual_broadcasts (gym_id, sent_at DESC);

      CREATE TABLE IF NOT EXISTS manual_broadcast_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        broadcast_id UUID NOT NULL REFERENCES manual_broadcasts(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'SENT',
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_broadcast_recipients ON manual_broadcast_recipients (gym_id, broadcast_id);
    `);

    // 21. Add expanded Gym Settings and Profile columns
    await pool.query(`
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS description TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS google_maps_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS website_url TEXT NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255) NULL;
      ALTER TABLE gyms ADD COLUMN IF NOT EXISTS privacy_policy TEXT NULL;

      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS description TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS website_url TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255) NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS privacy_policy TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS operating_hours JSONB NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS receipt_header TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS receipt_footer TEXT NULL;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS show_gym_logo BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS show_gst BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS show_address BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS show_contact_number BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    logger.info('Database schema migration check completed successfully.');
  } catch (err) {
    logger.error({ err }, 'Error running schema migration check');
  }
};

module.exports = { ensureSchema };

