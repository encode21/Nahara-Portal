-- Agustusan annual editions + contests + entries + results

CREATE TABLE IF NOT EXISTS event_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sop_text text,
  starts_on date,
  ends_on date,
  registration_closes_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES donasi_campaign(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  category text NOT NULL
    CHECK (category IN (
      'ibu', 'bapak', 'pasangan', 'dewasa_remaja',
      'keluarga', 'balita', 'preteen', 'art', 'umum'
    )),
  category_note text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  equipment text,
  rules text,
  team_size int NOT NULL DEFAULT 1,
  max_entries int,
  registration_open boolean NOT NULL DEFAULT true,
  is_competition boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_contest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES event_contests(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  partner_name text,
  block_number text,
  phone text,
  notes text,
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'withdrawn')),
  registered_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_contest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES event_contests(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES event_contest_entries(id) ON DELETE SET NULL,
  rank int NOT NULL CHECK (rank BETWEEN 1 AND 3),
  winner_label text NOT NULL,
  prize text,
  published boolean NOT NULL DEFAULT false,
  announced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (contest_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_event_contests_edition ON event_contests(edition_id);
CREATE INDEX IF NOT EXISTS idx_event_contest_entries_contest ON event_contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_event_contest_results_contest ON event_contest_results(contest_id);

ALTER TABLE event_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contest_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_event_editions" ON event_editions;
DROP POLICY IF EXISTS "public_read_event_contests" ON event_contests;
DROP POLICY IF EXISTS "public_read_event_contest_entries" ON event_contest_entries;
DROP POLICY IF EXISTS "public_read_event_contest_results" ON event_contest_results;
DROP POLICY IF EXISTS "public_insert_event_contest_entries" ON event_contest_entries;
DROP POLICY IF EXISTS "admin_all_event_editions" ON event_editions;
DROP POLICY IF EXISTS "admin_all_event_contests" ON event_contests;
DROP POLICY IF EXISTS "admin_all_event_contest_entries" ON event_contest_entries;
DROP POLICY IF EXISTS "admin_all_event_contest_results" ON event_contest_results;

CREATE POLICY "public_read_event_editions"
  ON event_editions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_event_contests"
  ON event_contests FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_event_contest_entries"
  ON event_contest_entries FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_read_event_contest_results"
  ON event_contest_results FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public_insert_event_contest_entries"
  ON event_contest_entries FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'registered'
    AND EXISTS (
      SELECT 1 FROM event_contests c
      WHERE c.id = contest_id
        AND c.registration_open = true
        AND c.is_competition = true
    )
  );

CREATE POLICY "admin_all_event_editions"
  ON event_editions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_event_contests"
  ON event_contests FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_event_contest_entries"
  ON event_contest_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_event_contest_results"
  ON event_contest_results FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
