"use client";

import { useParams } from "next/navigation";
import { AgustusanMasukanPage } from "@/components/agustusan/AgustusanMasukanPage";

export default function AgustusanPortalMasukanRoute() {
  const params = useParams();
  const year = Number(params.year);

  return (
    <AgustusanMasukanPage
      year={year}
      backHref={`/kegiatan/agustusan/${year}`}
      backLabel="Halaman Agustusan"
      formSource="share"
    />
  );
}
