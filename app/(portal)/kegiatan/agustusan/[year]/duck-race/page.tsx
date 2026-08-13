"use client";

import { useParams } from "next/navigation";
import { DuckRaceStage } from "@/components/agustusan/DuckRaceStage";

export default function PublicDuckRaceTvPage() {
  const params = useParams();
  const year = Number(params.year);

  return (
    <div className="-mx-4 -mt-6 lg:-mx-6 lg:-mt-8">
      <DuckRaceStage year={year} variant="stage" />
    </div>
  );
}
