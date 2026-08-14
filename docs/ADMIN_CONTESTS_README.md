Admin Manage Lomba (contests)  developer notes

What was added
- API endpoints under app/api/admin/contests (GET, POST)
- API endpoint to update contest: PUT /api/admin/contests/:id
- API endpoint to toggle publish: PATCH /api/admin/contests/:id/publish
- Optional backup endpoint: POST /api/admin/contests/:id/backup (best-effort)
- Admin UI page at /admin/contests and a modal component at components/admin/ContestFormModal.tsx

Auth / middleware
- Routes use supabase auth and isPortalAdmin(user) guard from lib/auth/roles.ts.
- This assumes server-side Supabase client (lib/supabase/server.ts) can read cookies and that the requesting user has a session with a role set to 'admin' in app_metadata.
- If you use API keys for ops automation, you can augment the routes by checking a header (eg. X-OPS-API-KEY) and validating it against an env var.

Notes / assumptions
- The event_contests table in the schema does not currently include an `is_published` boolean in some deployments. The publish endpoint attempts to toggle `is_published` if present; if your DB doesn't have that column you'll need to add it via migration:

  ALTER TABLE event_contests ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

- The backup endpoint inserts into event_contests_backups; create that table if you want backups to persist.

Local testing
1) Create branch and commit (see below).
2) Run dev server: pnpm dev or npm run dev (use project's usual command).
3) Open /admin/contests while logged-in as an admin user.
4) Test API directly:
   - GET: curl -H "Cookie: ..." http://localhost:3000/api/admin/contests
   - POST: curl -X POST -H "Content-Type: application/json" --data '{"edition_id":"<id>","title":"Test","category":"umum","starts_at":"2026-08-01T09:00","ends_at":"2026-08-01T11:00"}' http://localhost:3000/api/admin/contests

TODOs
- Add server-side rate limiting and stricter input sanitization if needed.
- Consider adding server-side validation library (zod) to share schemas with frontend.
