-- ================================================================
-- 001_initial_schema.sql
-- Run this in the Supabase SQL editor or via: supabase db push
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- PROGRAMMES
-- Seeded manually by admin; not user-created via the public form
-- ----------------------------------------------------------------
CREATE TABLE programmes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    cohort        TEXT,                         -- e.g. "Cohort 7 – Apr 2026"
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    starts_at     DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- APPLICATIONS
-- ----------------------------------------------------------------
CREATE TYPE application_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'waitlisted'
);

CREATE TABLE applications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Personal
    full_name        TEXT NOT NULL,
    email            TEXT NOT NULL,
    phone            TEXT,
    age              SMALLINT CHECK (age > 0 AND age < 120),
    gender           TEXT,
    country          TEXT,

    -- NGO / caseworker context
    ngo_name         TEXT,
    caseworker_name  TEXT,
    beneficiary_id   TEXT,

    -- Programme
    programme_id     UUID NOT NULL REFERENCES programmes(id),

    -- Workflow
    status           application_status NOT NULL DEFAULT 'pending',
    admin_notes      TEXT,
    reviewed_by      UUID REFERENCES auth.users(id),
    reviewed_at      TIMESTAMPTZ,

    -- Audit
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------
-- Indexes for common admin filter queries
-- ----------------------------------------------------------------
CREATE INDEX idx_applications_status        ON applications(status);
CREATE INDEX idx_applications_programme_id  ON applications(programme_id);
CREATE INDEX idx_applications_submitted_at  ON applications(submitted_at DESC);
CREATE INDEX idx_applications_email         ON applications(email);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE programmes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- PROGRAMMES: anyone can read active ones (feeds the public form dropdown)
CREATE POLICY "public_read_active_programmes"
    ON programmes FOR SELECT
    USING (is_active = true);

-- PROGRAMMES: only authenticated admins can manage
CREATE POLICY "admin_manage_programmes"
    ON programmes FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- APPLICATIONS: anonymous users can INSERT (submit form) but not read
CREATE POLICY "public_submit_application"
    ON applications FOR INSERT
    TO anon
    WITH CHECK (true);

-- APPLICATIONS: authenticated admins can read all
CREATE POLICY "admin_read_all_applications"
    ON applications FOR SELECT
    USING (auth.role() = 'authenticated');

-- APPLICATIONS: authenticated admins can update (status, notes, reviewed_by)
CREATE POLICY "admin_update_application"
    ON applications FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- No DELETE policy intentionally — hard deletes go through a migration

-- ----------------------------------------------------------------
-- SEED: example programmes (edit before going live)
-- ----------------------------------------------------------------
INSERT INTO programmes (name, cohort, description, is_active, starts_at) VALUES
  ('Digital Skills Bootcamp', 'Cohort 1 – June 2026', 'An intensive 8-week programme covering digital literacy, spreadsheets, and internet safety.', true, '2026-06-02'),
  ('Entrepreneurship Fundamentals', 'Cohort 1 – July 2026', 'A 6-week course exploring business ideation, budgeting, and market research.', true, '2026-07-07'),
  ('English for the Workplace', 'Cohort 2 – June 2026', 'Communication skills for professional environments.', true, '2026-06-09');
