"use client";

import { useParams } from "next/navigation";
import { AgustusanRecap } from "@/components/agustusan/AgustusanRecap";

export default function KenanganPage() {
  const params = useParams();
  const year = Number(params.year);
  return <AgustusanRecap year={year} />;
}
