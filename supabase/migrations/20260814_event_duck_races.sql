-- Native Duck Race (Hadiah Utama) — household lottery with immutable snapshot
-- Run after 20260813_event_peak_registration.sql

-- ========== Table ==========

CREATE TABLE IF NOT EXISTS event_duck_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  race_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('ready', 'preparing', 'running', 'finished', 'cancelled')),
  participant_count int NOT NULL CHECK (participant_count >= 0),
  participant_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  winner_household_label text,
  winner_blok_row text,
  winner_nomor_kavling int,
  random_result jsonb,
  exclude_previous_winners boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_duck_races_snapshot_is_array
    CHECK (jsonb_typeof(participant_snapshot) = 'array'),
  CONSTRAINT event_duck_races_race_code_len
    CHECK (char_length(race_code) BETWEEN 6 AND 32)
);

CREATE INDEX IF NOT EXISTS idx_duck_races_edition_created
  ON event_duck_races (edition_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_duck_races_edition_status
  ON event_duck_races (edition_id, status);

-- ========== RLS ==========

ALTER TABLE event_duck_races ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_duck_races" ON event_duck_races;
CREATE POLICY "public_read_duck_races"
  ON event_duck_races FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_all_duck_races" ON event_duck_races;
CREATE POLICY "admin_all_duck_races"
  ON event_duck_races FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

-- ========== Helpers ==========

CREATE OR REPLACE FUNCTION public.eligible_duck_race_households(
  p_edition_id uuid,
  p_exclude_previous_winners boolean DEFAULT false
)
RETURNS TABLE (
  household_label text,
  blok_row text,
  nomor_kavling int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT DISTINCT ON (r.household_label)
      r.household_label,
      r.blok_row,
      r.nomor_kavling
    FROM event_peak_registrations r
    WHERE r.edition_id = p_edition_id
      AND r.status = 'verified'
      AND r.twibbon_url IS NOT NULL
      AND char_length(trim(r.twibbon_url)) > 0
    ORDER BY r.household_label, r.id
  ),
  prior_winners AS (
    SELECT DISTINCT d.winner_household_label AS household_label
    FROM event_duck_races d
    WHERE d.edition_id = p_edition_id
      AND d.status = 'finished'
      AND d.winner_household_label IS NOT NULL
      AND p_exclude_previous_winners
  )
  SELECT e.household_label, e.blok_row, e.nomor_kavling
  FROM eligible e
  WHERE NOT EXISTS (
    SELECT 1 FROM prior_winners p WHERE p.household_label = e.household_label
  )
  ORDER BY e.household_label;
$$;

REVOKE ALL ON FUNCTION public.eligible_duck_race_households(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eligible_duck_race_households(uuid, boolean) TO anon, authenticated;

-- ========== list_duck_race_participants ==========

CREATE OR REPLACE FUNCTION public.list_duck_race_participants(p_edition_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'household_label', h.household_label,
          'blok_row', h.blok_row,
          'nomor_kavling', h.nomor_kavling
        )
        ORDER BY h.household_label
      )
      FROM public.eligible_duck_race_households(p_edition_id, false) h
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.list_duck_race_participants(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_duck_race_participants(uuid) TO anon, authenticated;

-- ========== start_duck_race ==========

CREATE OR REPLACE FUNCTION public.start_duck_race(
  p_edition_id uuid,
  p_exclude_previous_winners boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edition event_editions%ROWTYPE;
  v_snapshot jsonb;
  v_count int;
  v_winner_index int;
  v_winner jsonb;
  v_seq int;
  v_race_code text;
  v_race event_duck_races%ROWTYPE;
  v_entropy uuid;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat memulai Duck Race.';
  END IF;

  SELECT * INTO v_edition FROM event_editions WHERE id = p_edition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edisi tidak ditemukan.';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'household_label', h.household_label,
        'blok_row', h.blok_row,
        'nomor_kavling', h.nomor_kavling
      )
      ORDER BY h.household_label
    ),
    '[]'::jsonb
  )
  INTO v_snapshot
  FROM public.eligible_duck_race_households(p_edition_id, p_exclude_previous_winners) h;

  v_count := jsonb_array_length(v_snapshot);
  IF v_count < 1 THEN
    RAISE EXCEPTION 'Tidak ada rumah eligible untuk Duck Race.';
  END IF;

  -- Uniform index in [0, v_count): entropy from gen_random_uuid, equal weight 1/N
  -- Use 28-bit unsigned slice to avoid signed overflow / negative modulo.
  v_entropy := gen_random_uuid();
  v_winner_index := (
    ('x' || substr(replace(v_entropy::text, '-', ''), 1, 7))::bit(28)::int
    % v_count
  );

  v_winner := v_snapshot -> v_winner_index;

  SELECT COUNT(*)::int + 1 INTO v_seq
  FROM event_duck_races
  WHERE edition_id = p_edition_id;

  v_race_code := 'DR-' || v_edition.year::text || '-' || lpad(v_seq::text, 3, '0');

  INSERT INTO event_duck_races (
    edition_id,
    race_code,
    status,
    participant_count,
    participant_snapshot,
    winner_household_label,
    winner_blok_row,
    winner_nomor_kavling,
    random_result,
    exclude_previous_winners,
    started_at,
    created_by
  ) VALUES (
    p_edition_id,
    v_race_code,
    'running',
    v_count,
    v_snapshot,
    v_winner ->> 'household_label',
    v_winner ->> 'blok_row',
    (v_winner ->> 'nomor_kavling')::int,
    jsonb_build_object(
      'method', 'gen_random_uuid_mod',
      'winner_index', v_winner_index,
      'participant_count', v_count,
      'entropy', v_entropy::text
    ),
    p_exclude_previous_winners,
    now(),
    auth.uid()
  )
  RETURNING * INTO v_race;

  RETURN to_jsonb(v_race);
END;
$$;

REVOKE ALL ON FUNCTION public.start_duck_race(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_duck_race(uuid, boolean) TO authenticated;

-- ========== finish_duck_race ==========

CREATE OR REPLACE FUNCTION public.finish_duck_race(p_race_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_race event_duck_races%ROWTYPE;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menyelesaikan Duck Race.';
  END IF;

  SELECT * INTO v_race
  FROM event_duck_races
  WHERE id = p_race_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Race tidak ditemukan.';
  END IF;

  IF v_race.status = 'finished' THEN
    RETURN to_jsonb(v_race);
  END IF;

  IF v_race.status = 'cancelled' THEN
    RAISE EXCEPTION 'Race sudah dibatalkan.';
  END IF;

  UPDATE event_duck_races
  SET
    status = 'finished',
    finished_at = now()
  WHERE id = p_race_id
  RETURNING * INTO v_race;

  RETURN to_jsonb(v_race);
END;
$$;

REVOKE ALL ON FUNCTION public.finish_duck_race(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_duck_race(uuid) TO authenticated;
