-- ================================================================
-- 002_attendance.sql
-- Run in Supabase SQL editor or via: supabase db push
-- ================================================================

-- ----------------------------------------------------------------
-- ROLE SYSTEM
-- ----------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'instructor');

CREATE TABLE profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role       user_role NOT NULL DEFAULT 'admin',
    full_name  TEXT,
    email      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SECURITY DEFINER function to read caller's role without triggering
-- recursive RLS evaluation on the profiles table itself.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

-- Auto-create a profiles row (role = admin by default) for every new auth user.
-- The create-instructor Edge Function immediately updates role to 'instructor'
-- for invited instructors, using the service role key (bypasses RLS).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, email)
    VALUES (NEW.id, 'admin', NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users as admins
INSERT INTO profiles (id, role, email)
SELECT id, 'admin', email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- LESSONS
-- ----------------------------------------------------------------
CREATE TABLE lessons (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id  UUID NOT NULL REFERENCES programmes(id),
    lesson_number SMALLINT NOT NULL CHECK (lesson_number BETWEEN 1 AND 10),
    lesson_date   DATE NOT NULL,
    UNIQUE (programme_id, lesson_number)
);

-- ----------------------------------------------------------------
-- ATTENDANCE
-- ----------------------------------------------------------------
CREATE TABLE attendance (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id      UUID NOT NULL REFERENCES lessons(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    present        BOOLEAN NOT NULL DEFAULT false,
    recorded_by    UUID REFERENCES auth.users(id),
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lesson_id, application_id)
);

CREATE INDEX idx_attendance_lesson_id      ON attendance(lesson_id);
CREATE INDEX idx_attendance_application_id ON attendance(application_id);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- PROFILES: each user can read their own row
CREATE POLICY "profiles_read_own"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- PROFILES: admins can read all rows
CREATE POLICY "admin_read_all_profiles"
    ON profiles FOR SELECT
    USING (public.current_user_role() = 'admin');

-- PROFILES: admins can update any row (role assignment)
CREATE POLICY "admin_update_profiles"
    ON profiles FOR UPDATE
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');

-- LESSONS: any authenticated user can read
CREATE POLICY "auth_read_lessons"
    ON lessons FOR SELECT
    USING (auth.role() = 'authenticated');

-- ATTENDANCE: any authenticated user can read
CREATE POLICY "auth_read_attendance"
    ON attendance FOR SELECT
    USING (auth.role() = 'authenticated');

-- ATTENDANCE: admins and instructors can insert
CREATE POLICY "auth_insert_attendance"
    ON attendance FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        public.current_user_role() IN ('admin', 'instructor')
    );

-- ATTENDANCE: admins and instructors can update
CREATE POLICY "auth_update_attendance"
    ON attendance FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        public.current_user_role() IN ('admin', 'instructor')
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND
        public.current_user_role() IN ('admin', 'instructor')
    );

-- ----------------------------------------------------------------
-- GRANTS
-- ----------------------------------------------------------------
GRANT SELECT          ON public.profiles   TO authenticated;
GRANT UPDATE          ON public.profiles   TO authenticated;  -- row access controlled by RLS
GRANT SELECT          ON public.lessons    TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;

-- ----------------------------------------------------------------
-- SEED: 10 lessons × 3 programmes
-- Dates: May 23, 30 · Jun 6, 13, 20, 27 · Jul 4, 11, 18 · Aug 1
-- (Jul 25 is a holiday — skipped)
-- ----------------------------------------------------------------
INSERT INTO lessons (programme_id, lesson_number, lesson_date) VALUES
    -- AI-900 (a0000000-0000-0000-0000-000000000001)
    ('a0000000-0000-0000-0000-000000000001',  1, '2026-05-23'),
    ('a0000000-0000-0000-0000-000000000001',  2, '2026-05-30'),
    ('a0000000-0000-0000-0000-000000000001',  3, '2026-06-06'),
    ('a0000000-0000-0000-0000-000000000001',  4, '2026-06-13'),
    ('a0000000-0000-0000-0000-000000000001',  5, '2026-06-20'),
    ('a0000000-0000-0000-0000-000000000001',  6, '2026-06-27'),
    ('a0000000-0000-0000-0000-000000000001',  7, '2026-07-04'),
    ('a0000000-0000-0000-0000-000000000001',  8, '2026-07-11'),
    ('a0000000-0000-0000-0000-000000000001',  9, '2026-07-18'),
    ('a0000000-0000-0000-0000-000000000001', 10, '2026-08-01'),
    -- AZ-900 (a0000000-0000-0000-0000-000000000002)
    ('a0000000-0000-0000-0000-000000000002',  1, '2026-05-23'),
    ('a0000000-0000-0000-0000-000000000002',  2, '2026-05-30'),
    ('a0000000-0000-0000-0000-000000000002',  3, '2026-06-06'),
    ('a0000000-0000-0000-0000-000000000002',  4, '2026-06-13'),
    ('a0000000-0000-0000-0000-000000000002',  5, '2026-06-20'),
    ('a0000000-0000-0000-0000-000000000002',  6, '2026-06-27'),
    ('a0000000-0000-0000-0000-000000000002',  7, '2026-07-04'),
    ('a0000000-0000-0000-0000-000000000002',  8, '2026-07-11'),
    ('a0000000-0000-0000-0000-000000000002',  9, '2026-07-18'),
    ('a0000000-0000-0000-0000-000000000002', 10, '2026-08-01'),
    -- SC-900 (a0000000-0000-0000-0000-000000000003)
    ('a0000000-0000-0000-0000-000000000003',  1, '2026-05-23'),
    ('a0000000-0000-0000-0000-000000000003',  2, '2026-05-30'),
    ('a0000000-0000-0000-0000-000000000003',  3, '2026-06-06'),
    ('a0000000-0000-0000-0000-000000000003',  4, '2026-06-13'),
    ('a0000000-0000-0000-0000-000000000003',  5, '2026-06-20'),
    ('a0000000-0000-0000-0000-000000000003',  6, '2026-06-27'),
    ('a0000000-0000-0000-0000-000000000003',  7, '2026-07-04'),
    ('a0000000-0000-0000-0000-000000000003',  8, '2026-07-11'),
    ('a0000000-0000-0000-0000-000000000003',  9, '2026-07-18'),
    ('a0000000-0000-0000-0000-000000000003', 10, '2026-08-01');
