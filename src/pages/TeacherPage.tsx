import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download } from "lucide-react";
import { getExercise } from "@/lib/curriculum";
import { WORLD_SKILL } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AssignmentsPanel from "@/components/teacher/AssignmentsPanel";
import ChallengesPanel from "@/components/teacher/ChallengesPanel";
import PasswordResetPanel from "@/components/teacher/PasswordResetPanel";
import ClassesPanel from "@/components/teacher/ClassesPanel";
import WeeklyBossPanel from "@/components/teacher/WeeklyBossPanel";

type Tab = "siswa" | "tugas" | "tantangan" | "boss" | "password" | "kelas";

const TABS: { key: Tab; label: string }[] = [
  { key: "siswa", label: "Siswa" },
  { key: "tugas", label: "Tugas" },
  { key: "tantangan", label: "Tantangan" },
  { key: "boss", label: "Weekly Boss" },
  { key: "password", label: "Reset Password" },
  { key: "kelas", label: "Kelas" },
];

type Student = {
  name: string;
  username: string;
  className: string;
  avatarEmoji: string;
  xp: number;
  level: number;
  lessonsCompleted: number;
  exercisesDone: number;
  exercisesCorrect: number;
  accuracy: number;
  streak: number;
  daysInactive: number;
  atRisk: boolean;
  riskFlags: string[];
  worldSkills?: { worldNum: number; accuracy: number }[];
};

function statusOf(s: Student): { label: string; cls: string } {
  if (s.daysInactive > 7) return { label: "INACTIVE", cls: "text-muted-foreground" };
  if (s.atRisk) return { label: "NEEDS REVIEW", cls: "text-warning font-bold" };
  if (s.exercisesDone >= 5 && s.accuracy >= 85) return { label: "EXCELLENT", cls: "text-success font-semibold" };
  return { label: "ON TRACK", cls: "text-muted-foreground" };
}

function cellCls(v: number): string {
  if (v >= 85) return "text-success font-semibold";
  if (v >= 60) return "";
  return "text-warning font-semibold";
}

export default function TeacherPage() {
  const q = useQuery(api.game.teacherOverview);
  const [tab, setTab] = useState<Tab>("siswa");

  const students = useMemo(
    () => (q && !q.denied ? [...q.students].sort((a, b) => b.xp - a.xp) : []),
    [q],
  );

  // kolom matrix = world yang punya data attempt di kelas ini
  const matrixWorlds = useMemo(() => {
    const set = new Set<number>();
    for (const s of students) for (const w of s.worldSkills ?? []) set.add(w.worldNum);
    return [...set].sort((a, b) => a - b);
  }, [students]);

  if (!q) {
    return (
      <div className="mx-auto max-w-6xl space-y-3" aria-busy>
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (q.denied) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-bold">Akses khusus guru.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Panel ini hanya untuk akun dengan role Guru/Admin.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const total = students.length;
  const activeToday = students.filter((s) => s.daysInactive <= 1).length;
  const avgAccuracy =
    total > 0
      ? Math.round(students.reduce((sum, s) => sum + s.accuracy, 0) / total)
      : 0;
  const needAttention = students.filter((s) => s.atRisk || s.daysInactive > 7).length;
  const inactiveStudents = students.filter((s) => s.daysInactive > 7);

  const exportCsv = () => {
    const header = ["Nama", "Username", "Kelas", "Level", "XP", "Lesson", "Latihan", "Benar", "Accuracy %", "Hari tidak aktif", "Status"];
    const lines = students.map((s) =>
      [
        s.name,
        s.username,
        s.className,
        s.level,
        s.xp,
        s.lessonsCompleted,
        s.exercisesDone,
        s.exercisesCorrect,
        s.accuracy,
        s.daysInactive > 900 ? "" : s.daysInactive,
        statusOf(s).label,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `database-quest-kelas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-10">
      {/* ---------- HEADER ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">PANEL GURU</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Kondisi Kelas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} siswa terdaftar di Database Quest.
          </p>
        </div>
        {tab === "siswa" && (
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={total === 0}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        )}
      </header>

      {/* ---------- TABS ---------- */}
      <nav aria-label="Panel guru" className="-mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "tugas" && <AssignmentsPanel />}
      {tab === "tantangan" && <ChallengesPanel />}
      {tab === "boss" && <WeeklyBossPanel />}
      {tab === "password" && <PasswordResetPanel />}
      {tab === "kelas" && <ClassesPanel />}

      {/* ---------- SISWA ---------- */}
      {tab === "siswa" && (
      <>
      {/* ---------- SUMMARY INLINE ---------- */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-border py-4 sm:grid-cols-4">
        {[
          ["AKTIF HARI INI", `${activeToday} / ${total}`],
          ["RATA-RATA ACCURACY", total > 0 ? `${avgAccuracy}%` : "—"],
          ["PERLU PERHATIAN", String(needAttention)],
          ["BELUM PERNAH MULAI", `${students.filter((s) => s.exercisesDone === 0).length}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Belum ada siswa yang bergabung. Bagikan link daftar ke kelasmu dulu.
        </p>
      ) : (
        <>
          {/* ---------- INSIGHT ---------- */}
          {(needAttention > 0 || q.insights.length > 0) && (
            <section aria-labelledby="insight-h" className="rounded-lg border border-border p-5">
              <h2 id="insight-h" className="kicker mb-3 text-warning">PERLU PERHATIAN</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {needAttention > 0 && (
                  <div>
                    <p className="text-sm leading-relaxed">
                      <b>{needAttention} siswa</b> butuh dicek:{" "}
                      {inactiveStudents.length > 0 &&
                        `${inactiveStudents.length} tidak aktif >7 hari`}
                      {inactiveStudents.length > 0 && needAttention !== inactiveStudents.length && " · "}
                      {students.filter((s) => s.atRisk).length > 0 &&
                        `${students.filter((s) => s.atRisk).length} accuracy rendah`}
                      .
                    </p>
                    <Link to="/battle" className="mt-2 inline-block text-sm text-battle hover:underline">
                      Tugaskan latihan VS Bot →
                    </Link>
                  </div>
                )}
                {q.insights.length > 0 && (
                  <div>
                    <p className="kicker mb-2">TOPIK PALING SERING GAGAL</p>
                    <ul className="space-y-1.5">
                      {q.insights.slice(0, 3).map((i) => {
                        const ex = getExercise(i.exerciseId);
                        return (
                          <li key={i.exerciseId} className="flex items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate">{ex?.title ?? i.exerciseId}</span>
                            <span className="w-24 shrink-0 font-mono text-[11px] text-muted-foreground">
                              {i.attempts}× dicoba
                            </span>
                            <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-warning">
                              {i.failRate}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---------- CLASS TABLE ---------- */}
          <section aria-labelledby="table-h">
            <h2 id="table-h" className="kicker mb-3">DAFTAR SISWA</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Siswa</th>
                    <th className="px-3 py-2 font-medium">Kelas</th>
                    <th className="px-3 py-2 text-right font-medium">LV</th>
                    <th className="px-3 py-2 text-right font-medium">XP</th>
                    <th className="px-3 py-2 text-right font-medium">Lesson</th>
                    <th className="px-3 py-2 text-right font-medium">Acc</th>
                    <th className="px-3 py-2 text-right font-medium">Last Active</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const st = statusOf(s);
                    return (
                      <tr key={s.username} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                        <td className="px-3 py-2">
                          <span aria-hidden className="mr-1.5">{s.avatarEmoji}</span>
                          <span className="font-medium">{s.name}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.className || "—"}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.level}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.xp.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.lessonsCompleted}</td>
                        <td className={cn("px-3 py-2 text-right font-mono tabular-nums", s.exercisesDone >= 3 && s.accuracy < 50 && "text-warning font-bold")}>
                          {s.exercisesDone > 0 ? `${s.accuracy}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                          {s.daysInactive > 900 ? "belum" : s.daysInactive <= 0 ? "hari ini" : `${s.daysInactive}h lalu`}
                        </td>
                        <td className={cn("px-3 py-2 font-mono text-[10px] tracking-wide", st.cls)}>
                          {st.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------- SKILL MATRIX ---------- */}
          {matrixWorlds.length > 0 && (
            <section aria-labelledby="matrix-h">
              <h2 id="matrix-h" className="kicker mb-3">SKILL MATRIX · ACCURACY PER TOPIK</h2>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {matrixWorlds.map((w) => WORLD_SKILL[w] ?? `W${w}`).join(" · ")}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Siswa</th>
                      {matrixWorlds.map((w) => (
                        <th key={w} className="px-2.5 py-2 text-right font-medium" title={`World ${w}`}>
                          {WORLD_SKILL[w] ?? `W${w}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter((s) => (s.worldSkills?.length ?? 0) > 0)
                      .slice(0, 15)
                      .map((s) => (
                        <tr key={s.username} className="border-b border-border/50 last:border-0">
                          <td className="whitespace-nowrap px-3 py-1.5 font-medium">{s.name.split(" ")[0]}</td>
                          {matrixWorlds.map((w) => {
                            const cell = (s.worldSkills ?? []).find((x) => x.worldNum === w);
                            return (
                              <td
                                key={w}
                                className={cn("px-2.5 py-1.5 text-right font-mono text-xs tabular-nums", cell ? cellCls(cell.accuracy) : "text-muted-foreground/30")}
                              >
                                {cell ? cell.accuracy : "–"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}
