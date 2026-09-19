const SECTION_MARKERS = [
  "Pelaksanaan kegiatan:",
  "Realisasi pengeluaran konsumsi:",
  "Total pengeluaran konsumsi:",
];

function formatDescription(value: string): string[] {
  let formatted = value.replace(/\r\n/g, "\n").trim();

  // Konten yang ditempel dari WhatsApp sering kehilangan baris baru. Pulihkan
  // struktur umum tanpa mengubah teks yang disimpan di database.
  const breakBefore = [
    "Pelaksanaan kegiatan:",
    "📅",
    "⏰",
    "📍",
    "Dalam kegiatan ini,",
    "Realisasi pengeluaran konsumsi:",
    "Total pengeluaran konsumsi:",
    "Seluruh biaya konsumsi",
    "Terima kasih kepada",
    "Semoga kegiatan ini",
    "Warga Bersatu,",
  ];

  for (const marker of breakBefore) {
    formatted = formatted.replaceAll(marker, `\n${marker}`);
  }
  formatted = formatted
    .replace(/\s+(1\.\s+)/g, "\n$1")
    .replace(/\s+(2\.\s+)/g, "\n$1")
    .replace(/\n{2,}/g, "\n");

  return formatted.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function ActivityDescription({ description }: { description: string }) {
  const lines = formatDescription(description);

  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-slate-900">Tentang Kegiatan</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-slate-600">
        {lines.map((line, index) => {
          const isHeading = SECTION_MARKERS.some((marker) => line.startsWith(marker));
          const isExpense = /^\d+\.\s/.test(line);
          const isMeta = ["📅", "⏰", "📍"].some((marker) => line.startsWith(marker));
          const isTotal = line.startsWith("Total pengeluaran konsumsi:");

          if (isHeading) {
            return (
              <h3
                key={`${line}-${index}`}
                className={`pt-2 font-semibold ${isTotal ? "text-gold-dark" : "text-slate-900"}`}
              >
                {line}
              </h3>
            );
          }
          if (isExpense) {
            return (
              <p key={`${line}-${index}`} className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                {line}
              </p>
            );
          }
          if (isMeta) {
            return <p key={`${line}-${index}`} className="font-medium text-slate-700">{line}</p>;
          }
          return <p key={`${line}-${index}`}>{line}</p>;
        })}
      </div>
    </section>
  );
}
