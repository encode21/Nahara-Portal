# Panduan Pengurus — Nahara Portal

Panduan ini untuk **pengurus lingkungan** (RT/RW / pengurus portal). Anda mengelola data setelah **login**.

Warga memakai portal **tanpa akun**. Akun login hanya untuk pengurus (dan petugas security tertentu).

---

## 1. Login dan logout

### Login

1. Buka `/login`.
2. Masukkan **email** dan **kata sandi** yang sudah diberikan admin sistem.
3. Setelah berhasil, Anda diarahkan ke Dashboard.
4. Tombol dan formulir **kelola** hanya muncul jika akun memiliki peran admin portal (`app_metadata.role = admin`).

### Logout

- Buka menu profil/pengguna di header, lalu pilih keluar / logout.

**Penting:** Jangan bagikan akun login ke warga. Warga tidak memerlukan akun untuk melihat data atau membuat pengaduan. Akun admin hanya dibuat manual di Supabase (tidak ada daftar publik).

---

## 2. Cara kerja setelah login

Portal warga dan pengurus memakai halaman yang sama (Dashboard, Pengumuman, Iuran, dll.).

- **Tanpa login:** hanya bisa melihat (dan beberapa aksi warga seperti buat pengaduan).
- **Setelah login sebagai admin:** tombol tambah / edit / hapus / ubah status muncul.
- **Login security (tanpa role admin):** bisa melihat notifikasi di Info Security; tidak bisa mengubah kas/warga/iuran.

Halaman khusus pengurus (wajib login):

| Halaman | Alamat |
|---------|--------|
| Kelola kegiatan | `/activities` |
| Kas (alternatif) | `/kas` |
| Kelola Agustusan | `/activities/agustusan` |

---

## 3. Kelola pengaduan

**Menu:** Pengaduan · **Alamat:** `/pengaduan`

Warga mengirim laporan lewat `/pengaduan/baru`. Tugas pengurus:

1. Buka daftar pengaduan.
2. Filter menurut status atau kategori jika perlu.
3. Ubah status laporan:
   - **Baru** → baru masuk
   - **Diproses** → sedang ditindaklanjuti
   - **Selesai** → sudah selesai

Pastikan status selalu diperbarui agar warga tahu progresnya.

---

## 4. Pengumuman

**Menu:** Pengumuman · **Alamat:** `/pengumuman`

Setelah login Anda bisa:

- **Tambah** pengumuman baru (judul, isi, gambar)
- **Edit** pengumuman yang ada
- **Hapus** pengumuman yang sudah tidak relevan

---

## 5. Info warga

**Menu:** Info Warga · **Alamat:** `/info-warga`

Kelola data warga:

- Tambah warga baru (nama, blok, kavling, status hunian, telepon)
- Edit data yang berubah
- Hapus data jika perlu

Data ini dipakai di peta, iuran, dan direktori warga.

---

## 6. Iuran

**Menu:** Iuran · **Alamat:** `/iuran`

### Generate iuran bulanan

1. Pilih bulan dan tahun.
2. Jalankan **generate** iuran untuk semua warga (jika data bulan itu belum ada).

### Menandai lunas

- Dari halaman Iuran: ubah status per warga (lunas / belum).
- Dari **peta** di Dashboard: buka rumah, lalu **Tandai Lunas** untuk bulan berjalan (perlu login agar tersimpan).

---

## 7. Keuangan (kas)

**Menu:** Keuangan · **Alamat:** `/keuangan`  
Alternatif: `/kas` (halaman admin khusus, wajib login)

Anda bisa:

- Tambah entri pemasukan / pengeluaran
- Edit atau hapus entri
- Filter daftar kas
- Memindahkan / mencatat aliran **Kas → Donasi** jika tersedia di formulir

Pastikan kategori dan keterangan jelas agar laporan transparan untuk warga.

---

## 8. Donasi

**Menu:** Donasi · **Alamat:** `/donasi`

Kelola kampanye:

- Buat kampanye baru (target, terkumpul, tenggat, aktif/nonaktif)
- Edit progress terkumpul
- Nonaktifkan kampanye yang sudah selesai

---

## 9. CCTV

**Menu:** CCTV · **Alamat:** `/cctv`

- Tambah kamera (nama, lokasi, URL stream, status online)
- Edit atau hapus kamera
- Pastikan URL stream benar agar warga bisa menonton

---

## 10. Info security

**Menu:** Info Security · **Alamat:** `/info-security`

Sebagai pengurus (login):

- Kelola daftar petugas (nama, jabatan, telepon)
- Atur akun email petugas yang boleh menerima **notifikasi** security (`security_users`)
- Lihat notifikasi terkait (misalnya pengaduan baru)

### Catatan untuk petugas security

Jika email petugas sudah didaftarkan di daftar security users **tanpa** `role: admin`, petugas itu bisa login dan melihat **notifikasi** di halaman Info Security (menandai sudah dibaca), tanpa hak mengelola seluruh data portal.

Untuk admin sistem yang mengelola Supabase: ikuti checklist di file repo `docs/auth-security-checklist.md` (disable signup, set `app_metadata.role`).

---

## 11. Kelola kegiatan

**Menu / tautan:** Kelola Kegiatan · **Alamat:** `/activities` (wajib login)

1. Buat atau edit kegiatan (judul, tanggal, biaya, deskripsi, dll.).
2. Buka detail kegiatan (`/activities/[id]`) untuk:
   - menambah peserta
   - menandai pembayaran
   - menandai kehadiran
3. Kegiatan Agustusan punya alur tambahan (lihat bagian berikutnya).

Di halaman publik `/kegiatan`, warga hanya melihat daftar dan bisa mendaftar; pengelolaan penuh lewat `/activities`.

---

## 12. Kelola Agustusan

**Alamat pusat:** `/activities/agustusan`

### Edisi tahunan

1. Buat edisi untuk tahun tertentu.
2. Tetapkan edisi yang **aktif** agar muncul di dashboard dan portal warga.

### Per edisi (`/activities/agustusan/[tahun]`)

Kelola lewat tab yang tersedia:

| Area | Tugas pengurus |
|------|----------------|
| Lomba | Tambah/edit lomba, jadwal, kuota, dll. |
| Peserta | Lihat pendaftar; cabut/withdraw jika perlu |
| Juara | Catat peringkat dan hadiah, lalu publikasikan |
| Galeri | Unggah foto; publish / sembunyikan / hapus |
| SOP | Isi atau perbarui teks ketentuan acara |

Warga mendaftar lomba dan melihat hasil di `/kegiatan/agustusan/[tahun]/...`.

Twibbon yang dipublikasikan warga dapat masuk ke galeri — pantau galeri secara berkala.

---

## Checklist rutin pengurus

Gunakan sebagai pengingat mingguan / bulanan:

- [ ] Baca dan update status **pengaduan** baru
- [ ] Pasang **pengumuman** penting (iuran, kerja bakti, undangan)
- [ ] Cek data **warga** jika ada pindahan / penghuni baru
- [ ] **Generate iuran** awal bulan + tandai yang sudah bayar
- [ ] Catat **kas** masuk/keluar secara rutin
- [ ] Update progress **donasi** jika ada kampanye
- [ ] Pastikan **CCTV** online
- [ ] Sebelum/saat Agustusan: cek lomba, peserta, juara, galeri, SOP

---

## Keamanan akun

- Gunakan kata sandi yang kuat dan jangan dibagikan.
- Logout setelah memakai perangkat bersama.
- Jika akun hilang akses, hubungi orang yang mengelola Supabase / teknis portal.

---

## Panduan untuk warga

Untuk arahan tanpa login (buat pengaduan, cek iuran, daftar lomba, dll.), arahkan warga ke [Panduan Warga](/panduan/warga).
