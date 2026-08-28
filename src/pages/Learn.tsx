import { Link } from "react-router";
import { Check, Lock, Play } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WORLDS } from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import { LottieAnimation, SparkleAnimation } from "@/components/ui/lottie-animation";

type WorldStatus = "completed" | "current" | "available" | "locked" | "soon";

function statusMeta(s: WorldStatus): { label: string; cls: string } {
  switch (s) {
    case "completed":
      return { label: "COMPLETED", cls: "text-success" };
    case "current":
      return { label: "CURRENT", cls: "text-primary font-bold" };
    case "available":
      return { label: "AVAILABLE", cls: "text-muted-foreground" };
    case "locked":
      return { label: "LOCKED", cls: "text-muted-foreground/50" };
    default:
      return { label: "SEGERA", cls: "text-muted-foreground/60" };
  }
}

export default function Learn() {
  const data = useQuery(api.game.dashboard);
  const done = new Set(data?.completedLessons ?? []);

  // world terbuka jika semua lesson world sebelumnya tamat
  let prevComplete = true;
  const rows = WORLDS.map((w) => {
    const worldDone = w.lessons.filter((l) => done.has(l.id)).length;
    const total = w.lessons.length;
    const complete = total > 0 && worldDone === total;
    let status: WorldStatus;
    if (w.comingSoon || total === 0) status = "soon";
    else if (complete) {
      // semua lesson di world ini tamat
      status = "completed";
    } else if (!prevComplete) status = "locked";
    else if (worldDone > 0 && worldDone < total) status = "current";
    else if (worldDone === 0 && prevComplete) {
      // world pertama langsung jadi target aktif saat belum ada progres
      status = done.size === 0 && w.num === 1 ? "current" : "available";
    } else status = "available";
    // world kosong (segera hadir) tidak mengubah rantai unlock
    prevComplete = complete && total > 0 ? true : total === 0 ? prevComplete : false;

    return { world: w, status, worldDone, total };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="kicker">PROGRESSION</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Peta Belajar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          15 world, dari query pertama sampai arsitek database. Selesaikan satu world
          untuk membuka world berikutnya.
        </p>
      </header>

      <ol className="relative space-y-0">
        {rows.map(({ world: w, status, worldDone, total }, i) => {
          const meta = statusMeta(status);
          const locked = status === "locked";
          const soon = status === "soon";
          const body = (
            <>
              {/* nomor world */}
              <span
                className={cn(
                  "z-10 grid size-11 shrink-0 place-items-center border font-mono text-sm font-bold",
                  status === "current"
                    ? "border-primary bg-primary text-primary-foreground"
                    : status === "completed"
                      ? "border-success/50 bg-success/10 text-success"
                      : locked || soon
                        ? "border-border bg-muted text-muted-foreground/50"
                        : "border-border bg-card",
                )}
              >
                {status === "current" ? (
                  <div className="flex items-center gap-1"><SparkleAnimation /><Play className="size-4 fill-current" aria-label="Current" /></div>
                ) : status === "completed" ? (
                  <Check className="size-4" aria-hidden />
                ) : locked ? (
                  <Lock className="size-4" aria-hidden />
                ) : (
                  String(w.num).padStart(2, "0")
                )}
              </span>
              <div className="min-w-0 flex-1 pb-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h2
                    className={cn(
                      "truncate text-[15px] font-semibold",
                      locked && "text-muted-foreground/60",
                    )}
                  >
                    {w.title}
                  </h2>
                  <span className={cn("font-mono text-[10px] tracking-wider", meta.cls)}>
                    {meta.label}
                  </span>
                  {total > 0 && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      {worldDone}/{total} lesson
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{w.subtitle}</p>
              </div>
            </>
          );

          const clickable = !locked && !soon;
          // langsung ke lesson aktif di world ini — tanpa halaman world terpisah
          const activeLesson = w.lessons.find((l) => !done.has(l.id)) ?? w.lessons[0];
          return (
            <li key={w.slug} className="relative flex items-start gap-4">
              {/* garis penghubung */}
              {i < rows.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[21px] top-11 h-full w-px bg-border"
                />
              )}
              {clickable ? (
                <Link
                  to={`/lesson/${activeLesson.id}`}
                  className="group flex w-full items-start gap-4 rounded-lg px-2 py-3 -mx-2 transition-colors hover:bg-secondary/50"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex w-full items-start gap-4 px-2 py-3 -mx-2 opacity-70">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
