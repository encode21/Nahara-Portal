-- Nahara Portal — Ops-managed manual situation alerts
-- Used by Situation Center placeholders (flood, listrik, gate, …)

CREATE TABLE IF NOT EXISTS situation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL
    CHECK (
      type IN (
        'flood',
        'drainage',
        'electricity',
        'water_supply',
        'gate',
        'road_closure',
        'fallen_tree',
        'security',
        'fire',
        'smoke'
      )
    ),
  severity TEXT NOT NULL
    CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_area TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'resolved')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT situation_alerts_title_len CHECK (char_length(trim(title)) >= 2),
  CONSTRAINT situation_alerts_description_len CHECK (
    char_length(trim(description)) >= 2
    AND char_length(description) <= 1000
  ),
  CONSTRAINT situation_alerts_affected_area_len CHECK (
    affected_area IS NULL OR char_length(affected_area) <= 200
  ),
  CONSTRAINT situation_alerts_resolved_consistency CHECK (
    (status = 'active' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL)
  )
);

-- One active alert per type (Situation Center maps type → status id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_situation_alerts_active_type
  ON situation_alerts (type)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_situation_alerts_status_started
  ON situation_alerts (status, started_at DESC);

CREATE OR REPLACE FUNCTION public.set_situation_alerts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_situation_alerts_updated_at ON situation_alerts;
CREATE TRIGGER trg_situation_alerts_updated_at
  BEFORE UPDATE ON situation_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_situation_alerts_updated_at();

ALTER TABLE situation_alerts ENABLE ROW LEVEL SECURITY;

-- Residents / public may read active alerts (dashboard Situation Center)
DROP POLICY IF EXISTS "public_read_situation_alerts" ON situation_alerts;
CREATE POLICY "public_read_situation_alerts"
  ON situation_alerts FOR SELECT TO anon, authenticated
  USING (true);

-- Ops (admin/estate/rtrw) manage alerts
DROP POLICY IF EXISTS "ops_insert_situation_alerts" ON situation_alerts;
CREATE POLICY "ops_insert_situation_alerts"
  ON situation_alerts FOR INSERT TO authenticated
  WITH CHECK (public.is_portal_ops() OR public.is_portal_admin());

DROP POLICY IF EXISTS "ops_update_situation_alerts" ON situation_alerts;
CREATE POLICY "ops_update_situation_alerts"
  ON situation_alerts FOR UPDATE TO authenticated
  USING (public.is_portal_ops() OR public.is_portal_admin())
  WITH CHECK (public.is_portal_ops() OR public.is_portal_admin());

DROP POLICY IF EXISTS "ops_delete_situation_alerts" ON situation_alerts;
CREATE POLICY "ops_delete_situation_alerts"
  ON situation_alerts FOR DELETE TO authenticated
  USING (public.is_portal_ops() OR public.is_portal_admin());

DROP POLICY IF EXISTS "admin_all_situation_alerts" ON situation_alerts;
CREATE POLICY "admin_all_situation_alerts"
  ON situation_alerts FOR ALL TO authenticated
  USING (public.is_portal_admin())
  WITH CHECK (public.is_portal_admin());

GRANT SELECT ON situation_alerts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON situation_alerts TO authenticated;
