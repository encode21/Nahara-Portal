# BMKG Gempa → Notifikasi

Situation Center (cuaca/AQI) tetap di-cache **15 menit**.

Alert gempa memakai poller khusus:

- Endpoint: `GET|POST /api/cron/bmkg-gempa`
- Pemicu: **cron-job.org** tiap **2 menit** (Vercel Cron dimatikan agar tidak dobel)
- Auth: header `Authorization: Bearer $CRON_SECRET`
- Butuh env: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, VAPID keys (untuk push)

Manual test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://portal.nahara.id/api/cron/bmkg-gempa
```

Perilaku:

1. Fetch `gempadirasakan.json` (no-store)
2. Filter relevan (≤450 km, atau M≥5, atau M≥4 dalam 200 km)
3. Insert `notification_events` (`earthquake_detected`, category `emergency`) — idempotent
4. Web Push ke semua `portal_push_subscriptions`
5. Inbox `/notifikasi` filter **Darurat** + tombol **Bagikan** (WhatsApp)
