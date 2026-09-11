import { AllServicesGrid } from "@/components/dashboard/AllServicesGrid";

export default function LayananPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
          Portal Warga
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
          Semua Layanan
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Akses seluruh modul Nahara. Pengelompokan hanya untuk memudahkan
          pencarian — setiap layanan tetap mandiri.
        </p>
      </header>

      <AllServicesGrid showTitle={false} showBrowseLink={false} />
    </div>
  );
}
