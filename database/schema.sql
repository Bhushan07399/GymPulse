CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    gst_number VARCHAR(50) NULL,
    logo_url TEXT NULL,
    subscription_plan VARCHAR(50) NOT NULL,
    subscription_start_date DATE NOT NULL,
    subscription_end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_gyms_subscription_dates
        CHECK (subscription_end_date >= subscription_start_date)
);

CREATE INDEX idx_gyms_email ON gyms (email);
CREATE INDEX idx_gyms_is_active ON gyms (is_active);
CREATE INDEX idx_gyms_subscription_plan ON gyms (subscription_plan);
CREATE INDEX idx_gyms_created_at ON gyms (created_at DESC);
CREATE INDEX idx_gyms_deleted_at ON gyms (deleted_at);
CREATE INDEX idx_gyms_active_not_deleted
    ON gyms (is_active, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_staff_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_staff_role
        CHECK (role IN ('Owner', 'Receptionist', 'Trainer'))
);

CREATE INDEX idx_staff_gym_id ON staff (gym_id);
CREATE INDEX idx_staff_email ON staff (email);
CREATE INDEX idx_staff_role ON staff (role);
CREATE INDEX idx_staff_is_active ON staff (is_active);
CREATE INDEX idx_staff_deleted_at ON staff (deleted_at);
CREATE INDEX idx_staff_active_not_deleted
    ON staff (gym_id, is_active, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    duration_in_days INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_membership_plans_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_membership_plans_duration_positive
        CHECK (duration_in_days > 0),
    CONSTRAINT chk_membership_plans_price_non_negative
        CHECK (price >= 0)
);

CREATE INDEX idx_membership_plans_gym_id ON membership_plans (gym_id);
CREATE INDEX idx_membership_plans_is_active ON membership_plans (is_active);
CREATE INDEX idx_membership_plans_price ON membership_plans (price);
CREATE INDEX idx_membership_plans_deleted_at ON membership_plans (deleted_at);
CREATE INDEX idx_membership_plans_active_not_deleted
    ON membership_plans (gym_id, is_active, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    membership_plan_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(30) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    emergency_contact VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    join_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    qr_code VARCHAR(255) NOT NULL,
    profile_photo_url TEXT NULL,
    medical_notes TEXT NULL,
    password_hash TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_members_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_members_membership_plan
        FOREIGN KEY (membership_plan_id)
        REFERENCES membership_plans (id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_members_gender
        CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    CONSTRAINT chk_members_dates
        CHECK (expiry_date >= join_date),
    CONSTRAINT chk_members_date_of_birth
        CHECK (date_of_birth <= join_date),
    CONSTRAINT chk_members_email_format
        CHECK (email LIKE '%_@_%._%'),
    CONSTRAINT uq_members_gym_qr_code
        UNIQUE (gym_id, qr_code)
);

CREATE INDEX idx_members_gym_id ON members (gym_id);
CREATE INDEX idx_members_membership_plan_id ON members (membership_plan_id);
CREATE INDEX idx_members_email ON members (email);
CREATE INDEX idx_members_phone ON members (phone);
CREATE INDEX idx_members_expiry_date ON members (expiry_date);
CREATE INDEX idx_members_deleted_at ON members (deleted_at);
CREATE INDEX idx_members_active_not_deleted
    ON members (gym_id, is_active, expiry_date)
    WHERE deleted_at IS NULL;

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ NULL,
    attendance_date DATE NOT NULL,
    attendance_method VARCHAR(20) NOT NULL,
    marked_by_staff_id UUID NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_attendance_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_attendance_member
        FOREIGN KEY (member_id)
        REFERENCES members (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_attendance_marked_by_staff
        FOREIGN KEY (marked_by_staff_id)
        REFERENCES staff (id)
        ON DELETE SET NULL,
    CONSTRAINT chk_attendance_checkout_after_checkin
        CHECK (check_out_time IS NULL OR check_out_time >= check_in_time),
    CONSTRAINT chk_attendance_method
        CHECK (attendance_method IN ('QR', 'Manual'))
);

CREATE UNIQUE INDEX uq_attendance_member_date_active
    ON attendance (member_id, attendance_date)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_gym_date ON attendance (gym_id, attendance_date DESC);
CREATE INDEX idx_attendance_member_id ON attendance (member_id);
CREATE INDEX idx_attendance_marked_by_staff_id ON attendance (marked_by_staff_id);
CREATE INDEX idx_attendance_deleted_at ON attendance (deleted_at);
CREATE INDEX idx_attendance_active_not_deleted
    ON attendance (gym_id, attendance_date DESC, check_in_time DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NOT NULL,
    membership_plan_id UUID NOT NULL,
    payment_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(255) NULL,
    payment_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    collected_by_staff_id UUID NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_payments_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_payments_member
        FOREIGN KEY (member_id)
        REFERENCES members (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_payments_membership_plan
        FOREIGN KEY (membership_plan_id)
        REFERENCES membership_plans (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_payments_collected_by_staff
        FOREIGN KEY (collected_by_staff_id)
        REFERENCES staff (id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amounts_non_negative
        CHECK (
            payment_amount >= 0
            AND discount_amount >= 0
            AND tax_amount >= 0
            AND total_amount >= 0
        ),
    CONSTRAINT chk_payments_total_amount
        CHECK (total_amount = payment_amount - discount_amount + tax_amount),
    CONSTRAINT chk_payments_payment_method
        CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank Transfer')),
    CONSTRAINT chk_payments_payment_status
        CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    CONSTRAINT chk_payments_due_date
        CHECK (next_due_date >= payment_date)
);

CREATE UNIQUE INDEX uq_payments_gym_transaction_reference_active
    ON payments (gym_id, transaction_reference)
    WHERE transaction_reference IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_payments_gym_date ON payments (gym_id, payment_date DESC);
CREATE INDEX idx_payments_member_id ON payments (member_id);
CREATE INDEX idx_payments_membership_plan_id ON payments (membership_plan_id);
CREATE INDEX idx_payments_collected_by_staff_id ON payments (collected_by_staff_id);
CREATE INDEX idx_payments_status ON payments (payment_status);
CREATE INDEX idx_payments_deleted_at ON payments (deleted_at);
CREATE INDEX idx_payments_active_not_deleted
    ON payments (gym_id, payment_status, payment_date DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NULL,
    staff_id UUID NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL,
    delivery_channel VARCHAR(20) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL,
    scheduled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_notifications_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_member
        FOREIGN KEY (member_id)
        REFERENCES members (id)
        ON DELETE SET NULL,
    CONSTRAINT fk_notifications_staff
        FOREIGN KEY (staff_id)
        REFERENCES staff (id)
        ON DELETE SET NULL,
    CONSTRAINT chk_notifications_type
        CHECK (
            notification_type IN (
                'Membership Expiry',
                'Payment Reminder',
                'Attendance Reminder',
                'Announcement',
                'Promotion'
            )
        ),
    CONSTRAINT chk_notifications_delivery_channel
        CHECK (delivery_channel IN ('In-App', 'Email', 'SMS', 'WhatsApp')),
    CONSTRAINT chk_notifications_schedule_before_sent
        CHECK (scheduled_at IS NULL OR scheduled_at <= sent_at)
);

CREATE INDEX idx_notifications_gym_sent_at
    ON notifications (gym_id, sent_at DESC);
CREATE INDEX idx_notifications_member_inbox
    ON notifications (member_id, is_read, sent_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_staff_inbox
    ON notifications (staff_id, is_read, sent_at DESC)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications (notification_type);
CREATE INDEX idx_notifications_delivery_channel ON notifications (delivery_channel);
CREATE INDEX idx_notifications_scheduled_at
    ON notifications (scheduled_at)
    WHERE scheduled_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_notifications_deleted_at ON notifications (deleted_at);

-- ============================================================================
-- BODY MEASUREMENTS TABLE
-- ============================================================================
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NOT NULL,
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
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_body_measurements_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_body_measurements_member
        FOREIGN KEY (member_id)
        REFERENCES members (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_body_measurements_member ON body_measurements (gym_id, member_id, measurement_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- FITNESS GOALS TABLE
-- ============================================================================
CREATE TABLE fitness_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NOT NULL,
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
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_fitness_goals_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_fitness_goals_member
        FOREIGN KEY (member_id)
        REFERENCES members (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_fitness_goals_member ON fitness_goals (gym_id, member_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- WHATSAPP AUTOMATION SETTINGS TABLE
-- ============================================================================
CREATE TABLE whatsapp_settings (
    gym_id UUID PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number_id VARCHAR(255) NULL,
    business_account_id VARCHAR(255) NULL,
    welcome_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    birthday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_whatsapp_settings_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE
);

-- ============================================================================
-- WHATSAPP DELIVERY LOGS TABLE
-- ============================================================================
CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL,
    member_id UUID NULL,
    automation_type VARCHAR(50) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    provider_message_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT',
    error_message TEXT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_whatsapp_logs_gym
        FOREIGN KEY (gym_id)
        REFERENCES gyms (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_whatsapp_logs_gym ON whatsapp_logs (gym_id, sent_at DESC);
CREATE INDEX idx_whatsapp_logs_member ON whatsapp_logs (gym_id, member_id, automation_type, sent_at);


