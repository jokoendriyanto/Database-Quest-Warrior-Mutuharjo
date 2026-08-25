import { useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { WORLDS, LESSON_ORDER } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export default function Learn() {
  const data = useQuery(api.game.dashboard);
  const completed = useMemo(() => new Set(data?.completedLessons ?? []), [data]);

  // urutan global: lesson ke-i terbuka jika semua lesson sebelumnya sudah tamat
  const unlockedCount = useMemo(() => {
    let n = 0;
    for (const r of LESSON_ORDER) {
      if (completed.has(r.lessonId)) n++;
      else break;
    }
    return n; // jumlah lesson yang boleh diakses = n (index) + ... lihat bawah
  }, [completed]);

  const isUnlocked = (globalIndex: number) => globalIndex <= unlockedCount;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Peta Petualangan 🗺️</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tamatkan world demi world. Setiap lesson dibuka setelah lesson sebelumnya selesai.
        </p>
      </header>

      {WORLDS.map((w, wi) => {
        const firstLessonGlobalIdx = LESSON_ORDER.findIndex((r) => r.worldNum === w.num);
        const worldLocked =
          w.lessons.length > 0 && !isUnlocked(firstLessonGlobalIdx);
        const doneInWorld = w.lessons.filter((l) => completed.has(l.id)).length;

        return (
          <motion.section
            key={w.num}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
            className={cn("clay p-5 sm:p-6", worldLocked && "opacity-80")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <span
                  className="grid size-14 shrink-0 place-items-center rounded-3xl text-2xl shadow-inner"
                  style={{ backgroundColor: w.color }}
                  aria-hidden
                >
                  {worldLocked ? <Lock className="size-6 text-foreground/50" /> : w.emoji}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    World {String(w.num).padStart(2, "0")}
                  </p>
                  <h2 className="text-lg font-extrabold leading-tight">{w.title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{w.subtitle}</p>
                </div>
              </div>
              {w.lessons.length > 0 && (
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                  {doneInWorld}/{w.lessons.length}
                </span>
              )}
              {wi === WORLDS.length - 1 && null}
            </div>

            {w.comingSoon ? (
              <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-3 text-xs font-semibold text-muted-foreground">
                🚧 World ini sedang disiapkan — selesaikan dulu world sebelumnya biar makin siap!
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {w.lessons.map((l) => {
                  const gIdx = LESSON_ORDER.findIndex((r) => r.lessonId === l.id);
                  const unlocked = isUnlocked(gIdx);
                  const done = completed.has(l.id);
                  const li = (
                    <Link
                      to={unlocked ? `/lesson/${l.id}` : "#"}
                      aria-disabled={!unlocked}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-colors",
                        unlocked
                          ? "bg-muted/60 hover:bg-secondary"
                          : "cursor-not-allowed bg-muted/30 text-muted-foreground",
                        done && "bg-accent/30 hover:bg-accent/40",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                      ) : unlocked ? (
                        <Circle className="size-5 shrink-0 text-primary" />
                      ) : (
                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn("min-w-0 flex-1 truncate text-sm font-bold", !unlocked && "font-semibold")}>
                        {l.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-muted-foreground">
                        <Clock className="size-3" /> {l.minutes}m
                        {unlocked && <ArrowRight className="ml-1 size-3.5" />}
                      </span>
                    </Link>
                  );
                  return <li key={l.id}>{li}</li>;
                })}
              </ul>
            )}
          </motion.section>
        );
      })}
    </div>
  );
}
