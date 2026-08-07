"use client";

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

type Props = {
  /** YYYY-MM */
  value: string;
  onChange: (yearMonth: string) => void;
  /** Inclusive year range; defaults around selected/current year */
  years?: number[];
  className?: string;
};

function defaultYears(selectedYear: number): number[] {
  const now = new Date().getFullYear();
  const min = Math.min(now - 1, selectedYear);
  const max = Math.max(now + 2, selectedYear);
  const list: number[] = [];
  for (let y = min; y <= max; y++) list.push(y);
  return list;
}

export function MonthYearSelect({ value, onChange, years, className = "" }: Props) {
  const [yStr, mStr] = value.split("-");
  const year = Number(yStr) || new Date().getFullYear();
  const month = Number(mStr) || 1;
  const yearOptions = years ?? defaultYears(year);

  function emit(nextYear: number, nextMonth: number) {
    onChange(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label className="sr-only" htmlFor="iuran-bulan">
        Bulan
      </label>
      <select
        id="iuran-bulan"
        className="input w-auto min-w-[9.5rem]"
        value={month}
        onChange={(e) => emit(year, Number(e.target.value))}
      >
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="iuran-tahun">
        Tahun
      </label>
      <select
        id="iuran-tahun"
        className="input w-auto min-w-[6.5rem]"
        value={year}
        onChange={(e) => emit(Number(e.target.value), month)}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
