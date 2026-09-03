import { AgustusanLpjPage } from "@/components/agustusan/AgustusanLpjPage";

export default function AgustusanPortalLpjRoute({
  params,
}: {
  params: { year: string };
}) {
  const year = Number(params.year);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#f4f1ec] lg:-mx-6 lg:-my-8">
      <AgustusanLpjPage
        year={year}
        backHref={`/kegiatan/agustusan/${year}`}
        backLabel="Halaman Agustusan"
      />
    </div>
  );
}
