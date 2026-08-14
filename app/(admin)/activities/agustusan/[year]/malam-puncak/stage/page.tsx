"use client";

import { useParams } from "next/navigation";
import { MalamPuncakStage } from "@/components/agustusan/MalamPuncakStage";

export default function MalamPuncakStagePage() {
  const params = useParams();
  const year = Number(params.year);
  return <MalamPuncakStage year={year} />;
}
