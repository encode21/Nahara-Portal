"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventPeakRegistration } from "@/lib/types";
import { PEAK_EVENT } from "@/lib/constants/agustusan";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";
import { LoadingSpinner } from "@/components/ui/Loading";
import { StoredImage } from "@/components/ui/StoredImage";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches
    || nav.standalone === true
  );
}

export default function PeakDaftarSuksesInner() {
  const params = useParams();
  const search = useSearchParams();
  const year = Number(params.year);
  const code = (search.get("code") ?? "").trim().toUpperCase();
  const supabase = useMemo(() => createClient(), []);
  const [row, setRow] = useState<EventPeakRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("event_peak_registrations")
        .select("*")
        .eq("registration_code", code)
        .maybeSingle();
      if (!cancelled) {
        setRow((data as EventPeakRegistration) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, supabase]);

  useEffect(() => {
    const supported =
      typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && "Notification" in window;
    setPushSupported(supported);
    setIosHint(isIos() && (!supported || !isStandalonePwa()));
  }, []);

  async function enablePush() {
    setPushMsg(null);
    if (!vapidPublic || !row) {
      setPushMsg("Notifikasi belum dikonfigurasi di server.");
      return;
    }
    if (!pushSupported) {
      setPushMsg(
        isIos()
          ? "Di iPhone: buka Safari → Share → Add to Home Screen, lalu buka lagi dari ikon Home Screen."
          : "Browser ini tidak mendukung notifikasi push."
      );
      return;
    }
    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushMsg("Izin notifikasi tidak diberikan. Cek Settings → Notifications.");
        setPushBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
      const json = sub.toJSON();
      const { error } = await supabase.rpc("upsert_peak_push_subscription", {
        p_registration_code: row.registration_code,
        p_endpoint: json.endpoint,
        p_p256dh: json.keys?.p256dh,
        p_auth: json.keys?.auth,
        p_user_agent: navigator.userAgent.slice(0, 200),
      });
      if (error) {
        setPushMsg(getSupabaseErrorMessage(error) ?? "Gagal menyimpan subscription.");
      } else {
        setPushMsg("Notifikasi hadiah diaktifkan. Kami akan memberitahu jika Anda menang.");
      }
    } catch {
      setPushMsg(
        isIos()
          ? "Gagal aktifkan. Pastikan app dibuka dari Home Screen (bukan tab Safari biasa)."
          : "Gagal mengaktifkan notifikasi. Coba di Chrome desktop / Android."
      );
    }
    setPushBusy(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!code || !row) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-slate-600">Data pendaftaran tidak ditemukan.</p>
        <Link
          href={`/kegiatan/agustusan/${year}/daftar`}
          className="btn-primary mt-4 inline-flex"
        >
          Daftar lagi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-1 pb-12">
      <div className="card text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-3 font-display text-2xl font-bold text-slate-900">
          Pendaftaran Berhasil!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Anda telah terdaftar sebagai peserta {PEAK_EVENT.title}.
        </p>
        <div className="mt-5 rounded-xl bg-[#faf7f0] px-4 py-3 text-left text-sm">
          <p>
            <span className="text-slate-500">Nama:</span>{" "}
            <span className="font-semibold">{row.participant_name}</span>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Rumah:</span>{" "}
            <span className="font-semibold">{row.household_label}</span>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Status:</span>{" "}
            <span className="font-semibold capitalize text-emerald-700">{row.status}</span>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Kode:</span>{" "}
            <span className="font-mono font-semibold tracking-wide">
              {row.registration_code}
            </span>
          </p>
        </div>
        <p className="mt-4 text-sm text-slate-700">
          Anda juga otomatis masuk dalam daftar peserta Door Prize.
        </p>
        {row.twibbon_url && (
          <div className="mx-auto mt-4 aspect-square w-32 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <StoredImage
              src={row.twibbon_url}
              alt="Twibbon"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {vapidPublic ? (
        <div className="card space-y-3">
          <p className="text-sm font-medium text-slate-900">Notifikasi hadiah (opsional)</p>
          {iosHint ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">iPhone: langkah khusus</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-amber-800">
                <li>Buka halaman ini di <strong>Safari</strong></li>
                <li>Tap Share → <strong>Add to Home Screen</strong></li>
                <li>Buka lagi dari ikon Home Screen</li>
                <li>Baru tap tombol aktifkan notifikasi</li>
              </ol>
              <p className="mt-2 text-xs">
                Push di iOS hanya jalan jika app terpasang ke Home Screen (PWA), iOS 16.4+.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Aktifkan agar browser memberi tahu jika Anda terpilih saat undian door prize.
            </p>
          )}
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={pushBusy || (!pushSupported && !iosHint)}
            onClick={enablePush}
          >
            {pushBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Aktifkan notifikasi hadiah
          </button>
          {!pushSupported && !iosHint && (
            <p className="text-xs text-slate-500">
              Browser ini belum mendukung Web Push. Coba Chrome di Android/desktop.
            </p>
          )}
          {pushMsg && <p className="text-sm text-slate-600">{pushMsg}</p>}
        </div>
      ) : (
        <div className="card text-sm text-slate-600">
          Notifikasi push belum dikonfigurasi (VAPID). Fitur daftar tetap berjalan.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/kegiatan/agustusan/${year}`} className="btn-primary flex-1 text-center">
          Kembali ke hub
        </Link>
        <Link
          href={`/kegiatan/agustusan/${year}/daftar`}
          className="btn-secondary flex-1 text-center"
        >
          Daftar peserta lain
        </Link>
      </div>
    </div>
  );
}
