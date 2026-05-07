-- ================================================================
-- 005_application_history.sql
-- Field-level audit log for applications.
-- AFTER UPDATE trigger captures diffs of admin-editable fields.
-- ================================================================

CREATE TABLE application_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  field_name       TEXT NOT NULL,
  old_value        TEXT,
  new_value        TEXT
);

CREATE INDEX idx_history_application_id
  ON application_history(application_id, changed_at DESC);

ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_history"
  ON application_history FOR SELECT
  USING (auth.role() = 'authenticated');

GRANT SELECT ON public.application_history TO authenticated;

-- ----------------------------------------------------------------
-- Trigger: log diffs after admin updates
-- SECURITY DEFINER so it can read profiles + programmes for denorm
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_application_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user           UUID := auth.uid();
  v_email          TEXT;
  v_old_programme  TEXT;
  v_new_programme  TEXT;
BEGIN
  SELECT email INTO v_email FROM profiles WHERE id = v_user;

  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'full_name', OLD.full_name, NEW.full_name);
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'email', OLD.email, NEW.email);
  END IF;

  IF NEW.educational_email IS DISTINCT FROM OLD.educational_email THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'educational_email', OLD.educational_email, NEW.educational_email);
  END IF;

  IF NEW.age IS DISTINCT FROM OLD.age THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'age', OLD.age::TEXT, NEW.age::TEXT);
  END IF;

  IF NEW.diversity_group IS DISTINCT FROM OLD.diversity_group THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'diversity_group', OLD.diversity_group, NEW.diversity_group);
  END IF;

  IF NEW.ngo_name IS DISTINCT FROM OLD.ngo_name THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'ngo_name', OLD.ngo_name, NEW.ngo_name);
  END IF;

  IF NEW.programme_id IS DISTINCT FROM OLD.programme_id THEN
    SELECT name INTO v_old_programme FROM programmes WHERE id = OLD.programme_id;
    SELECT name INTO v_new_programme FROM programmes WHERE id = NEW.programme_id;
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'programme', v_old_programme, v_new_programme);
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'status', OLD.status::TEXT, NEW.status::TEXT);
  END IF;

  IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    INSERT INTO application_history (application_id, changed_by, changed_by_email, field_name, old_value, new_value)
    VALUES (NEW.id, v_user, v_email, 'admin_notes', OLD.admin_notes, NEW.admin_notes);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_application_changes
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_application_changes();
