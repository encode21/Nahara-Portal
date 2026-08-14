-- Public edition feedback (rating + masukan) for Agustusan / malam puncak

CREATE TABLE IF NOT EXISTS event_edition_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL,
  display_name text,
  registration_id uuid REFERENCES event_peak_registrations(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'hub'
    CHECK (source IN ('daftar', 'sukses', 'hub')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_edition_feedback_body_len
    CHECK (char_length(trim(body)) BETWEEN 10 AND 2000),
  CONSTRAINT event_edition_feedback_name_len
    CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 2 AND 80)
);

CREATE INDEX IF NOT EXISTS idx_edition_feedback_edition_created
  ON event_edition_feedback (edition_id, created_at DESC);

ALTER TABLE event_edition_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_event_edition_feedback" ON event_edition_feedback;
CREATE POLICY "public_insert_event_edition_feedback"
  ON event_edition_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND source IN ('daftar', 'sukses', 'hub')
    AND char_length(trim(body)) BETWEEN 10 AND 2000
    AND (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 2 AND 80)
    AND EXISTS (SELECT 1 FROM event_editions e WHERE e.id = edition_id)
    AND (
      registration_id IS NULL
      OR EXISTS (
        SELECT 1 FROM event_peak_registrations r
        WHERE r.id = registration_id AND r.edition_id = edition_id
      )
    )
  );

DROP POLICY IF EXISTS "admin_all_event_edition_feedback" ON event_edition_feedback;
CREATE POLICY "admin_all_event_edition_feedback"
  ON event_edition_feedback FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

GRANT INSERT ON TABLE event_edition_feedback TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE event_edition_feedback TO authenticated;
