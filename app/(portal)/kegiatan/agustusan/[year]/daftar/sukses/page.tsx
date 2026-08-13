"use client";

import { Suspense } from "react";
import PeakDaftarSuksesInner from "./sukses-client";
import { LoadingSpinner } from "@/components/ui/Loading";

export default function PeakDaftarSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      }
    >
      <PeakDaftarSuksesInner />
    </Suspense>
  );
}
