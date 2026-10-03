import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DatabaseLoadingAnimation } from "@/components/ui/lottie-animation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  teacher: "Guru",
  student: "Siswa",
  user: "User",
  member: "Member",
  hrd: "HRD",
};

export default function AdminPage() {
  const overview = useQuery(api.admin.overview);
  const users = useQuery(api.admin.listUsers);
  const classes = useQuery(api.classes.list);
  const setRoleFn = useMutation(api.admin.setRole);
  const setClassFn = useMutation(api.admin.setClass);

  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!users || users.denied) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return users.users;
    return users.users.filter(
      (u: any) =>
        u.name.toLowerCase().includes(needle) ||
        u.username.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        u.className.toLowerCase().includes(needle),
    );
  }, [users, q]);

  if (!overview || !users) {
    return (
      <DatabaseLoadingAnimation text="Memuat panel admin..." />
    );
  }

  if (overview.denied || users.denied) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-bold">Akses khusus admin.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya untuk role Admin.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const o = overview;

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header>
        <p className="kicker">CONTROL ROOM</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Admin Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola user, role, dan kelas untuk seluruh Database Quest.
        </p>
      </header>

      {/* ---------- overview ---------- */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-border py-4 sm:grid-cols-5">
        {[
          ["TOTAL SISWA", String(o.totalStudents)],
          ["TOTAL GURU", String(o.totalTeachers)],
          ["AKTIF HARI INI", String(o.activeToday)],
          ["TOTAL XP", o.totalXp.toLocaleString()],
          ["KELAS", String(o.perClass.length)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {/* ---------- distribusi kelas ---------- */}
      {o.perClass.length > 0 && (
        <section aria-labelledby="dist-h">
          <h2 id="dist-h" className="kicker mb-3">DISTRIBUSI SISWA PER KELAS</h2>
          <div className="flex flex-wrap gap-2">
            {o.perClass.map((c: any) => (
              <span
                key={c.name}
                className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs"
              >
                {c.name} <span className="font-bold text-primary">{c.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ---------- user table ---------- */}
      <section aria-labelledby="users-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="users-h" className="kicker">SEMUA USER ({filtered.length})</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / username / kelas…"
            className="h-8 w-64 rounded-md border border-border bg-card px-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 text-right font-medium">LV</th>
                <th className="px-3 py-2 text-right font-medium">XP</th>
                <th className="px-3 py-2 text-right font-medium">Rating</th>
                <th className="px-3 py-2 font-medium">Kelas</th>
                <th className="px-3 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                  <td className="px-3 py-2">
                    <span aria-hidden className="mr-1.5">{u.avatarEmoji}</span>
                    <span className="font-medium">{u.name || u.username}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">@{u.username}</span>
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">
                    {u.email || "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{u.level}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{u.xp.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{u.duelRating}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={u.className || "__none"}
                      onValueChange={async (v) => {
                        setError(null);
                        try {
                          await setClassFn({ userId: u.id as any, className: v === "__none" ? "" : v });
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Gagal mengubah kelas.");
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 w-[9.5rem] text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">(tanpa kelas)</SelectItem>
                        {(classes ?? []).map((c: any) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={u.role}
                      onValueChange={async (v) => {
                        setError(null);
                        try {
                          await setRoleFn({ userId: u.id as any, role: v as any });
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Gagal mengubah role.");
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-[7.5rem] font-mono text-xs",
                          u.role === "admin" && "text-battle",
                          u.role === "teacher" && "text-primary",
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["student", "teacher", "admin", "hrd"].map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Kelola daftar kelas di <Link to="/teacher" className="text-primary hover:underline">Panel Guru → tab Kelas</Link>.
        </p>
      </section>
    </div>
  );
}
