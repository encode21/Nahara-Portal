-- Seed arus kas Juni 2026 → kas_entries + warga + iuran (Peta Lingkungan)
-- Idempotent: hapus batch [SEED JUN26] lalu insert ulang
-- Target saldo akhir: Rp 12.773.817
-- Cara jalankan: Supabase → SQL Editor → paste file ini → Run

DELETE FROM kas_entries WHERE description LIKE '[SEED JUN26]%';

INSERT INTO kas_entries (type, amount, description, category, date) VALUES
  ('pemasukan', 2950000, '[SEED JUN26] Saldo Awal — Migrasi iuran wajib dari Bendahara RT', 'Saldo Awal', '2026-06-01'),
  ('pemasukan', 500000, '[SEED JUN26] Widuri (NHT-2/11) Jun 2026 to Mar 2027', 'Iuran', '2026-06-01'),
  ('pemasukan', 100000, '[SEED JUN26] Heni Purnama (NHT-8/12) Jun 2026 to Jul 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Umi Zahra S (NHT-1/20) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Anisa Sulistia (NHB-8/30) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Vidora Sapta (NHT-3/50) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Firly Angga (NHT-8/33) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 100000, '[SEED JUN26] Ayu Trihandayani (NHT-1/11) Jun 2026 to Jul 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 600000, '[SEED JUN26] Philander / Mami Meda (NHT-3/5) Jun 2026 to May 2027', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Anna / Haris (NHT-3/32) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 50000, '[SEED JUN26] Renny Saraswati (NHT-7/6) Jun 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 350000, '[SEED JUN26] Dok Yessi / Pak Dani (NHT-6/5) Jun 2026 to Dec 2026', 'Iuran', '2026-06-01'),
  ('pemasukan', 200000, '[SEED JUN26] Sylvia D (NHT-2/30) Jun 2026 to Sep 2026', 'Iuran', '2026-06-02'),
  ('pemasukan', 350000, '[SEED JUN26] Herdianita / Andi (NHT-1/10) Jun 2026 to Dec 2026', 'Iuran', '2026-06-02'),
  ('pemasukan', 950000, '[SEED JUN26] Rifianty Fitrianis (NHT-6/8) Jun 2026 to Dec 2027', 'Iuran', '2026-06-02'),
  ('pemasukan', 350000, '[SEED JUN26] Chairunnisa R / Icha (NHT-3/28) Jun 2026 to Dec 2026', 'Iuran', '2026-06-03'),
  ('pemasukan', 50000, '[SEED JUN26] Rosiyela There (NHT-2/12) Jun 2026', 'Iuran', '2026-06-04'),
  ('pemasukan', 100000, '[SEED JUN26] Difia Setyo (NHT-1/16) Jun 2026 to Jul 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 350000, '[SEED JUN26] Puji A / Dian F (NHT-3/20) Jun 2026 to Dec 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 150000, '[SEED JUN26] Lia Octavia / Sony (NHT-8/52) Jun 2026 to Aug 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 100000, '[SEED JUN26] Merika Dwi P (NHT-2/7) Jun 2026 to Jul 2026', 'Iuran', '2026-06-09'),
  ('pemasukan', 250000, '[SEED JUN26] Dian / Bambang (NHT-6/10) Aug 2026 to Dec 2026', 'Iuran', '2026-06-11'),
  ('pemasukan', 350000, '[SEED JUN26] Kartika Ramadhanty (NHT-3/16) Jun 2026 to Dec 2026', 'Iuran', '2026-06-11'),
  ('pemasukan', 100000, '[SEED JUN26] Sri Suryani (NHT-8/36) Jun 2026 to Jul 2026', 'Iuran', '2026-06-16'),
  ('pemasukan', 300000, '[SEED JUN26] Widya Karim (NHT-3/7) Jun 2026 to Nov 2026', 'Iuran', '2026-06-16'),
  ('pemasukan', 100000, '[SEED JUN26] Rizky Ayu (NHT-2/6) Jun 2026 to Jul 2026', 'Iuran', '2026-06-19'),
  ('pemasukan', 100000, '[SEED JUN26] Rizma U (NHT-2/9) Jun 2026 to Jul 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 50000, '[SEED JUN26] Uty Dewi (NHT-6/17) Jun 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 50000, '[SEED JUN26] Mira / Rio (NHT-1/18) Jun 2026', 'Iuran', '2026-06-26'),
  ('pemasukan', 100000, '[SEED JUN26] Prida (NHT-3/6) Jun 2026 to Jul 2026', 'Iuran', '2026-06-28'),
  ('pemasukan', 600000, '[SEED JUN26] Putri (NHT-8/28) Jun 2026 to May 2027', 'Iuran', '2026-06-28'),
  ('pemasukan', 1806817, '[SEED JUN26] Mutasi saldo dana Dansos ke Rek. Nahara', 'Lainnya', '2026-06-29'),
  ('pengeluaran', 20000, '[SEED JUN26] Biaya ganti kartu ATM Nahara', 'Operasional', '2026-06-29'),
  ('pengeluaran', 13000, '[SEED JUN26] Biaya Administrasi Rekening', 'Operasional', '2026-06-30');

-- Warga dari pembayaran (upsert by blok)
INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Widuri', 'NHT-2/11', 'NHT-2', 11, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/11');
UPDATE warga SET nama = 'Widuri', blok_row = 'NHT-2', nomor_kavling = 11, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/11';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Heni Purnama', 'NHT-8/12', 'NHT-8', 12, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/12');
UPDATE warga SET nama = 'Heni Purnama', blok_row = 'NHT-8', nomor_kavling = 12, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-8/12';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Umi Zahra S', 'NHT-1/20', 'NHT-1', 20, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/20');
UPDATE warga SET nama = 'Umi Zahra S', blok_row = 'NHT-1', nomor_kavling = 20, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-1/20';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Anisa Sulistia', 'NHB-8/30', 'NHB-8', 30, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHB-8/30');
UPDATE warga SET nama = 'Anisa Sulistia', blok_row = 'NHB-8', nomor_kavling = 30, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHB-8/30';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Vidora Sapta', 'NHT-3/50', 'NHT-3', 50, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/50');
UPDATE warga SET nama = 'Vidora Sapta', blok_row = 'NHT-3', nomor_kavling = 50, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/50';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Firly Angga', 'NHT-8/33', 'NHT-8', 33, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/33');
UPDATE warga SET nama = 'Firly Angga', blok_row = 'NHT-8', nomor_kavling = 33, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-8/33';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Ayu Trihandayani', 'NHT-1/11', 'NHT-1', 11, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/11');
UPDATE warga SET nama = 'Ayu Trihandayani', blok_row = 'NHT-1', nomor_kavling = 11, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-1/11';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Philander / Mami Meda', 'NHT-3/5', 'NHT-3', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/5');
UPDATE warga SET nama = 'Philander / Mami Meda', blok_row = 'NHT-3', nomor_kavling = 5, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Anna / Haris', 'NHT-3/32', 'NHT-3', 32, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/32');
UPDATE warga SET nama = 'Anna / Haris', blok_row = 'NHT-3', nomor_kavling = 32, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/32';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Renny Saraswati', 'NHT-7/6', 'NHT-7', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/6');
UPDATE warga SET nama = 'Renny Saraswati', blok_row = 'NHT-7', nomor_kavling = 6, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-7/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Dok Yessi / Pak Dani', 'NHT-6/5', 'NHT-6', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/5');
UPDATE warga SET nama = 'Dok Yessi / Pak Dani', blok_row = 'NHT-6', nomor_kavling = 5, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-6/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Sylvia D', 'NHT-2/30', 'NHT-2', 30, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/30');
UPDATE warga SET nama = 'Sylvia D', blok_row = 'NHT-2', nomor_kavling = 30, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/30';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Herdianita / Andi', 'NHT-1/10', 'NHT-1', 10, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/10');
UPDATE warga SET nama = 'Herdianita / Andi', blok_row = 'NHT-1', nomor_kavling = 10, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-1/10';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rifianty Fitrianis', 'NHT-6/8', 'NHT-6', 8, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/8');
UPDATE warga SET nama = 'Rifianty Fitrianis', blok_row = 'NHT-6', nomor_kavling = 8, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-6/8';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Chairunnisa R / Icha', 'NHT-3/28', 'NHT-3', 28, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/28');
UPDATE warga SET nama = 'Chairunnisa R / Icha', blok_row = 'NHT-3', nomor_kavling = 28, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/28';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rosiyela There', 'NHT-2/12', 'NHT-2', 12, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/12');
UPDATE warga SET nama = 'Rosiyela There', blok_row = 'NHT-2', nomor_kavling = 12, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/12';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Difia Setyo', 'NHT-1/16', 'NHT-1', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/16');
UPDATE warga SET nama = 'Difia Setyo', blok_row = 'NHT-1', nomor_kavling = 16, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-1/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Puji A / Dian F', 'NHT-3/20', 'NHT-3', 20, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/20');
UPDATE warga SET nama = 'Puji A / Dian F', blok_row = 'NHT-3', nomor_kavling = 20, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/20';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Lia Octavia / Sony', 'NHT-8/52', 'NHT-8', 52, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/52');
UPDATE warga SET nama = 'Lia Octavia / Sony', blok_row = 'NHT-8', nomor_kavling = 52, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-8/52';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Merika Dwi P', 'NHT-2/7', 'NHT-2', 7, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/7');
UPDATE warga SET nama = 'Merika Dwi P', blok_row = 'NHT-2', nomor_kavling = 7, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/7';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Dian / Bambang', 'NHT-6/10', 'NHT-6', 10, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/10');
UPDATE warga SET nama = 'Dian / Bambang', blok_row = 'NHT-6', nomor_kavling = 10, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-6/10';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Kartika Ramadhanty', 'NHT-3/16', 'NHT-3', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/16');
UPDATE warga SET nama = 'Kartika Ramadhanty', blok_row = 'NHT-3', nomor_kavling = 16, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Sri Suryani', 'NHT-8/36', 'NHT-8', 36, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/36');
UPDATE warga SET nama = 'Sri Suryani', blok_row = 'NHT-8', nomor_kavling = 36, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-8/36';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Widya Karim', 'NHT-3/7', 'NHT-3', 7, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/7');
UPDATE warga SET nama = 'Widya Karim', blok_row = 'NHT-3', nomor_kavling = 7, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/7';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rizky Ayu', 'NHT-2/6', 'NHT-2', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/6');
UPDATE warga SET nama = 'Rizky Ayu', blok_row = 'NHT-2', nomor_kavling = 6, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rizma U', 'NHT-2/9', 'NHT-2', 9, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/9');
UPDATE warga SET nama = 'Rizma U', blok_row = 'NHT-2', nomor_kavling = 9, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-2/9';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Uty Dewi', 'NHT-6/17', 'NHT-6', 17, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/17');
UPDATE warga SET nama = 'Uty Dewi', blok_row = 'NHT-6', nomor_kavling = 17, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-6/17';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Mira / Rio', 'NHT-1/18', 'NHT-1', 18, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/18');
UPDATE warga SET nama = 'Mira / Rio', blok_row = 'NHT-1', nomor_kavling = 18, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-1/18';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Prida', 'NHT-3/6', 'NHT-3', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/6');
UPDATE warga SET nama = 'Prida', blok_row = 'NHT-3', nomor_kavling = 6, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-3/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Putri', 'NHT-8/28', 'NHT-8', 28, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/28');
UPDATE warga SET nama = 'Putri', blok_row = 'NHT-8', nomor_kavling = 28, status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END WHERE blok = 'NHT-8/28';

INSERT INTO iuran (warga_id, bulan, nominal, status, paid_at)
SELECT w.id, v.bulan::date, 50000, true, v.paid_at::timestamptz
FROM (VALUES
  ('NHT-2/11', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2027-01-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2027-02-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/11', '2027-03-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/12', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/12', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/11', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/11', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2027-01-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2027-02-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2027-03-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2027-04-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/5', '2027-05-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-7/6', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-2/30', '2026-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-10-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-11-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-12-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-10-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-11-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2026-12-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-01-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-02-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-03-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-04-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-05-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-10-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-11-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-6/8', '2027-12-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-3/28', '2026-06-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-07-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-08-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-09-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-10-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-11-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-12-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-2/12', '2026-06-01', '2026-06-04T00:00:00+07:00'),
  ('NHT-1/16', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-1/16', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-08-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-09-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-10-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-11-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-12-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-8/52', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-8/52', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-8/52', '2026-08-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-2/7', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-2/7', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-6/10', '2026-08-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-09-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-10-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-11-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-12-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-06-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-07-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-08-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-09-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-10-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-11-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-12-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-8/36', '2026-06-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-8/36', '2026-07-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-06-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-07-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-08-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-09-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-10-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-11-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-2/6', '2026-06-01', '2026-06-19T00:00:00+07:00'),
  ('NHT-2/6', '2026-07-01', '2026-06-19T00:00:00+07:00'),
  ('NHT-2/9', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-2/9', '2026-07-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-6/17', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-1/18', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-3/6', '2026-06-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-3/6', '2026-07-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-06-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-07-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-08-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-09-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-10-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-11-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2026-12-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2027-01-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2027-02-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2027-03-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2027-04-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/28', '2027-05-01', '2026-06-28T00:00:00+07:00')
) AS v(blok, bulan, paid_at)
JOIN warga w ON w.blok = v.blok
ON CONFLICT (warga_id, bulan) DO UPDATE SET
  status = true,
  nominal = EXCLUDED.nominal,
  paid_at = EXCLUDED.paid_at;

-- Cek: pemasukan 12.806.817 | pengeluaran 33.000 | saldo 12.773.817
-- SELECT type, SUM(amount) FROM kas_entries WHERE description LIKE '[SEED JUN26]%' GROUP BY 1;