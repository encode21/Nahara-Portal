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
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  );
}

function isSecurePushContext(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration> {
  // Prefer dedicated push SW so it works even when next-pwa is disabled in development.
  const existing = await navigator.serviceWorker.getRegistration("/push-sw.js");
  if (existing) {
    await existing.update().catch(() => undefined);
    return existing;
  }
  return navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
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
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [diag, setDiag] = useState({
    vapid: false,
    secure: false,
    sw: false,
    pushManager: false,
    ios: false,
    standalone: false,
  });
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
    const pushManager = typeof window !== "undefined" && "PushManager" in window;
    const sw = typeof navigator !== "undefined" && "serviceWorker" in navigator;
    const notificationOk = typeof window !== "undefined" && "Notification" in window;
    setDiag({
      vapid: Boolean(vapidPublic),
      secure: isSecurePushContext(),
      sw,
      pushManager,
      ios: isIos(),
      standalone: isStandalonePwa(),
    });
    if (!notificationOk) setPerm("unsupported");
    else setPerm(Notification.permission);
  }, [vapidPublic]);

  async function enablePush() {
    setPushMsg(null);
    if (!vapidPublic || !row) {
      setPushMsg("VAPID belum terbaca di browser. Restart npm run dev / redeploy dulu.");
      return;
    }
    if (!isSecurePushContext()) {
      setPushMsg(
        "Halaman harus HTTPS (atau localhost). Buka lewat portal.nahara.id, jangan IP HTTP biasa."
      );
      return;
    }
    if (!("Notification" in window)) {
      setPushMsg("Browser ini tidak mendukung Notification API.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushMsg(
        isIos()
          ? "Di iPhone: Add to Home Screen dulu, lalu buka dari ikon tersebut."
          : "Browser tidak mendukung Web Push."
      );
      return;
    }

    setPushBusy(true);
    try {
      // Explicit permission prompt (Android Chrome shows system dialog here)
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      setPerm(permission);

      if (permission !== "granted") {
        setPushMsg(
          permission === "denied"
            ? "Izin ditolak. Di Chrome Android: ikon gembok/info situs → Izin → Notifikasi → Izinkan, lalu refresh."
            : "Izin notifikasi tidak diberikan."
        );
        setPushBusy(false);
        return;
      }

      const registration = await ensurePushServiceWorker();
      await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setPushMsg("Subscription tidak lengkap. Coba lagi.");
        setPushBusy(false);
        return;
      }

      const { error } = await supabase.rpc("upsert_peak_push_subscription", {
        p_registration_code: row.registration_code,
        p_endpoint: json.endpoint,
        p_p256dh: json.keys.p256dh,
        p_auth: json.keys.auth,
        p_user_agent: navigator.userAgent.slice(0, 200),
      });
      if (error) {
        setPushMsg(getSupabaseErrorMessage(error) ?? "Gagal menyimpan subscription di database.");
      } else {
        setPushMsg(
          "Berhasil! Notifikasi aktif. Uji dengan Spin ke peserta ini di halaman admin door prize."
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      setPushMsg(`Gagal mengaktifkan notifikasi: ${msg}`);
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

      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-900">Notifikasi hadiah (opsional)</p>
        <p className="text-sm text-slate-600">
          Tekan tombol di bawah — Chrome Android akan menampilkan popup izin sistem.
        </p>

        <ul className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1">
          <li>VAPID: {diag.vapid ? "OK" : "TIDAK TERBACA — restart server"}</li>
          <li>HTTPS/secure: {diag.secure ? "OK" : "TIDAK — wajib HTTPS"}</li>
          <li>Service Worker API: {diag.sw ? "OK" : "TIDAK"}</li>
          <li>PushManager: {diag.pushManager ? "OK" : "TIDAK"}</li>
          <li>
            Izin saat ini:{" "}
            <strong>
              {perm === "unsupported" ? "tidak didukung" : perm}
            </strong>
          </li>
        </ul>

        {diag.ios && !diag.standalone && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            iPhone: Add to Home Screen dulu, lalu buka dari ikon tersebut.
          </div>
        )}

        {perm === "denied" && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            Izin sudah ditolak sebelumnya, jadi popup tidak muncul lagi. Reset di pengaturan
            situs Chrome → Notifikasi → Izinkan.
          </div>
        )}

        <button
          type="button"
          className="btn-primary w-full"
          disabled={pushBusy || !diag.vapid}
          onClick={enablePush}
        >
          {pushBusy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          {perm === "denied" ? "Coba aktifkan lagi" : "Aktifkan notifikasi hadiah"}
        </button>
        {pushMsg && <p className="text-sm text-slate-700">{pushMsg}</p>}
      </div>

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
