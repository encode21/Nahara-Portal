-- Public read for edition feedback (shared rating page + review wall)
-- + allow source = 'share' for dedicated shareable form

ALTER TABLE event_edition_feedback
  DROP CONSTRAINT IF EXISTS event_edition_feedback_source_check;

ALTER TABLE event_edition_feedback
  ADD CONSTRAINT event_edition_feedback_source_check
  CHECK (source IN ('daftar', 'sukses', 'hub', 'share'));

DROP POLICY IF EXISTS "public_insert_event_edition_feedback" ON event_edition_feedback;
CREATE POLICY "public_insert_event_edition_feedback"
  ON event_edition_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND source IN ('daftar', 'sukses', 'hub', 'share')
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

DROP POLICY IF EXISTS "public_select_event_edition_feedback" ON event_edition_feedback;
CREATE POLICY "public_select_event_edition_feedback"
  ON event_edition_feedback FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE event_edition_feedback TO anon;
