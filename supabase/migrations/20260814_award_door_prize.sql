-- Forced / manual door prize award (admin test & override)
-- Run after 20260813_event_peak_registration.sql

CREATE OR REPLACE FUNCTION public.award_door_prize(
  p_prize_id uuid,
  p_registration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize event_door_prizes%ROWTYPE;
  v_reg event_peak_registrations%ROWTYPE;
  v_won int;
  v_winner event_door_prize_winners%ROWTYPE;
BEGIN
  IF NOT public.is_portal_admin() THEN
    RAISE EXCEPTION 'Hanya admin yang dapat menetapkan pemenang.';
  END IF;

  SELECT * INTO v_prize FROM event_door_prizes WHERE id = p_prize_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hadiah tidak ditemukan.';
  END IF;
  IF NOT v_prize.is_active THEN
    RAISE EXCEPTION 'Hadiah ini tidak aktif.';
  END IF;

  SELECT * INTO v_reg
  FROM event_peak_registrations
  WHERE id = p_registration_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peserta tidak ditemukan.';
  END IF;

  IF v_reg.edition_id <> v_prize.edition_id THEN
    RAISE EXCEPTION 'Peserta tidak termasuk edisi hadiah ini.';
  END IF;

  IF v_reg.status <> 'verified' THEN
    RAISE EXCEPTION 'Peserta harus berstatus verified.';
  END IF;

  IF v_reg.twibbon_url IS NULL OR char_length(trim(v_reg.twibbon_url)) = 0 THEN
    RAISE EXCEPTION 'Peserta belum memiliki twibbon.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM event_door_prize_winners w WHERE w.registration_id = v_reg.id
  ) THEN
    RAISE EXCEPTION 'Peserta ini sudah pernah menang door prize.';
  END IF;

  SELECT COUNT(*)::int INTO v_won
  FROM event_door_prize_winners
  WHERE prize_id = p_prize_id;

  IF v_won >= v_prize.quantity THEN
    RAISE EXCEPTION 'Kuota hadiah "%" sudah habis.', v_prize.name;
  END IF;

  INSERT INTO event_door_prize_winners (
    edition_id, prize_id, registration_id, selected_by
  ) VALUES (
    v_prize.edition_id,
    v_prize.id,
    v_reg.id,
    auth.uid()
  )
  RETURNING * INTO v_winner;

  RETURN jsonb_build_object(
    'winner', to_jsonb(v_winner),
    'registration', to_jsonb(v_reg),
    'prize', to_jsonb(v_prize)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_door_prize(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_door_prize(uuid, uuid) TO authenticated;
