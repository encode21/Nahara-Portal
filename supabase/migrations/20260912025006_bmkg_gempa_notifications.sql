-- Grant service_role access to notification helpers used by BMKG gempa cron.
-- Cron inserts via service role (bypasses RLS); this keeps RPC usable too.

GRANT EXECUTE ON FUNCTION public.insert_notification_event(
  text, text, text, text, text, uuid, text, text, text, jsonb
) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_portal_push_subscriptions_for_notification(uuid)
  TO service_role;

GRANT EXECUTE ON FUNCTION public.find_portal_notification_for_source(text, uuid, text)
  TO service_role;
