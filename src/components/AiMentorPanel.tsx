import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { COOLDOWN_SECONDS, MAX_LEVEL } from "@/lib/mentor-context";
import { cn } from "@/lib/utils";
import {
  Copy,
  GraduationCap,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";

/** Pesan ramah untuk siswa. Detail teknis hanya untuk log server (PRD 8.9). */
function friendlyError(err: unknown): {
  hide?: boolean;
  message?: string;
  retry?: number;
} {
  const data =
    err instanceof ConvexError
      ? (err.data as { error?: string; retry_after_seconds?: number })
      : null;
  switch (data?.error) {
    case "not_authenticated":
    case "mentor_not_configured":
      return { hide: true };
    case "cooldown":
      return { retry: data.retry_after_seconds ?? 20 };
    case "daily_cap":
      return { message: "Jatah petunjuk hari ini sudah habis. Coba lagi besok ya." };
    case "not_eligible":
      return {
        message: "Belum saatnya minta petunjuk. Coba jawab dulu minimal 2 kali ya.",
      };
    case "level_invalid":
      return { message: "Petunjuk harus diambil berurutan ya." };
    default:
      return { message: "Hmm, AI Mentor lagi gangguan. Coba lagi sebentar ya." };
  }
}

/**
 * Panel AI Mentor di halaman case/playground (PRD 8.9).
 *
 * - Tampil hanya kalau AI Mentor aktif (statusWithEnv), kalau tidak ya
 *   disembunyikan total, bukan menampilkan error.
 * - State tombol mengikuti progres server: disabled, countdown, aktif.
 * - Semua copy Bahasa Indonesia tanpa em dash (PRD 10.3).
 */
export function AiMentorPanel({
  exerciseId,
  exerciseTitle,
}: {
  exerciseId: string;
  exerciseTitle: string;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const statusWithEnv = useAction(api.mentorActions.statusWithEnv);
  const requestHint = useAction(api.mentorActions.requestHint);
  const progress = useQuery(api.mentor.progress, { exerciseId });
  const history = useQuery(api.mentor.history, { exerciseId });
  const hints = history?.hints ?? [];

  // Cooldown: batas dari request terakhir + hint terakhir di riwayat.
  // Dihitung saat render supaya tidak ada setState di dalam effect.
  const lastHintAt =
    hints.length > 0 ? Date.parse(hints[hints.length - 1].created_at) : 0;
  const cooldown = Math.max(
    0,
    cooldownUntil > now ? Math.ceil((cooldownUntil - now) / 1000) : 0,
    lastHintAt ? Math.ceil((lastHintAt + COOLDOWN_SECONDS * 1000 - now) / 1000) : 0,
  );

  // Cek konfigurasi sekali di awal. Gagal = panel tidak ditampilkan.
  useEffect(() => {
    let alive = true;
    statusWithEnv()
      .then((s) => {
        if (alive) setEnabled(s.enabled);
      })
      .catch(() => {
        if (alive) setEnabled(false);
      });
    return () => {
      alive = false;
    };
  }, [statusWithEnv]);

  // Hitung mundur cooldown, tick tiap detik hanya selama cooldown masih jalan.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [cooldown, now]);

  if (enabled !== true) return null;

  const nextLevel = progress ? Math.min(progress.nextLevel, MAX_LEVEL + 1) : 1;
  const hintsUsed = progress?.hintsUsed ?? hints.length;

  const blockedReason =
    progress == null
      ? "Memuat…"
      : progress.nextLevel > MAX_LEVEL
        ? "Petunjuk sudah habis. Tiga petunjuk maksimal untuk satu kasus."
        : progress.dailyRemaining === 0
          ? "Jatah petunjuk hari ini sudah habis. Coba lagi besok ya."
          : cooldown > 0
            ? `Tunggu ${cooldown} detik lagi`
            : !progress.eligible
              ? progress.failedAttempts < 2 && hintsUsed === 0
                ? "Coba jawab dulu minimal 2 kali. Kalau sudah, baru bisa minta petunjuk."
                : "Belum bisa minta petunjuk lagi sekarang."
              : null;

  const ask = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await requestHint({ exerciseId, level: nextLevel as 1 | 2 | 3 });
      setCooldownUntil(Date.now() + res.cooldown_seconds * 1000);
    } catch (err) {
      const f = friendlyError(err);
      if (f.hide) {
        setEnabled(false);
      } else if (f.retry !== undefined) {
        setCooldownUntil(Date.now() + f.retry * 1000);
        setNotice(`Tunggu ${f.retry} detik lagi ya.`);
      } else {
        setNotice(f.message ?? "Hmm, AI Mentor lagi gangguan. Coba lagi sebentar ya.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyNote = async () => {
    const note = [
      `Kasus: ${exerciseTitle}`,
      `Percobaan gagal: ${progress?.failedAttempts ?? 0}`,
      `Petunjuk AI dipakai: ${hintsUsed}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label="AI Mentor"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border bg-sidebar px-3 py-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider">
            AI Mentor
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Petunjuk, bukan jawaban.
          </p>
        </div>
        {hintsUsed > 0 && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {hintsUsed}/{MAX_LEVEL}
          </span>
        )}
      </div>

      <div className="space-y-2.5 px-3 py-3">
        {hints.length === 0 && !loading && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Kalau sudah mencoba dan masih bingung, minta petunjuk bertingkat.
            AI Mentor membantu berpikir, bukan menulis query untukmu.
          </p>
        )}

        {hints.map((h, i) => (
          <div key={`${h.level}-${i}`} className="flex justify-start">
            <div className="max-w-prose rounded-lg rounded-tl-sm border border-primary/30 bg-primary/5 px-3 py-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                Petunjuk {h.level}
                <span className="ml-2 font-normal text-muted-foreground">
                  {new Date(h.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {h.hint}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1" aria-hidden>
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50 [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" />
            </div>
            AI Mentor lagi mikir...
          </div>
        )}

        {notice && !loading && (
          <p role="status" className="text-sm text-warning">
            {notice}
          </p>
        )}

        {progress?.stuck && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <GraduationCap className="size-4 text-warning" aria-hidden />
              Minta bantuan guru
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Petunjuk sudah habis dan kamu sudah mencoba {progress.failedAttempts}{" "}
              kali. Ceritakan langkah yang sudah kamu coba ke gurumu, ya.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={copyNote}>
              <Copy className="size-3.5" />
              {copied ? "Catatan tersalin" : "Salin catatan"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-sidebar px-3 py-2">
        <Button
          size="sm"
          onClick={ask}
          disabled={loading || blockedReason !== null}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MessageCircle className="size-3.5" />
          )}
          {hintsUsed === 0 ? "Minta Petunjuk" : "Minta petunjuk lanjutan"}
        </Button>
        <span
          className={cn(
            "text-[11px] text-muted-foreground",
            blockedReason === null && "hidden",
          )}
        >
          {blockedReason}
        </span>
      </div>
    </section>
  );
}
