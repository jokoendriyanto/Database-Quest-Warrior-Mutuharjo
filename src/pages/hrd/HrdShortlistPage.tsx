import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = ["saved", "reviewed", "shortlisted", "contacted"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

/**
 * Shortlist privat HRD — daftar kandidat yang disimpan beserta statusnya.
 * Data hanya milik akun HRD ini (server memfilter by_hrd).
 */
export default function HrdShortlistPage() {
  const shortlist = useQuery(api.hrd.myShortlist);
  const upsertShortlist = useMutation(api.hrd.upsertShortlist);
  const [busy, setBusy] = useState<string | null>(null);

  const changeStatus = async (
    studentId: GenericId<"users">,
    status: Status,
  ) => {
    setBusy(studentId);
    try {
      await upsertShortlist({ studentId, status });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">PRIVAT · HANYA PERUSAHAAN ANDA</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Shortlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kandidat yang Anda simpan untuk ditinjau kembali.
        </p>
      </header>

      {shortlist === undefined ? (
        <p className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat shortlist…
        </p>
      ) : shortlist.length === 0 ? (
        <p className="panel py-12 text-center text-sm text-muted-foreground">
          Belum ada kandidat di shortlist. Simpan dari{" "}
          <Link to="/hrd/candidates" className="text-primary hover:underline">
            Candidate Pool
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Daftar shortlist">
          {shortlist.map((s: any) => (
            <li key={s._id} className="panel p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    @{s.username}
                    {s.className ? ` · ${s.className}` : ""} · status{" "}
                    <span className="font-bold text-foreground">{s.status}</span>
                  </p>
                  {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {STATUS_OPTIONS.map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={s.status === st ? "default" : "outline"}
                      disabled={busy === s.studentId}
                      onClick={() => changeStatus(s.studentId, st)}
                    >
                      {busy === s.studentId ? <Loader2 className="size-3 animate-spin" /> : st}
                    </Button>
                  ))}
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/hrd/candidates/${s.studentId}`}>Profil</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
