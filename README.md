# Nahara — Portal Cluster

Portal web modern untuk mengelola kegiatan paguyuban, pendaftaran warga, dan kas paguyuban perumahan Nahara.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (database, auth, realtime)
- **Vercel** (deployment)

## Fitur

- **Kegiatan** — CRUD kegiatan dengan tracking peserta, pembayaran, dan kehadiran
- **Kas** — Pencatatan pemasukan/pengeluaran dengan saldo berjalan
- **Pendaftaran Publik** — Form di `/register` tanpa login
- **Admin Panel** — Dashboard, manajemen kegiatan & kas (protected)

## Setup Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd Nahara
npm install
```

### 2. Supabase Project

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan migration di `supabase/migrations/` (termasuk harden security)
3. **Authentication (wajib untuk keamanan):**
   - Nonaktifkan public email signup (invite-only / Add user manual)
   - Buat user di **Authentication → Users → Add user**
   - Set **App Metadata** sesuai peran: `{ "role": "admin" }` | `"estate"` | `"rtrw"`
   - User security (notifikasi saja): tanpa role admin
   - Aktifkan batasan password + rate limit Auth
4. Tiga host: di Vercel tambah `nahara.id`, `portal.nahara.id`, `ops.nahara.id`; lihat [`docs/auth-security-checklist.md`](docs/auth-security-checklist.md)

### 3. Environment Variables

Salin file contoh:

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Kunci ini ada di **Supabase → Project Settings → API**.

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

| Route              | Deskripsi                 |
| ------------------ | ------------------------- |
| `/`                | Beranda publik            |
| `/register`        | Pendaftaran kegiatan      |
| `/login`           | Login admin               |
| `/dashboard`       | Dashboard admin           |
| `/activities`      | Kelola kegiatan           |
| `/activities/[id]` | Detail kegiatan + peserta |
| `/kas`             | Kelola kas                |

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Framework preset: **Next.js** (auto-detected)

## Database Schema

```sql
activities       — kegiatan paguyuban
participants     — peserta per kegiatan
kas_entries      — transaksi kas (pemasukan/pengeluaran)
```

Lihat `supabase/schema.sql` untuk schema lengkap beserta Row Level Security policies.

## Struktur Project

```
app/
  (public)/          — halaman publik (beranda, register)
  (admin)/           — panel admin (dashboard, activities, kas)
  login/             — halaman login
components/          — UI components reusable
lib/
  supabase.ts        — Supabase client (browser)
  supabase/          — server & middleware clients
  types.ts           — TypeScript types
  utils.ts           — helpers
supabase/
  schema.sql         — database schema
```

## Lisensi

Private — Paguyuban Nahara
