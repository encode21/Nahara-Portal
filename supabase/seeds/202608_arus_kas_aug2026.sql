-- Seed arus kas Agustus 2026 + sync iuran dari List 2026/2027/2028
-- Sumber: https://docs.google.com/spreadsheets/d/1ok91xT6Of19tUNgodXNjYdEFNSc-SNxJ
-- Idempotent kas: hapus batch [SEED AUG26]; iuran di-upsert (tidak hapus history lain)
-- Prasyarat: seed Jun+Jul sudah jalan; Jul saldo akhir = 14.328.817
-- Catatan: Subsidi HUT RI 7.000.000 SUDAH ada sebagai Kas→Donasi (7 Aug) — tidak di-seed ulang
-- Target saldo akhir: Rp 10.514.761

BEGIN;

DELETE FROM kas_entries WHERE description LIKE '[SEED AUG26]%';

INSERT INTO kas_entries (type, amount, description, category, date) VALUES
  ('pengeluaran', 5500, '[SEED AUG26] Biaya administrasi kartu debit', 'Operasional', '2026-08-02'),
  ('pengeluaran', 498833, '[SEED AUG26] Pembelian domain Server Nahara', 'Operasional', '2026-08-07'),
  ('pemasukan', 100000, '[SEED AUG26] Meryka Dwi P (NHT-2/7) Aug 2026 to Sep 2026', 'Iuran', '2026-08-09'),
  ('pemasukan', 200000, '[SEED AUG26] Tiarma Arine / Hafiz Arya (NHT-7/1) Jun 2026 to Sep 2026', 'Iuran', '2026-08-10'),
  ('pemasukan', 150000, '[SEED AUG26] Deta / Andreas (NHT-7/28) Jun 2026 to Aug 2026', 'Iuran', '2026-08-18'),
  ('pemasukan', 100000, '[SEED AUG26] Asmawati (NHT-2/15) Aug 2026 to Sep 2026', 'Iuran', '2026-08-20'),
  ('pemasukan', 50000, '[SEED AUG26] Rosiyela Theresilia (NHT-2/12) Aug 2026', 'Iuran', '2026-08-20'),
  ('pemasukan', 100000, '[SEED AUG26] Rizky Ayu (NHT-2/6) Aug 2026 to Sept 2026', 'Iuran', '2026-08-23'),
  ('pengeluaran', 352917, '[SEED AUG26] Parcel buah untuk ananda Pangga anak Mba Rizky Ayu', 'Lainnya', '2026-08-25'),
  ('pemasukan', 3958694, '[SEED AUG26] Saldo sisa Acara HUT RI NAHARA 2026', 'Lainnya', '2026-08-31'),
  ('pengeluaran', 602500, '[SEED AUG26] Karangan bunga duka cita untuk pak feri dan mba yani', 'Lainnya', '2026-08-31'),
  ('pengeluaran', 13000, '[SEED AUG26] Biaya administrasi rekening', 'Operasional', '2026-08-31');

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Anisa Sulistia', 'NHB-8/30', 'NHB-8', 30, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHB-8/30');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Anisa Sulistia' ELSE nama END,
  blok_row = 'NHB-8', nomor_kavling = 30,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHB-8/30';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Herdianita / Andi', 'NHT-1/10', 'NHT-1', 10, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/10');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Herdianita / Andi' ELSE nama END,
  blok_row = 'NHT-1', nomor_kavling = 10,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-1/10';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Ayu Trihandayani', 'NHT-1/11', 'NHT-1', 11, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/11');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Ayu Trihandayani' ELSE nama END,
  blok_row = 'NHT-1', nomor_kavling = 11,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-1/11';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Difia Setyo / Fia', 'NHT-1/16', 'NHT-1', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/16');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Difia Setyo / Fia' ELSE nama END,
  blok_row = 'NHT-1', nomor_kavling = 16,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-1/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Mira / Rio', 'NHT-1/18', 'NHT-1', 18, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/18');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Mira / Rio' ELSE nama END,
  blok_row = 'NHT-1', nomor_kavling = 18,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-1/18';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Umi Zahra S', 'NHT-1/20', 'NHT-1', 20, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-1/20');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Umi Zahra S' ELSE nama END,
  blok_row = 'NHT-1', nomor_kavling = 20,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-1/20';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Widuri / Andri', 'NHT-2/11', 'NHT-2', 11, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/11');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Widuri / Andri' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 11,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/11';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rosiyela Theresilia', 'NHT-2/12', 'NHT-2', 12, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/12');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Rosiyela Theresilia' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 12,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/12';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Asmawati', 'NHT-2/15', 'NHT-2', 15, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/15');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Asmawati' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 15,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/15';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Kustiyanti', 'NHT-2/19', 'NHT-2', 19, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/19');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Kustiyanti' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 19,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/19';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Alfian / Della', 'NHT-2/20', 'NHT-2', 20, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/20');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Alfian / Della' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 20,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/20';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Sylvia D', 'NHT-2/30', 'NHT-2', 30, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/30');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Sylvia D' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 30,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/30';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Siti Fadlia', 'NHT-2/5', 'NHT-2', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/5');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Siti Fadlia' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 5,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rizki Ayu / Kiki', 'NHT-2/6', 'NHT-2', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/6');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Rizki Ayu / Kiki' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 6,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Meryka Dwi P', 'NHT-2/7', 'NHT-2', 7, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/7');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Meryka Dwi P' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 7,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/7';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Nurleli Novida / Muklis', 'NHT-2/8', 'NHT-2', 8, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/8');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Nurleli Novida / Muklis' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 8,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/8';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rizma / Fadillah', 'NHT-2/9', 'NHT-2', 9, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-2/9');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Rizma / Fadillah' ELSE nama END,
  blok_row = 'NHT-2', nomor_kavling = 9,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-2/9';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Nina', 'NHT-3/10', 'NHT-3', 10, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/10');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Nina' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 10,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/10';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Kartika Ramadhanty', 'NHT-3/16', 'NHT-3', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/16');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Kartika Ramadhanty' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 16,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Iyas', 'NHT-3/19', 'NHT-3', 19, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/19');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Iyas' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 19,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/19';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Puji / Dian', 'NHT-3/20', 'NHT-3', 20, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/20');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Puji / Dian' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 20,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/20';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Chairunnisa R / Icha', 'NHT-3/28', 'NHT-3', 28, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/28');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Chairunnisa R / Icha' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 28,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/28';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Anna / Haris', 'NHT-3/32', 'NHT-3', 32, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/32');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Anna / Haris' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 32,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/32';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Philander / Mami Meda', 'NHT-3/5', 'NHT-3', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/5');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Philander / Mami Meda' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 5,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Vidora Sapta', 'NHT-3/50', 'NHT-3', 50, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/50');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Vidora Sapta' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 50,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/50';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Prida', 'NHT-3/6', 'NHT-3', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/6');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Prida' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 6,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Widya Karim', 'NHT-3/7', 'NHT-3', 7, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-3/7');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Widya Karim' ELSE nama END,
  blok_row = 'NHT-3', nomor_kavling = 7,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-3/7';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Dian P', 'NHT-6/10', 'NHT-6', 10, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/10');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Dian P' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 10,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/10';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Ririn', 'NHT-6/12', 'NHT-6', 12, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/12');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Ririn' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 12,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/12';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Uty Dewi', 'NHT-6/17', 'NHT-6', 17, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/17');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Uty Dewi' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 17,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/17';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Keni. R', 'NHT-6/18', 'NHT-6', 18, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/18');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Keni. R' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 18,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/18';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Yessi / Dani', 'NHT-6/5', 'NHT-6', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/5');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Yessi / Dani' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 5,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Arie Pujihastuti', 'NHT-6/7', 'NHT-6', 7, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/7');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Arie Pujihastuti' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 7,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/7';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rifianty Fitrianis', 'NHT-6/8', 'NHT-6', 8, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-6/8');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Rifianty Fitrianis' ELSE nama END,
  blok_row = 'NHT-6', nomor_kavling = 8,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-6/8';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Tiarma Arine / Hafiz Arya', 'NHT-7/1', 'NHT-7', 1, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/1');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Tiarma Arine / Hafiz Arya' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 1,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/1';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Renny Saraswati', 'NHT-7/16', 'NHT-7', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/16');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Renny Saraswati' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 16,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Laila. F', 'NHT-7/22', 'NHT-7', 22, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/22');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Laila. F' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 22,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/22';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Deta / Andreas', 'NHT-7/28', 'NHT-7', 28, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/28');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Deta / Andreas' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 28,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/28';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Ritawati', 'NHT-7/6', 'NHT-7', 6, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/6');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Ritawati' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 6,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/6';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Terry. T', 'NHT-7/9', 'NHT-7', 9, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-7/9');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Terry. T' ELSE nama END,
  blok_row = 'NHT-7', nomor_kavling = 9,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-7/9';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Heni Purnama', 'NHT-8/12', 'NHT-8', 12, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/12');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Heni Purnama' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 12,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/12';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Idha Abralia / Ayu', 'NHT-8/15', 'NHT-8', 15, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/15');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Idha Abralia / Ayu' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 15,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/15';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Rizki / Catur', 'NHT-8/16', 'NHT-8', 16, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/16');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Rizki / Catur' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 16,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/16';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Eny / Wahyu Arif', 'NHT-8/21', 'NHT-8', 21, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/21');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Eny / Wahyu Arif' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 21,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/21';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Tika / Yusuf', 'NHT-8/27', 'NHT-8', 27, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/27');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Tika / Yusuf' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 27,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/27';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Putri', 'NHT-8/28', 'NHT-8', 28, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/28');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Putri' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 28,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/28';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Firly Angga', 'NHT-8/33', 'NHT-8', 33, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/33');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Firly Angga' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 33,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/33';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Zara Nani', 'NHT-8/35', 'NHT-8', 35, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/35');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Zara Nani' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 35,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/35';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Sri Suryani', 'NHT-8/36', 'NHT-8', 36, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/36');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Sri Suryani' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 36,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/36';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Farah', 'NHT-8/5', 'NHT-8', 5, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/5');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Farah' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 5,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/5';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Ericka Sanjaya / Robert', 'NHT-8/50', 'NHT-8', 50, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/50');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Ericka Sanjaya / Robert' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 50,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/50';

INSERT INTO warga (nama, blok, blok_row, nomor_kavling, status_hunian)
SELECT 'Lia Octavia / Sony', 'NHT-8/52', 'NHT-8', 52, 'Tetap'
WHERE NOT EXISTS (SELECT 1 FROM warga WHERE blok = 'NHT-8/52');
UPDATE warga SET
  nama = CASE WHEN nama IS NULL OR btrim(nama) = '' OR nama = blok THEN 'Lia Octavia / Sony' ELSE nama END,
  blok_row = 'NHT-8', nomor_kavling = 52,
  status_hunian = CASE WHEN status_hunian = 'Kosong' THEN 'Tetap' ELSE status_hunian END
WHERE blok = 'NHT-8/52';

INSERT INTO iuran (warga_id, bulan, nominal, status, paid_at)
SELECT w.id, v.bulan::date, 50000, true, v.paid_at::timestamptz
FROM (VALUES
  ('NHB-8/30', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHB-8/30', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/10', '2026-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-10-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-11-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/10', '2026-12-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-1/11', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/11', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/16', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-1/16', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-1/18', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-1/18', '2026-07-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-1/18', '2026-08-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-1/20', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-1/20', '2026-12-01', '2026-06-01T00:00:00+07:00'),
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
  ('NHT-2/12', '2026-06-01', '2026-06-04T00:00:00+07:00'),
  ('NHT-2/12', '2026-07-01', '2026-07-03T00:00:00+07:00'),
  ('NHT-2/12', '2026-08-01', '2026-08-20T00:00:00+07:00'),
  ('NHT-2/15', '2026-06-01', '2026-05-04T00:00:00+07:00'),
  ('NHT-2/15', '2026-07-01', '2026-05-04T00:00:00+07:00'),
  ('NHT-2/15', '2026-08-01', '2026-08-20T00:00:00+07:00'),
  ('NHT-2/15', '2026-09-01', '2026-08-20T00:00:00+07:00'),
  ('NHT-2/19', '2026-06-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-07-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-08-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-09-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-10-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-11-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/19', '2026-12-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-2/20', '2026-06-01', '2026-01-06T00:00:00+07:00'),
  ('NHT-2/20', '2026-07-01', '2026-01-06T00:00:00+07:00'),
  ('NHT-2/20', '2026-08-01', '2026-07-28T00:00:00+07:00'),
  ('NHT-2/20', '2026-09-01', '2026-07-28T00:00:00+07:00'),
  ('NHT-2/20', '2026-10-01', '2026-07-28T00:00:00+07:00'),
  ('NHT-2/20', '2026-11-01', '2026-07-28T00:00:00+07:00'),
  ('NHT-2/20', '2026-12-01', '2026-07-28T00:00:00+07:00'),
  ('NHT-2/30', '2026-06-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-07-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-08-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/30', '2026-09-01', '2026-06-02T00:00:00+07:00'),
  ('NHT-2/5', '2026-06-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-07-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-08-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-09-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-10-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-11-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/5', '2026-12-01', '2026-07-29T00:00:00+07:00'),
  ('NHT-2/6', '2026-06-01', '2026-06-19T00:00:00+07:00'),
  ('NHT-2/6', '2026-07-01', '2026-06-19T00:00:00+07:00'),
  ('NHT-2/6', '2026-08-01', '2026-08-23T00:00:00+07:00'),
  ('NHT-2/6', '2026-09-01', '2026-08-23T00:00:00+07:00'),
  ('NHT-2/7', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-2/7', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-2/7', '2026-08-01', '2026-08-09T00:00:00+07:00'),
  ('NHT-2/7', '2026-09-01', '2026-08-09T00:00:00+07:00'),
  ('NHT-2/8', '2026-06-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-2/8', '2026-07-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-2/8', '2026-08-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-2/8', '2026-09-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-2/9', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-2/9', '2026-07-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-3/10', '2026-06-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-3/10', '2026-07-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-3/10', '2026-08-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-3/10', '2026-09-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-3/16', '2026-06-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-07-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-08-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-09-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-10-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-11-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/16', '2026-12-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-3/19', '2026-06-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-3/19', '2026-07-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-3/20', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-08-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-09-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-10-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-11-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/20', '2026-12-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-3/28', '2026-06-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-07-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-08-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-09-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-10-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-11-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/28', '2026-12-01', '2026-06-03T00:00:00+07:00'),
  ('NHT-3/32', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/32', '2026-12-01', '2026-06-01T00:00:00+07:00'),
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
  ('NHT-3/50', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/50', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-3/6', '2026-06-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-3/6', '2026-07-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-3/7', '2026-06-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-07-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-08-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-09-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-10-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-11-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-3/7', '2026-12-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-3/7', '2027-01-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/10', '2026-06-01', '2026-01-23T00:00:00+07:00'),
  ('NHT-6/10', '2026-07-01', '2026-01-23T00:00:00+07:00'),
  ('NHT-6/10', '2026-08-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-09-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-10-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-11-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/10', '2026-12-01', '2026-06-11T00:00:00+07:00'),
  ('NHT-6/12', '2026-06-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/12', '2026-07-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/12', '2026-08-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/17', '2026-06-01', '2026-06-26T00:00:00+07:00'),
  ('NHT-6/17', '2026-07-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-6/17', '2026-08-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-6/18', '2026-06-01', '2025-07-29T00:00:00+07:00'),
  ('NHT-6/18', '2026-07-01', '2025-07-29T00:00:00+07:00'),
  ('NHT-6/5', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/5', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-6/7', '2026-06-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-07-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-08-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-09-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-10-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-11-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2026-12-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-01-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-02-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-03-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-04-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-05-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-06-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-07-01', '2026-07-22T00:00:00+07:00'),
  ('NHT-6/7', '2027-08-01', '2026-07-22T00:00:00+07:00'),
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
  ('NHT-6/8', '2028-01-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-02-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-03-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-04-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-05-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-06-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-07-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-08-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-6/8', '2028-09-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-7/1', '2026-06-01', '2026-08-10T00:00:00+07:00'),
  ('NHT-7/1', '2026-07-01', '2026-08-10T00:00:00+07:00'),
  ('NHT-7/1', '2026-08-01', '2026-08-10T00:00:00+07:00'),
  ('NHT-7/1', '2026-09-01', '2026-08-10T00:00:00+07:00'),
  ('NHT-7/16', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-7/16', '2026-07-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-7/16', '2026-08-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-7/22', '2026-06-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-07-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-08-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-09-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-10-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-11-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2026-12-01', '2026-01-12T00:00:00+07:00'),
  ('NHT-7/22', '2027-01-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-7/22', '2027-02-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-7/28', '2026-06-01', '2026-08-18T00:00:00+07:00'),
  ('NHT-7/28', '2026-07-01', '2026-08-18T00:00:00+07:00'),
  ('NHT-7/28', '2026-08-01', '2026-08-18T00:00:00+07:00'),
  ('NHT-7/6', '2026-06-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-07-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-08-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-09-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-10-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-11-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2026-12-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2027-01-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/6', '2027-02-01', '2026-03-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-06-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-07-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-08-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-09-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-10-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-11-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2026-12-01', '2025-12-06T00:00:00+07:00'),
  ('NHT-7/9', '2027-01-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-7/9', '2027-02-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/12', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/12', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/15', '2026-06-01', '2025-11-30T00:00:00+07:00'),
  ('NHT-8/15', '2026-07-01', '2025-11-30T00:00:00+07:00'),
  ('NHT-8/15', '2026-08-01', '2025-11-30T00:00:00+07:00'),
  ('NHT-8/15', '2026-09-01', '2025-11-30T00:00:00+07:00'),
  ('NHT-8/15', '2026-10-01', '2025-11-30T00:00:00+07:00'),
  ('NHT-8/15', '2026-11-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/15', '2026-12-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/16', '2026-06-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-07-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-08-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-09-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-10-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-11-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2026-12-01', '2026-01-21T00:00:00+07:00'),
  ('NHT-8/16', '2027-01-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/16', '2027-02-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/16', '2027-03-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/21', '2026-06-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-8/21', '2026-07-01', '2026-07-11T00:00:00+07:00'),
  ('NHT-8/27', '2026-06-01', '2026-07-10T00:00:00+07:00'),
  ('NHT-8/27', '2026-07-01', '2026-07-10T00:00:00+07:00'),
  ('NHT-8/27', '2026-08-01', '2026-07-10T00:00:00+07:00'),
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
  ('NHT-8/28', '2027-05-01', '2026-06-28T00:00:00+07:00'),
  ('NHT-8/33', '2026-06-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-07-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-08-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-09-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-10-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-11-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/33', '2026-12-01', '2026-06-01T00:00:00+07:00'),
  ('NHT-8/35', '2026-06-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-8/35', '2026-07-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-8/35', '2026-08-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-8/35', '2026-09-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-8/35', '2026-10-01', '2026-07-04T00:00:00+07:00'),
  ('NHT-8/36', '2026-06-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-8/36', '2026-07-01', '2026-06-16T00:00:00+07:00'),
  ('NHT-8/5', '2026-06-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/5', '2026-07-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/5', '2026-08-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/5', '2026-09-01', '2026-06-29T00:00:00+07:00'),
  ('NHT-8/50', '2026-06-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-07-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-08-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-09-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-10-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-11-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/50', '2026-12-01', '2026-02-10T00:00:00+07:00'),
  ('NHT-8/52', '2026-06-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-8/52', '2026-07-01', '2026-06-09T00:00:00+07:00'),
  ('NHT-8/52', '2026-08-01', '2026-06-09T00:00:00+07:00')
) AS v(blok, bulan, paid_at)
JOIN warga w ON w.blok = v.blok
ON CONFLICT (warga_id, bulan) DO UPDATE SET
  status = true,
  nominal = EXCLUDED.nominal,
  paid_at = COALESCE(iuran.paid_at, EXCLUDED.paid_at);

COMMIT;

-- Cek kas Aug seed: masuk 4.658.694 | keluar 1.472.750 | net 3.185.944
-- Subsidi 7.000.000 already in DB as Kas→Donasi (not in this batch)
-- SELECT SUM(CASE WHEN type='pemasukan' THEN amount ELSE -amount END) FROM kas_entries; -- expect 10514761
-- warga upserts: 52; iuran rows: 313
