-- Seed HUT RI 81 lomba + peserta (list WhatsApp terbaru 6 Agu 2026)
-- Requires: migrations activity seed + 20260806_event_editions_contests.sql

BEGIN;

DELETE FROM event_contest_results
WHERE contest_id IN (
  SELECT id FROM event_contests WHERE edition_id = 'a0812026-0000-4000-8000-000000000010'
);
DELETE FROM event_contest_entries
WHERE contest_id IN (
  SELECT id FROM event_contests WHERE edition_id = 'a0812026-0000-4000-8000-000000000010'
);
DELETE FROM event_contests WHERE edition_id = 'a0812026-0000-4000-8000-000000000010';
DELETE FROM event_editions WHERE id = 'a0812026-0000-4000-8000-000000000010';

INSERT INTO event_editions (
  id, year, slug, title, description, sop_text,
  starts_on, ends_on, registration_closes_at, status,
  activity_id, campaign_id
) VALUES (
  'a0812026-0000-4000-8000-000000000010',
  2026,
  'hut-ri-81',
  'Agustusan HUT RI ke-81',
  'Perayaan kemerdekaan Cluster Nahara — donasi, lomba, dan malam puncak.',
  E'*SOP UMUM PELAKSANAAN LOMBA HUT RI KE-81 CLUSTER NAHARA*

A. Tujuan
1. Memeriahkan Hari Kemerdekaan Republik Indonesia.
2. Mempererat silaturahmi antar warga.
3. Menumbuhkan sportivitas, kekompakan, dan kebersamaan.

B. Ketentuan Umum
* Peserta wajib mendaftar sebelum batas waktu yang ditentukan.
* Peserta hadir minimal 15 menit sebelum lomba.
* Menggunakan pakaian yang sopan dan nyaman.
* Keputusan juri bersifat mutlak dan tidak dapat diganggu gugat.
* Dilarang melakukan kecurangan dalam bentuk apa pun.
* Menjaga keamanan, kebersihan, dan ketertiban selama kegiatan.

Batas daftar peserta: 7 Agustus 2026 pukul 18.00.',
  '2026-08-08',
  '2026-08-16',
  '2026-08-07T18:00:00+07:00',
  'active',
  (SELECT id FROM activities WHERE id = 'a0812026-0000-4000-8000-000000000001'),
  (SELECT id FROM donasi_campaign WHERE id = 'a0812026-0000-4000-8000-000000000002')
);

-- Contests
INSERT INTO event_contests (
  id, edition_id, sort_order, title, category, category_note,
  location, starts_at, ends_at, equipment, rules,
  team_size, registration_open, is_competition
) VALUES
(
  'a0812026-0000-4000-8000-000000000101',
  'a0812026-0000-4000-8000-000000000010',
  1, 'Jalan Silang', 'ibu', 'Anak perempuan remaja boleh ikut',
  'NHT-2', '2026-08-08T15:00:00+07:00', '2026-08-08T16:00:00+07:00',
  E'Kapur\nJarak 10 meter\nCone atau botol sebagai penanda',
  E'Peserta berjalan mengikuti jalur silang (zig-zag) dengan mata tertutup.\nJika keluar lintasan, wajib kembali ke titik semula (percobaan 2x).\nPemenang adalah peserta yang memasuki garis finish atau mencapai jarak terjauh.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000102',
  'a0812026-0000-4000-8000-000000000010',
  2, 'Oper Tepung', 'ibu', 'Anak perempuan remaja boleh ikut · 1 tim 5 orang (aturan lapangan)',
  'Jalan Tengah', '2026-08-08T16:00:00+07:00', '2026-08-08T17:30:00+07:00',
  E'Tepung\nNampan/piring',
  E'Memindahkan tepung dari orang pertama menuju orang terakhir menggunakan wadah unik.\nPemenang ditentukan oleh tepung yang paling banyak.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000103',
  'a0812026-0000-4000-8000-000000000010',
  3, 'Gaple', 'bapak', 'Anak remaja laki-laki boleh ikut',
  'NHT-2', '2026-08-08T19:00:00+07:00', '2026-08-08T21:00:00+07:00',
  E'Meja dan Gaple',
  E'Satu pertandingan 4 orang.\nPemenang adalah yang 3x menang duluan.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000104',
  'a0812026-0000-4000-8000-000000000010',
  4, 'Esport Sepak Bola', 'bapak', 'Anak remaja laki-laki boleh ikut',
  'NHT-2', '2026-08-09T19:30:00+07:00', '2026-08-09T21:30:00+07:00',
  E'TV dan PS',
  E'Bagan acak liga (drawing).\nDurasi pertandingan 10 menit per match.\nSistem gugur.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000105',
  'a0812026-0000-4000-8000-000000000010',
  5, 'Pingpong', 'bapak', 'Anak remaja laki-laki boleh ikut',
  'Club House', '2026-08-09T08:00:00+07:00', '2026-08-09T10:00:00+07:00',
  E'Meja Pingpong\nBet',
  E'Sistem gugur.\nSesuai aturan main.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000106',
  'a0812026-0000-4000-8000-000000000010',
  6, 'Pancing Emosi', 'pasangan', NULL,
  'Jalan Tengah', '2026-08-09T15:00:00+07:00', '2026-08-09T16:00:00+07:00',
  E'Kerupuk\nBambu pancing\nBenang\nKursi',
  E'Peserta adalah suami dan istri (berpasangan).\nMasing-masing berlomba menghabiskan kerupuk dengan cara seperti memancing.\nPemenang adalah yang duluan menghabiskan kerupuk.',
  2, true, true
),
(
  'a0812026-0000-4000-8000-000000000107',
  'a0812026-0000-4000-8000-000000000010',
  7, 'Tendang Bola Pake Corong', 'pasangan', NULL,
  'Jalan Tengah', '2026-08-09T16:45:00+07:00', '2026-08-09T17:30:00+07:00',
  E'Corong\nDaster\nBola',
  E'Menggiring bola sampai titik tertentu dengan wajah tertutup corong, pakaian daster.',
  2, true, true
),
(
  'a0812026-0000-4000-8000-000000000108',
  'a0812026-0000-4000-8000-000000000010',
  8, 'Tebak Warna', 'dewasa_remaja', NULL,
  'NHT-2', '2026-08-09T16:00:00+07:00', '2026-08-09T16:45:00+07:00',
  E'Kaos kaki berwarna\nTiker',
  E'MC/Juri menyebutkan warna secara acak.\nPeserta harus menunjukkan warna dengan benar.\nJawaban salah atau terlambat dianggap gugur.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000109',
  'a0812026-0000-4000-8000-000000000010',
  9, 'Karnaval & Menghias Sepeda', 'keluarga', NULL,
  'Start-Finish Gate Depan', '2026-08-16T07:30:00+07:00', '2026-08-16T09:00:00+07:00',
  NULL,
  E'Kreativitas dekorasi (40%), Tema Kemerdekaan (30%), Kerapihan (20%), Penampilan (10%).\nDekorasi aman dan tidak membahayakan.\nPeserta wajib mengikuti rute yang telah ditentukan.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000110',
  'a0812026-0000-4000-8000-000000000010',
  10, 'Tebak Tebakan Cermat', 'dewasa_remaja', '1 tim 2 orang (campuran)',
  'Mini Golf', '2026-08-16T09:00:00+07:00', '2026-08-16T10:00:00+07:00',
  E'Podium dan Meja\nMateri disusun oleh Ketua',
  E'1 pertandingan tergantung peserta.\n1 Tim terdiri dari 2 orang (campuran).\nNilai ditentukan oleh Juri.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000111',
  'a0812026-0000-4000-8000-000000000010',
  11, 'Pindahkan Bendera', 'balita', NULL,
  'Jalan Tengah', '2026-08-16T15:00:00+07:00', '2026-08-16T16:00:00+07:00',
  E'Bendera kecil\nBotol',
  E'Peserta memindahkan bendera satu per satu.\nTidak boleh melempar.\nPemenang adalah yang paling banyak memindahkan bendera.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000112',
  'a0812026-0000-4000-8000-000000000010',
  12, 'Lempar Bola Ke Kardus', 'balita', NULL,
  'Jalan Tengah', '2026-08-16T16:00:00+07:00', '2026-08-16T16:30:00+07:00',
  E'Bola plastik\nKardus',
  E'Setiap peserta mendapat 6 kali lemparan.\nBola yang masuk dihitung sebagai nilai.\nPemenang adalah yang paling banyak bola dan tercepat.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000113',
  'a0812026-0000-4000-8000-000000000010',
  13, 'Makan Kerupuk (Balita)', 'balita', NULL,
  'Jalan Tengah', '2026-08-16T16:30:00+07:00', '2026-08-16T17:30:00+07:00',
  E'Tali\nKerupuk',
  E'Peserta makan kerupuk.\nPemenang adalah yang tercepat menghabiskan kerupuk.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000116',
  'a0812026-0000-4000-8000-000000000010',
  14, 'Makan Kerupuk (Pre-Teen)', 'preteen', NULL,
  'Jalan Tengah', '2026-08-15T08:00:00+07:00', '2026-08-15T09:00:00+07:00',
  E'Tali\nKerupuk',
  E'Peserta makan kerupuk.\nPemenang adalah yang tercepat menghabiskan kerupuk.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000114',
  'a0812026-0000-4000-8000-000000000010',
  15, 'Masukkan Pensil Ke Botol', 'preteen', NULL,
  'Jalan Tengah', '2026-08-15T09:00:00+07:00', '2026-08-15T10:00:00+07:00',
  E'Alat pancing\nTali\nPensil\nBotol/Galon',
  E'Pensil diikat pada tali menggunakan bambu pancingan.\nPeserta memasukkan pensil ke dalam botol menggunakan satu tangan.\nWaktu tercepat menjadi pemenang.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000115',
  'a0812026-0000-4000-8000-000000000010',
  16, 'Mengangkat Gelas dengan Balon', 'preteen', NULL,
  'Jalan Tengah', '2026-08-15T10:00:00+07:00', '2026-08-15T11:00:00+07:00',
  E'Gelas plastik\nBalon kecil',
  E'Peserta memindahkan/mengangkat gelas dengan balon sesuai instruksi panitia.\nTidak boleh menggunakan tangan.\nPemenang adalah peserta tercepat.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000117',
  'a0812026-0000-4000-8000-000000000010',
  17, 'Serok Duit', 'art', NULL,
  'Mini Golf', '2026-08-16T10:00:00+07:00', '2026-08-16T11:00:00+07:00',
  E'Sutil\nUang\nPenutup mata',
  E'Pemain ditutup matanya, dan menyerok uang sebanyak-banyaknya.\nPemenang adalah yang mendapat uang terbanyak.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000118',
  'a0812026-0000-4000-8000-000000000010',
  18, 'Masak Indomie & Plating', 'bapak', 'Anak remaja laki-laki boleh ikut · 1 tim 2 orang (aturan lapangan)',
  'Jalan Tengah', '2026-08-16T18:30:00+07:00', '2026-08-16T19:30:00+07:00',
  E'Alat masak portabel hingga plating makanan',
  E'1 Tim terdiri dari 2 orang.\nWaktu memasak 15 menit termasuk belanja hingga plating.\nMenu berbahan dasar Indomie.\nPenilaian: Rasa 40%, Kreativitas 30%, Penyajian 20%, Kebersihan 10%.',
  1, true, true
),
(
  'a0812026-0000-4000-8000-000000000119',
  'a0812026-0000-4000-8000-000000000010',
  19, 'Penutupan: Malam Puncak', 'umum', NULL,
  'Mini Golf', '2026-08-16T19:30:00+07:00', NULL,
  NULL,
  E'Hiburan & kebersamaan warga.\nDoorprize, karaoke, games bersama, pembagian hadiah, makan bersama.',
  1, false, false
);

-- Helper: insert entries by contest (individual)
INSERT INTO event_contest_entries (contest_id, display_name, partner_name, block_number, status) VALUES
-- Jalan Silang
('a0812026-0000-4000-8000-000000000101', 'Sylvia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Rizma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Asma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Dhanty', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Dhifa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Nissa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Mery', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Widuri', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Nita', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Vidora', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Alin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Tara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Santi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000101', 'Ugit', NULL, NULL, 'registered'),
-- Oper Tepung
('a0812026-0000-4000-8000-000000000102', 'Sylvia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Asma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Tara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Rizma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Felicia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Dhanty', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Nissa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Dhifa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Nita', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Mery', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Tina', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Fadlia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Putri', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Alin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Puji', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Santi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000102', 'Ugit', NULL, NULL, 'registered'),
-- Gaple
('a0812026-0000-4000-8000-000000000103', 'Fadilla', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Zikky', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Pak Andi', NULL, 'NHT 1', 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Ketua Helmi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Erwin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Deris', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Aep', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Ferdi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Aru', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Kimung', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Joni', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Satria', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000103', 'Yusuf', NULL, NULL, 'registered'),
-- Esport
('a0812026-0000-4000-8000-000000000104', 'Fadilla', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Desandri', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Helmi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Zacki', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Fathan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Catur', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Erwin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Neo', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Chandra', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Reefan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Dian', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Satria', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000104', 'Yusuf', NULL, NULL, 'registered'),
-- Pingpong
('a0812026-0000-4000-8000-000000000105', 'Fadilla', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Erwin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Deris', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Kimung', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Pak Sugondo', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Aep', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Chandra', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Reefan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000105', 'Catur', NULL, NULL, 'registered'),
-- Pancing Emosi
('a0812026-0000-4000-8000-000000000106', 'Fadilla', 'Rizma', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Helmi', 'Sylvia', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Erwin', 'Asma', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Deris', 'Dhanty', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Putri', 'Aby', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Ferdi', 'Vidora', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Dian', 'Puji', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000106', 'Tika', 'Yusuf', NULL, 'registered'),
-- Tendang Bola Corong
('a0812026-0000-4000-8000-000000000107', 'Fadilla', 'Rizma', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Helmi', 'Sylvia', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Erwin', 'Asma', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Aep', 'Nissa', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Deris', 'Dhanty', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Putri', 'Aby', NULL, 'registered'),
('a0812026-0000-4000-8000-000000000107', 'Ugit', 'Veron', NULL, 'registered'),
-- Tebak Warna
('a0812026-0000-4000-8000-000000000108', 'Sylvia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Asma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Rizma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Felicia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Dhanty', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Mery', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Widuri', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Fadlia', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Vidora', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Alin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Puji', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Santi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Ugit', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000108', 'Tika', NULL, NULL, 'registered'),
-- Karnaval
('a0812026-0000-4000-8000-000000000109', 'Kathleen', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Kaylila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Pangga', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Barra', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Kiara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Kea', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Nuan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Benji', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Garald', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Minonow', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000109', 'Sean', NULL, NULL, 'registered'),
-- Tebak Cermat
('a0812026-0000-4000-8000-000000000110', 'Erwin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Asma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Fadilla', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Rizma', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Vidora', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Alin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Yusuf', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000110', 'Tika', NULL, NULL, 'registered'),
-- Pindahkan Bendera
('a0812026-0000-4000-8000-000000000111', 'Kaylila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Kathleen', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Yona', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Pangga', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Umar', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Barra', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Fio', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Benji', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Rhea', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000111', 'Sean', NULL, NULL, 'registered'),
-- Lempar Bola
('a0812026-0000-4000-8000-000000000112', 'Kaylila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Kathleen', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Yona', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Pangga', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Umar', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Barra', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Fio', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Zean', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Benji', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Rhea', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000112', 'Sean', NULL, NULL, 'registered'),
-- Makan Kerupuk Balita
('a0812026-0000-4000-8000-000000000113', 'Kathleen', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Kaylila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Yona', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Umar', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Kea', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Zean', NULL, 'NT 3/30', 'registered'),
('a0812026-0000-4000-8000-000000000113', 'Benji', NULL, NULL, 'registered'),
-- Pensil Botol
('a0812026-0000-4000-8000-000000000114', 'Aghniyaa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Nada', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Hafshah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Shafiyyah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Kiara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Aleeya', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Zean', NULL, 'NT 3/30', 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Shakila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Sabyan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Brunella', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Garald', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Clara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Qianna', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Danish', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000114', 'Saddam', NULL, NULL, 'registered'),
-- Gelas Balon
('a0812026-0000-4000-8000-000000000115', 'Nada', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Hafshah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Shafiyyah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Kiara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Aleeya', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Nuan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Shakila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Sabyan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Brunella', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Clara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Qianna', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000115', 'Danish', NULL, NULL, 'registered'),
-- Makan Kerupuk Preteen
('a0812026-0000-4000-8000-000000000116', 'Aghniyaa', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Nada', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Hafshah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Shafiyyah', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Kiara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Aleeya', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Zea', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Nuan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Shakila', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Sabyan', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Brunella', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Clara', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Qianna', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Garald', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Danish', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000116', 'Saddam', NULL, NULL, 'registered'),
-- Serok Duit
('a0812026-0000-4000-8000-000000000117', 'Uty', NULL, 'NHT 2/30', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Bude', NULL, 'NHT 2/15', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Yanti', NULL, 'NHT 2/6', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Septi', NULL, 'NHT 2/7', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Mba Nur', NULL, 'JHT 1/17', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Mba Resti', NULL, 'NT 3/30', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Yani', NULL, 'NHT 2/11', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Ibu Een', NULL, 'NHT 3/7', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Rantika', NULL, 'NHT 3/7', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Amel', NULL, 'NHT 8/28', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Dina', NULL, 'NHT 8/28', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Bude Titik', NULL, 'NHT 3/50', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Bi Mamah', NULL, 'NHT 3/20', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Isah', NULL, 'NHT 6/18', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Rizka', NULL, 'NHT 8/16', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Teh Ratih', NULL, 'NHT 8/27', 'registered'),
('a0812026-0000-4000-8000-000000000117', 'Bu Ela', NULL, 'NHT 8/52', 'registered'),
-- Masak Indomie
('a0812026-0000-4000-8000-000000000118', 'Erwin', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Fadilla', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Deris', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Desandri', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Ferdi', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Kimung', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Haris', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Sakti', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Yusuf', NULL, NULL, 'registered'),
('a0812026-0000-4000-8000-000000000118', 'Sony', NULL, NULL, 'registered');

COMMIT;
