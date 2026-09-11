"use client";

import { useWargaIdentity } from "@/lib/hooks/useWargaIdentity";

function greetingId(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function firstName(nama: string): string {
  const part = nama.trim().split(/\s+/)[0];
  return part || nama;
}

export function DashboardGreeting() {
  const { identity, ready, change } = useWargaIdentity();
  const greet = greetingId();

  if (!ready) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-48 rounded-lg bg-sand-200" />
        <div className="h-4 w-28 rounded bg-sand-100" />
      </div>
    );
  }

  if (identity) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {greet}, {firstName(identity.nama)}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-soft">
          <span className="font-medium">{identity.blok}</span>
          <button
            type="button"
            onClick={change}
            className="text-xs font-medium text-gold-dark hover:underline"
          >
            Ganti identitas
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {greet}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Nahara Today · Cluster Nahara, Cimanggis Golf Estate
      </p>
      <button
        type="button"
        onClick={change}
        className="mt-2 text-xs font-medium text-gold-dark hover:underline"
      >
        Pilih identitas rumah
      </button>
    </div>
  );
}
