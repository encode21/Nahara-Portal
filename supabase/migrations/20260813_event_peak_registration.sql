-- Malam Puncak Agustusan: registration, door prize, push subscriptions
-- Run in Supabase SQL Editor after prior Agustusan migrations.

-- ========== Tables ==========

CREATE TABLE IF NOT EXISTS event_peak_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  blok_row text NOT NULL,
  nomor_kavling int NOT NULL CHECK (nomor_kavling > 0),
  household_label text NOT NULL,
  participant_name text NOT NULL,
  participant_role text NOT NULL CHECK (participant_role IN ('suami', 'istri')),
  phone text,
  twibbon_url text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'verified'
    CHECK (status IN ('pending', 'verified', 'cancelled')),
  registration_code text NOT NULL UNIQUE,
  warga_id uuid REFERENCES warga(id) ON DELETE SET NULL,
  verified_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_peak_registrations_name_len
    CHECK (char_length(trim(participant_name)) BETWEEN 2 AND 80),
  CONSTRAINT event_peak_registrations_phone_len
    CHECK (phone IS NULL OR char_length(phone) <= 30),
  CONSTRAINT event_peak_registrations_blok_row_len
    CHECK (char_length(blok_row) BETWEEN 3 AND 20),
  CONSTRAINT event_peak_registrations_household_len
    CHECK (char_length(household_label) BETWEEN 3 AND 40)
);

CREATE INDEX IF NOT EXISTS idx_peak_reg_edition_status
  ON event_peak_registrations (edition_id, status);

CREATE INDEX IF NOT EXISTS idx_peak_reg_household
  ON event_peak_registrations (edition_id, blok_row, nomor_kavling)
  WHERE status IN ('pending', 'verified');

CREATE UNIQUE INDEX IF NOT EXISTS idx_peak_reg_role_unique
  ON event_peak_registrations (edition_id, blok_row, nomor_kavling, participant_role)
  WHERE status IN ('pending', 'verified');

CREATE TABLE IF NOT EXISTS event_door_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  kind text NOT NULL DEFAULT 'door' CHECK (kind IN ('door', 'utama')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_door_prize_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES event_door_prizes(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES event_peak_registrations(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  selected_by uuid,
  UNIQUE (registration_id),
  UNIQUE (prize_id, registration_id)
);

CREATE INDEX IF NOT EXISTS idx_door_winners_edition
  ON event_door_prize_winners (edition_id, selected_at DESC);

CREATE TABLE IF NOT EXISTS event_peak_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES event_peak_registrations(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peak_push_reg
  ON event_peak_push_subscriptions (registration_id);

-- ========== RLS ==========

ALTER TABLE event_peak_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_door_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_door_prize_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_peak_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_peak_registrations" ON event_peak_registrations;
CREATE POLICY "public_read_peak_registrations"
  ON event_peak_registrations FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_all_peak_registrations" ON event_peak_registrations;
CREATE POLICY "admin_all_peak_registrations"
  ON event_peak_registrations FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "public_read_door_prizes" ON event_door_prizes;
CREATE POLICY "public_read_door_prizes"
  ON event_door_prizes FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_door_prizes" ON event_door_prizes;
CREATE POLICY "admin_all_door_prizes"
  ON event_door_prizes FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "public_read_door_winners" ON event_door_prize_winners;
CREATE POLICY "public_read_door_winners"
  ON event_door_prize_winners FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_all_door_winners" ON event_door_prize_winners;
CREATE POLICY "admin_all_door_winners"
  ON event_door_prize_winners FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

-- No direct public insert on push; use RPC only
DROP POLICY IF EXISTS "admin_all_peak_push" ON event_peak_push_subscriptions;
CREATE POLICY "admin_all_peak_push"
  ON event_peak_push_subscriptions FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

DROP POLICY IF EXISTS "public_read_own_peak_push" ON event_peak_push_subscriptions;
CREATE POLICY "public_read_own_peak_push"
  ON event_peak_push_subscriptions FOR SELECT TO anon, authenticated
  USING (false);

-- ========== Helpers ==========

CREATE OR REPLACE FUNCTION public.is_peak_blok_row(p_blok_row text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_blok_row IN (
    'NHB-1','NHB-2','NHB-3','NHB-6','NHB-7','NHB-8',
    'NHT-1','NHT-2','NHT-3','NHT-6','NHT-7','NHT-8'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_peak_registration_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  n int := 0;
BEGIN
  LOOP
    candidate := 'NP26-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM event_peak_registrations WHERE registration_code = candidate
    );
    n := n + 1;
    IF n > 20 THEN
      RAISE EXCEPTION 'Gagal membuat kode pendaftaran. Coba lagi.';
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- ========== register_peak_participant ==========

CREATE OR REPLACE FUNCTION public.register_peak_participant(
  p_edition_id uuid,
  p_blok_row text,
  p_nomor_kavling int,
  p_participant_name text,
  p_participant_role text,
  p_phone text,
  p_twibbon_url text,
  p_warga_id uuid DEFAULT NULL
)
RETURNS event_peak_registrations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edition event_editions%ROWTYPE;
  v_name text;
  v_role text;
  v_phone text;
  v_url text;
  v_label text;
  v_count int;
  v_row event_peak_registrations%ROWTYPE;
  v_lock_key bigint;
BEGIN
  SELECT * INTO v_edition FROM event_editions WHERE id = p_edition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edisi acara tidak ditemukan.';
  END IF;
  IF v_edition.status = 'archived' THEN
    RAISE EXCEPTION 'Pendaftaran untuk edisi ini sudah ditutup.';
  END IF;

  IF NOT public.is_peak_blok_row(p_blok_row) THEN
    RAISE EXCEPTION 'Blok tidak valid. Pilih blok NHT/NHB 1–3 atau 6–8.';
  END IF;

  IF p_nomor_kavling IS NULL OR p_nomor_kavling < 1 THEN
    RAISE EXCEPTION 'Nomor rumah tidak valid.';
  END IF;

  v_role := lower(trim(p_participant_role));
  IF v_role NOT IN ('suami', 'istri') THEN
    RAISE EXCEPTION 'Peran peserta harus suami atau istri.';
  END IF;

  v_name := trim(p_participant_name);
  IF char_length(v_name) < 2 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'Nama peserta harus 2–80 karakter.';
  END IF;

  v_phone := NULLIF(trim(COALESCE(p_phone, '')), '');
  IF v_phone IS NOT NULL AND char_length(v_phone) > 30 THEN
    RAISE EXCEPTION 'Nomor WhatsApp terlalu panjang.';
  END IF;

  v_url := trim(COALESCE(p_twibbon_url, ''));
  IF v_url = '' THEN
    RAISE EXCEPTION 'Silakan upload Twibbon terlebih dahulu untuk melanjutkan pendaftaran.';
  END IF;
  IF v_url NOT LIKE '%/storage/v1/object/public/nahara-uploads/agustusan/%' THEN
    RAISE EXCEPTION 'URL Twibbon tidak valid. Unggah ulang melalui formulir pendaftaran.';
  END IF;

  v_label := p_blok_row || '/' || lpad(p_nomor_kavling::text, 2, '0');

  -- Serialize concurrent registrations for the same household
  v_lock_key := hashtext(
    p_edition_id::text || ':' || p_blok_row || ':' || p_nomor_kavling::text
  )::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COUNT(*)::int INTO v_count
  FROM event_peak_registrations
  WHERE edition_id = p_edition_id
    AND blok_row = p_blok_row
    AND nomor_kavling = p_nomor_kavling
    AND status IN ('pending', 'verified');

  IF v_count >= 2 THEN
    RAISE EXCEPTION 'Rumah % sudah memiliki 2 peserta terdaftar. Maksimal 2 peserta per rumah.', v_label;
  END IF;

  IF EXISTS (
    SELECT 1 FROM event_peak_registrations
    WHERE edition_id = p_edition_id
      AND blok_row = p_blok_row
      AND nomor_kavling = p_nomor_kavling
      AND participant_role = v_role
      AND status IN ('pending', 'verified')
  ) THEN
    RAISE EXCEPTION 'Data ini sudah terdaftar pada acara Agustusan (peran % untuk %).', v_role, v_label;
  END IF;

  INSERT INTO event_peak_registrations (
    edition_id,
    blok_row,
    nomor_kavling,
    household_label,
    participant_name,
    participant_role,
    phone,
    twibbon_url,
    terms_accepted_at,
    status,
    registration_code,
    warga_id,
    verified_at
  ) VALUES (
    p_edition_id,
    p_blok_row,
    p_nomor_kavling,
    v_label,
    v_name,
    v_role,
    v_phone,
    v_url,
    now(),
    'verified',
    public.generate_peak_registration_code(),
    p_warga_id,
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Data ini sudah terdaftar pada acara Agustusan 2026.';
END;
$$;

REVOKE ALL ON FUNCTION public.register_peak_participant(
  uuid, text, int, text, text, text, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_peak_participant(
  uuid, text, int, text, text, text, text, uuid
) TO anon, authenticated;

-- ========== set_peak_registration_status ==========

CREATE OR REPLACE FUNCTION public.set_peak_registration_status(
  p_registration_id uuid,
  p_status text
)
RETURNS event_peak_registrations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row event_peak_registrations%ROWTYPE;
  v_status text;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengubah status pendaftaran.';
  END IF;

  v_status := lower(trim(p_status));
  IF v_status NOT IN ('pending', 'verified', 'cancelled') THEN
    RAISE EXCEPTION 'Status tidak valid.';
  END IF;

  UPDATE event_peak_registrations
  SET
    status = v_status,
    verified_at = CASE WHEN v_status = 'verified' THEN COALESCE(verified_at, now()) ELSE verified_at END,
    cancelled_at = CASE WHEN v_status = 'cancelled' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_registration_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pendaftaran tidak ditemukan.';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_peak_registration_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_peak_registration_status(uuid, text) TO authenticated;

-- ========== spin_door_prize ==========

CREATE OR REPLACE FUNCTION public.spin_door_prize(p_prize_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize event_door_prizes%ROWTYPE;
  v_won int;
  v_pick event_peak_registrations%ROWTYPE;
  v_winner event_door_prize_winners%ROWTYPE;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat melakukan spin door prize.';
  END IF;

  SELECT * INTO v_prize FROM event_door_prizes WHERE id = p_prize_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hadiah tidak ditemukan.';
  END IF;
  IF NOT v_prize.is_active THEN
    RAISE EXCEPTION 'Hadiah ini tidak aktif.';
  END IF;

  SELECT COUNT(*)::int INTO v_won
  FROM event_door_prize_winners
  WHERE prize_id = p_prize_id;

  IF v_won >= v_prize.quantity THEN
    RAISE EXCEPTION 'Kuota hadiah "%" sudah habis.', v_prize.name;
  END IF;

  SELECT r.* INTO v_pick
  FROM event_peak_registrations r
  WHERE r.edition_id = v_prize.edition_id
    AND r.status = 'verified'
    AND r.twibbon_url IS NOT NULL
    AND char_length(trim(r.twibbon_url)) > 0
    AND NOT EXISTS (
      SELECT 1 FROM event_door_prize_winners w WHERE w.registration_id = r.id
    )
  ORDER BY md5(r.id::text || clock_timestamp()::text)
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ada peserta eligible untuk diundi.';
  END IF;

  INSERT INTO event_door_prize_winners (
    edition_id, prize_id, registration_id, selected_by
  ) VALUES (
    v_prize.edition_id,
    v_prize.id,
    v_pick.id,
    auth.uid()
  )
  RETURNING * INTO v_winner;

  RETURN jsonb_build_object(
    'winner', to_jsonb(v_winner),
    'registration', to_jsonb(v_pick),
    'prize', to_jsonb(v_prize)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.spin_door_prize(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_door_prize(uuid) TO authenticated;

-- ========== upsert_peak_push_subscription ==========

CREATE OR REPLACE FUNCTION public.upsert_peak_push_subscription(
  p_registration_code text,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text DEFAULT NULL
)
RETURNS event_peak_push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg event_peak_registrations%ROWTYPE;
  v_row event_peak_push_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_reg
  FROM event_peak_registrations
  WHERE registration_code = upper(trim(p_registration_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode pendaftaran tidak ditemukan.';
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RAISE EXCEPTION 'Pendaftaran ini sudah dibatalkan.';
  END IF;

  IF char_length(trim(COALESCE(p_endpoint, ''))) < 10
     OR char_length(trim(COALESCE(p_p256dh, ''))) < 8
     OR char_length(trim(COALESCE(p_auth, ''))) < 8 THEN
    RAISE EXCEPTION 'Data subscription tidak valid.';
  END IF;

  INSERT INTO event_peak_push_subscriptions (
    registration_id, endpoint, p256dh, auth, user_agent
  ) VALUES (
    v_reg.id,
    trim(p_endpoint),
    trim(p_p256dh),
    trim(p_auth),
    NULLIF(trim(COALESCE(p_user_agent, '')), '')
  )
  ON CONFLICT (endpoint) DO UPDATE
  SET
    registration_id = EXCLUDED.registration_id,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_peak_push_subscription(
  text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_peak_push_subscription(
  text, text, text, text, text
) TO anon, authenticated;

-- Admin helper: load push subs for a registration (for notify API with service role / admin)
CREATE OR REPLACE FUNCTION public.get_peak_push_subscriptions_for_registration(
  p_registration_id uuid
)
RETURNS SETOF event_peak_push_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membaca subscription.';
  END IF;
  RETURN QUERY
  SELECT * FROM event_peak_push_subscriptions
  WHERE registration_id = p_registration_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peak_push_subscriptions_for_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_peak_push_subscriptions_for_registration(uuid) TO authenticated;

-- ========== Seed door prizes (2026 edition) ==========

INSERT INTO event_door_prizes (id, edition_id, name, description, quantity, sort_order, is_active, kind)
VALUES
  (
    'a0812026-0000-4000-8000-000000000301',
    'a0812026-0000-4000-8000-000000000010',
    'Vacuum',
    'Door prize — 1 unit',
    1,
    1,
    true,
    'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000302',
    'a0812026-0000-4000-8000-000000000010',
    'Payung',
    'Door prize — 5 unit',
    5,
    2,
    true,
    'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000303',
    'a0812026-0000-4000-8000-000000000010',
    'Voucher Perawatan',
    'Door prize — 8 voucher',
    8,
    3,
    true,
    'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000305',
    'a0812026-0000-4000-8000-000000000010',
    'Magic Com',
    'Door prize — 1 unit',
    1,
    4,
    true,
    'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000306',
    'a0812026-0000-4000-8000-000000000010',
    'Chopper',
    'Door prize — 1 unit',
    1,
    5,
    true,
    'door'
  ),
  (
    'a0812026-0000-4000-8000-000000000304',
    'a0812026-0000-4000-8000-000000000010',
    'Hadiah Utama',
    'Hadiah utama via Duck Race — spin terpisah',
    1,
    10,
    true,
    'utama'
  )
ON CONFLICT (id) DO NOTHING;
