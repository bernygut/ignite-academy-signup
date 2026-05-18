-- Ceremony invitations: opening/graduation campaigns sent to approved participants.

CREATE TYPE ceremony_type AS ENUM ('inicio', 'graduacion');

CREATE TABLE ceremony_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceremony_type ceremony_type NOT NULL,
  programme_ids UUID[]       NOT NULL DEFAULT '{}',  -- empty = all programmes
  subject       TEXT         NOT NULL,
  body_html     TEXT         NOT NULL,
  cc_emails     TEXT[]       NOT NULL DEFAULT '{}',
  event_date    DATE,
  event_time    TIME,
  location      TEXT,
  sent_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  sent_by       UUID REFERENCES auth.users(id)
);

CREATE TABLE ceremony_invitation_recipients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL REFERENCES ceremony_invitations(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  programme_name  TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  error_message   TEXT
);

CREATE INDEX idx_ceremony_recipients_invitation_id
  ON ceremony_invitation_recipients(invitation_id);

ALTER TABLE ceremony_invitations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceremony_invitation_recipients  ENABLE ROW LEVEL SECURITY;

-- Admins read and insert; no update/delete (immutable history)
CREATE POLICY "admin_read_invitations"   ON ceremony_invitations
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "admin_insert_invitations" ON ceremony_invitations
  FOR INSERT WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "admin_read_recipients"    ON ceremony_invitation_recipients
  FOR SELECT USING (current_user_role() = 'admin');
CREATE POLICY "admin_insert_recipients"  ON ceremony_invitation_recipients
  FOR INSERT WITH CHECK (current_user_role() = 'admin');
-- The Edge Function (service role) updates delivery_status after Resend responds.
