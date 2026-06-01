-- Shift dihapus: jadwal keamanan rolling, tidak per shift tetap
ALTER TABLE security_staff DROP COLUMN IF EXISTS shift;
