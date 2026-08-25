import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  Flame,
  Target,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { getExercise } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export default function TeacherPage() {
  const data = useQuery(api.game.teacherOverview);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-[calc(var(--radius)+0.5rem)] bg-muted/60" />;
  }

  if ("denied" in data && data.denied) {
    return (
      <div className="clay mx-auto max-w-md p-10 text-center">
        <ShieldAlert className="mx-auto size-12 text-destructive" />
        <h1 className="mt-3 text-lg font-extrabold">Akses Khusus Guru</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Halaman ini hanya untuk akun guru & admin. Daftar ulang dengan peran{" "}
          <strong>Guru</strong> untuk membuka panel analitik kelas.
        </p>
      </div>
    );
  }

  const students = data.students;
  const totalStudents = students.length;
  const activeToday = students.filter(
    (s) => s.daysInactive === 0,
  ).length;
  const atRisk = students.filter((s) => s.atRisk);
  const avgAccuracy =
    students.filter((s) => s.exercisesDone > 0).length > 0
      ? Math.round(
          students.reduce((a, s) => a + s.accuracy, 0) /
            students.filter((s) => s.exercisesDone > 0).length,
        )
      : null;

  // kelompokkan per kelas
  const byClass = new Map<string, number>();
  for (const s of students) {
    byClass.set(s.className || "Tanpa Kelas", (byClass.get(s.className || "Tanpa Kelas") ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight">🎓 Panel Guru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor progres, akurasi SQL, dan siswa yang butuh bantuan ekstra.
        </p>
      </header>

      {/* summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={<Users className="size-5" />} label="Total Siswa" value={String(totalStudents)} />
        <SummaryCard
          icon={<Flame className="size-5" />}
          label="Aktif Hari Ini"
          value={String(activeToday)}
          tone={activeToday === 0 ? "warn" : "ok"}
        />
        <SummaryCard
          icon={<Target className="size-5" />}
          label="Rata-rata Akurasi"
          value={avgAccuracy == null ? "-" : `${avgAccuracy}%`}
          tone={avgAccuracy != null && avgAccuracy < 60 ? "warn" : "ok"}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" />}
          label="Siswa At-Risk"
          value={String(atRisk.length)}
          tone={atRisk.length > 0 ? "warn" : "ok"}
        />
      </div>

      {/* insights: topik tersulit */}
      <section className="clay p-6">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Topik Tersulit</p>
        {data.insights.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Belum cukup data percobaan latihan — minta siswa mengerjakan latihan SQL dulu ya.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {data.insights.map((ins, i) => {
              const ex = getExercise(ins.exerciseId);
              return (
                <li key={ins.exerciseId} className="rounded-2xl bg-muted/50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">
                      {i + 1}. {ex?.title ?? ins.exerciseId}
                      {ex && (
                        <span className="ml-2 text-[11px] font-semibold text-muted-foreground">
                          (World {ex.worldNum})
                        </span>
                      )}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black",
                        ins.failRate >= 50
                          ? "bg-destructive/15 text-destructive"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
                      )}
                    >
                      gagal {ins.failRate}%
                    </span>
                  </div>
                  <div className="clay-inset mt-2 h-2.5 overflow-hidden rounded-full p-0.5">
                    <div
                      className={cn("h-full rounded-full", ins.failRate >= 50 ? "bg-destructive/70" : "bg-orange-400")}
                      style={{ width: `${ins.failRate}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {ins.attempts} percobaan tercatat · rekomendasi: review visual + assign latihan topik ini.
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* distribusi kelas */}
      <section className="clay p-6">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distribusi Kelas</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...byClass.entries()].map(([cls, n]) => (
            <span key={cls} className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-extrabold text-secondary-foreground">
              {cls} · {n} siswa
            </span>
          ))}
          {byClass.size === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada siswa terdaftar.</p>
          )}
        </div>
      </section>

      {/* tabel siswa */}
      <section className="clay overflow-hidden p-0">
        <div className="border-b border-border/60 px-6 py-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daftar Siswa</p>
        </div>
        {students.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada siswa yang mendaftar. Bagikan tautan app ke kelasmu! 📣
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-black">Siswa</th>
                  <th className="px-3 py-3 font-black">Kelas</th>
                  <th className="px-3 py-3 font-black">XP / Lv</th>
                  <th className="px-3 py-3 font-black">Akurasi</th>
                  <th className="px-3 py-3 font-black">Lesson</th>
                  <th className="px-3 py-3 font-black">Streak</th>
                  <th className="px-6 py-3 font-black">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.username} className={cn("border-t border-border/40", s.atRisk && "bg-destructive/5")}>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-lg" aria-hidden>
                          {s.avatarEmoji}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-extrabold">{s.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">@{s.username}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-bold">{s.className || "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs font-bold">
                      {s.xp.toLocaleString()} / {s.level}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-xs font-black",
                          s.accuracy >= 70
                            ? "bg-green-200/70 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : s.accuracy >= 50
                              ? "bg-yellow-200/70 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                              : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {s.exercisesDone === 0 ? "-" : `${s.accuracy}%`}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{s.lessonsCompleted}</td>
                    <td className="px-3 py-3 text-xs font-bold">🔥 {s.streak}</td>
                    <td className="px-6 py-3">
                      {s.atRisk ? (
                        <span
                          title={s.riskFlags.join(", ")}
                          className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-black text-destructive"
                        >
                          <TrendingDown className="size-3" /> At-risk
                        </span>
                      ) : (
                        <span className="rounded-full bg-accent/40 px-2.5 py-1 text-[11px] font-black text-accent-foreground">
                          Aman ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* catatan laporan */}
      <p className="rounded-3xl bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        📄 Laporan lengkap (PDF/CSV/XLSX), manajemen assignment, dan pembuatan turnaman dari panel ini
        sedang dalam pengembangan. Data di atas dihitung langsung dari aktivitas latihan asli siswa.
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="clay-sm p-4">
      <span
        className={cn(
          "inline-grid size-10 place-items-center rounded-2xl",
          tone === "warn" ? "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300" : "bg-secondary text-secondary-foreground",
        )}
      >
        {icon}
      </span>
      <p className="mt-2.5 text-2xl font-black tabular-nums">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
