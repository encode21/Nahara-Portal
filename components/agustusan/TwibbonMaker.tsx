"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  Images,
  Loader2,
  Share2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  AGUSTUSAN_MEDIA,
  TWIBBON_PHOTO_CIRCLE,
} from "@/lib/constants/agustusan";
import { createClient } from "@/lib/supabase/client";
import { uploadPortalImage } from "@/lib/supabase/storage";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

const SIZE = 1024;
const { cx: CIRCLE_CX, cy: CIRCLE_CY, r: CIRCLE_R } = TWIBBON_PHOTO_CIRCLE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });
}

export function TwibbonMaker({
  year,
  shareTitle,
  editionId,
}: {
  year: number;
  shareTitle: string;
  editionId: string;
}) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLImageElement | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);

  const [ready, setReady] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [galleryPromptOpen, setGalleryPromptOpen] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const photo = photoRef.current;
    if (photo) {
      const diam = CIRCLE_R * 2;
      const base = Math.max(diam / photo.width, diam / photo.height) * 1.08;
      const s = base * scale;
      const w = photo.width * s;
      const h = photo.height * s;
      const x = CIRCLE_CX - w / 2 + offset.x;
      const y = CIRCLE_CY - h / 2 + offset.y;

      ctx.save();
      ctx.beginPath();
      ctx.arc(CIRCLE_CX, CIRCLE_CY, CIRCLE_R, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photo, x, y, w, h);
      ctx.restore();
    }

    ctx.drawImage(frame, 0, 0, SIZE, SIZE);
  }, [offset.x, offset.y, scale]);

  useEffect(() => {
    let cancelled = false;
    loadImage(AGUSTUSAN_MEDIA.twibbonFrame)
      .then((img) => {
        if (cancelled) return;
        frameRef.current = img;
        setReady(true);
      })
      .catch(() => setMessage("Gagal memuat frame twibbon."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  async function onPickFile(file: File | null) {
    if (!file) return;
    setMessage(null);
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      photoRef.current = img;
      setHasPhoto(true);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      draw();
    } catch {
      setMessage("File gambar tidak valid.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!hasPhoto) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !hasPhoto) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = SIZE / rect.width;
    setOffset((o) => ({ x: o.x + dx * ratio, y: o.y + dy * ratio }));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function canvasToBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }

  function triggerDownload(blob: Blob) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `twibbon-nahara-hut-ri-${year}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function download() {
    if (!hasPhoto) {
      setMessage("Unggah foto dulu.");
      return;
    }
    setBusy(true);
    draw();
    const blob = await canvasToBlob();
    setBusy(false);
    if (!blob) return;
    lastBlobRef.current = blob;
    triggerDownload(blob);
    setMessage("Twibbon diunduh.");
    setGalleryPromptOpen(true);
  }

  async function shareResult() {
    if (!hasPhoto) {
      setMessage("Unggah foto dulu.");
      return;
    }
    setBusy(true);
    draw();
    const blob = await canvasToBlob();
    setBusy(false);
    if (!blob) return;
    lastBlobRef.current = blob;

    const file = new File([blob], `twibbon-nahara-${year}.png`, {
      type: "image/png",
    });
    const pageUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/kegiatan/agustusan/${year}`
        : "";

    let shared = false;
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: `Twibbon ${shareTitle} — Cluster Nahara`,
        });
        shared = true;
      } else if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Twibbon ${shareTitle}`,
          url: pageUrl,
        });
        shared = true;
      }
    } catch {
      return;
    }

    if (!shared) {
      triggerDownload(blob);
      setMessage("Twibbon diunduh.");
    }
    setGalleryPromptOpen(true);
  }

  async function uploadToGallery() {
    const blob = lastBlobRef.current;
    if (!blob) {
      setGalleryPromptOpen(false);
      setMessage("Buat ulang twibbon dulu, lalu unduh.");
      return;
    }
    setUploadingGallery(true);
    setMessage(null);
    const file = new File([blob], `twibbon-nahara-${year}.png`, {
      type: "image/png",
    });
    const { url, error: uploadError } = await uploadPortalImage(
      supabase,
      file,
      "agustusan"
    );
    if (uploadError || !url) {
      setUploadingGallery(false);
      setMessage(uploadError ?? "Gagal mengunggah ke galeri.");
      return;
    }

    const { error: insertError } = await supabase.from("event_gallery_items").insert({
      edition_id: editionId,
      image_url: url,
      caption: `Twibbon warga — ${shareTitle}`,
      sort_order: Date.now() % 1_000_000,
      is_published: true,
    });

    setUploadingGallery(false);
    setGalleryPromptOpen(false);
    if (insertError) {
      setMessage(
        getSupabaseErrorMessage(insertError) ??
          "Gagal menyimpan ke galeri. Pastikan migrasi public insert sudah dijalankan."
      );
      return;
    }
    setMessage("Terima kasih! Twibbon masuk Galeri / Dokumentasi Agustusan.");
  }

  return (
    <div className="space-y-5">
      <div className="mx-auto w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className={`aspect-square w-full touch-none rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200 ${
            hasPhoto ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <p className="mt-2 text-center text-xs text-slate-500">
          {hasPhoto
            ? "Geser / zoom supaya wajah pas di lingkaran."
            : "Unggah foto wajah — nanti muncul di dalam lingkaran frame."}
        </p>
      </div>

      {message && <p className="text-center text-sm text-[#7a1218]">{message}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <label className="btn-primary cursor-pointer">
          <ImagePlus className="mr-1.5 h-4 w-4" />
          {hasPhoto ? "Ganti foto" : "Unggah foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasPhoto}
          onClick={() => setScale((s) => Math.min(3, Number((s + 0.1).toFixed(2))))}
        >
          <ZoomIn className="mr-1.5 h-4 w-4" />
          Zoom +
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasPhoto}
          onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
        >
          <ZoomOut className="mr-1.5 h-4 w-4" />
          Zoom −
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasPhoto || busy}
          onClick={download}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Unduh
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!hasPhoto || busy}
          onClick={shareResult}
        >
          <Share2 className="mr-1.5 h-4 w-4" />
          Bagikan hasil
        </button>
      </div>

      {galleryPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#7a1218]/10 text-[#7a1218]">
              <Images className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Masukkan ke Galeri Agustusan?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Twibbon-mu sudah siap. Mau ikut dipajang di Galeri / Dokumentasi{" "}
              {shareTitle}?
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={uploadingGallery}
                onClick={uploadToGallery}
              >
                {uploadingGallery ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Ya, masukkan
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={uploadingGallery}
                onClick={() => setGalleryPromptOpen(false)}
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
