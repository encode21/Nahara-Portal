import { PetaLingkunganCard } from "@/components/map/PetaLingkunganCard";
export default function Page() {
  return <main style={{ maxWidth: 1050, margin: "0 auto", padding: 16 }}>
    <PetaLingkunganCard wargaData={[
      { id: "fixture-resident", nama: "Warga Uji", blok: "NHB-6/12", blok_row: "NHB-6", nomor_kavling: 12, status_hunian: "Tetap", iuran_lunas: true },
      { id: "fixture-3d", nama: "Warga 3D", blok: "NHB-6/10", blok_row: "NHB-6", nomor_kavling: 10, status_hunian: "Tetap", iuran_lunas: false },
      { id: "fixture-conflict", nama: "Warga Konflik", blok: "NHT-8/16", blok_row: "NHT-8", nomor_kavling: 16, status_hunian: "Kontrak", iuran_lunas: false },
    ]} />
  </main>;
}
