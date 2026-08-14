"use client";

import { useParams } from "next/navigation";
import { MalamPuncakOperator } from "@/components/agustusan/MalamPuncakOperator";

export default function MalamPuncakOperatorPage() {
  const params = useParams();
  const year = Number(params.year);
  return <MalamPuncakOperator year={year} />;
}
