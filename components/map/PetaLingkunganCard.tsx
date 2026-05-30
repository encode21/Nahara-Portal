"use client";

import { useState } from "react";
import type { WargaWithIuran } from "@/lib/types";
import PetaLingkungan from "./PetaLingkungan";
import { HouseModal } from "./HouseModal";

type PetaLingkunganCardProps = {
  wargaData: WargaWithIuran[];
};

export function PetaLingkunganCard({
  wargaData: initialData,
}: PetaLingkunganCardProps) {
  const [wargaData, setWargaData] = useState(initialData);
  const [selected, setSelected] = useState<{
    blok: string;
    warga?: WargaWithIuran;
  } | null>(null);

  function handleHouseClick(blok: string, warga?: WargaWithIuran) {
    setSelected({ blok, warga });
  }

  function handleIuranUpdated() {
    if (!selected?.warga) return;
    setWargaData((prev) =>
      prev.map((w) =>
        w.id === selected.warga!.id ? { ...w, iuran_lunas: true } : w,
      ),
    );
    setSelected((prev) =>
      prev?.warga
        ? { ...prev, warga: { ...prev.warga, iuran_lunas: true } }
        : prev,
    );
  }

  return (
    <>
      <PetaLingkungan wargaData={wargaData} onHouseClick={handleHouseClick} />
      <HouseModal
        blok={selected?.blok ?? ""}
        warga={selected?.warga}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onIuranUpdated={handleIuranUpdated}
      />
    </>
  );
}
