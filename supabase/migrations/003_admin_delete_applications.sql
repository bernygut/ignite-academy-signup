-- Allow admins to hard-delete applications
CREATE POLICY "admin_delete_application"
  ON applications FOR DELETE
  USING (current_user_role() = 'admin');
