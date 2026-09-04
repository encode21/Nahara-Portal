-- Drop leftover permissive policies, hide peak-reg phones from anon,
-- revoke admin SECURITY DEFINER RPCs from anon.

-- ========== Remove overlapping write policies ==========

DROP POLICY IF EXISTS "Authenticated full access activities" ON public.activities;
DROP POLICY IF EXISTS "Admin full access cctv" ON public.cctv_cameras;
DROP POLICY IF EXISTS "Admin full access donasi" ON public.donasi_campaign;
DROP POLICY IF EXISTS "Admin full access iuran" ON public.iuran;
DROP POLICY IF EXISTS "Authenticated full access kas" ON public.kas_entries;
DROP POLICY IF EXISTS "Authenticated full access participants" ON public.participants;
DROP POLICY IF EXISTS "Public can register for activities" ON public.participants;
DROP POLICY IF EXISTS "Admin manage pengaduan" ON public.pengaduan;
DROP POLICY IF EXISTS "Anyone can submit pengaduan" ON public.pengaduan;
DROP POLICY IF EXISTS "Admin full access pengumuman" ON public.pengumuman;
DROP POLICY IF EXISTS "Admin full access warga" ON public.warga;

-- CCTV public read was missing; portal warga page selects as anon.
DROP POLICY IF EXISTS "public_read_cctv" ON public.cctv_cameras;
CREATE POLICY "public_read_cctv"
  ON public.cctv_cameras FOR SELECT TO anon, authenticated
  USING (true);

-- ========== Peak registration: anon cannot read phone ==========

REVOKE SELECT ON TABLE public.event_peak_registrations FROM anon;
GRANT SELECT (
  id,
  edition_id,
  blok_row,
  nomor_kavling,
  household_label,
  participant_name,
  participant_role,
  twibbon_url,
  terms_accepted_at,
  status,
  registration_code,
  warga_id,
  verified_at,
  cancelled_at,
  created_at,
  updated_at
) ON public.event_peak_registrations TO anon;

-- ========== Helper functions: pin search_path ==========

CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_portal_ops()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'estate', 'rtrw'),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_peak_blok_row(p_blok_row text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT p_blok_row IN (
    'NHB-1','NHB-2','NHB-3','NHB-6','NHB-7','NHB-8',
    'NHT-1','NHT-2','NHT-3','NHT-6','NHT-7','NHT-8'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_peak_registration_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
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

-- ========== Revoke admin RPCs from anon ==========

REVOKE ALL ON FUNCTION public.award_door_prize(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_door_prize(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_door_prize(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.finish_duck_race(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_duck_race(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finish_duck_race(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_peak_push_subscriptions_for_registration(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_peak_push_subscriptions_for_registration(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_peak_push_subscriptions_for_registration(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_peak_registration_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_peak_registration_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_peak_registration_status(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.spin_door_prize(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.spin_door_prize(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.spin_door_prize(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.start_duck_race(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_duck_race(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.start_duck_race(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_peak_registration_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_peak_registration_code() FROM anon;

NOTIFY pgrst, 'reload schema';
