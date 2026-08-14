export const TIMEZONE_JAKARTA = "Asia/Jakarta";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_JAKARTA,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date.includes("T") ? date : `${date}T12:00:00+07:00`));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_JAKARTA,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIMEZONE_JAKARTA,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date.includes("T") ? date : `${date}T12:00:00+07:00`));
}

/** Calendar date YYYY-MM-DD in Asia/Jakarta (not UTC slice). */
export function toJakartaDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_JAKARTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatShortDate(date);
}

/** YYYY-MM-01 in local timezone (NOT UTC — avoids off-by-one in WIB) */
export function toMonthStart(year: number, monthIndex: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  return `${year}-${m}-01`;
}

export function getCurrentMonthStart(): string {
  const now = new Date();
  return toMonthStart(now.getFullYear(), now.getMonth());
}

export function getCurrentYearMonth(): string {
  return getCurrentMonthStart().slice(0, 7);
}

/** Normalize DB date/timestamptz to YYYY-MM-01 for month comparisons */
export function normalizeMonthDate(value: string | null | undefined): string {
  if (!value) return "";
  const ymd = value.slice(0, 10);
  return `${ymd.slice(0, 7)}-01`;
}

/** Kas/iuran wajib mulai Juni 2026; Mar–Mei 2026 diputihkan. */
export const IURAN_START_MONTH = "2026-06-01";

export function isIuranWaivedMonth(bulan: string): boolean {
  const m = normalizeMonthDate(bulan);
  return Boolean(m) && m < IURAN_START_MONTH;
}

export function formatMonthShort(monthDate: string): string {
  const d = new Date(`${normalizeMonthDate(monthDate).slice(0, 7)}-01T12:00:00`);
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(d);
}

export type PrepaidCoverage = {
  start: string;
  end: string;
  months: number;
  total: number;
};

/** Contiguous paid months around focusMonth (monthly rate Rp 50.000) */
export function getPrepaidCoverage(
  paidMonthDates: string[],
  focusMonth: string,
  monthlyRate = 50000,
): PrepaidCoverage | null {
  const focus = normalizeMonthDate(focusMonth);
  const set = new Set(paidMonthDates.map(normalizeMonthDate).filter(Boolean));
  if (!set.has(focus)) return null;

  const [fy, fm] = focus.split("-").map(Number);
  let startY = fy;
  let startM = fm - 1;
  while (true) {
    const prevM = startM === 0 ? 11 : startM - 1;
    const prevY = startM === 0 ? startY - 1 : startY;
    if (!set.has(toMonthStart(prevY, prevM))) break;
    startY = prevY;
    startM = prevM;
  }

  let endY = fy;
  let endM = fm - 1;
  while (true) {
    const nextM = endM === 11 ? 0 : endM + 1;
    const nextY = endM === 11 ? endY + 1 : endY;
    if (!set.has(toMonthStart(nextY, nextM))) break;
    endY = nextY;
    endM = nextM;
  }

  const start = toMonthStart(startY, startM);
  const end = toMonthStart(endY, endM);
  let months = 0;
  let y = startY;
  let m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    months++;
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return { start, end, months, total: months * monthlyRate };
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
