import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { Loader2 } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  view_candidate: "Melihat profil kandidat",
  view_certificate: "Memverifikasi sertifikat",
  shortlist_update: "Memperbarui shortlist",
  search: "Pencarian kandidat",
};

/**
 * Aktivitas HRD — jejak audit semua akses profil kandidat.
 * Wajib ada agar profil kompetensi dapat dipertanggungjawabkan (PRD §9).
 */
export default function HrdActivityPage() {
  const activity = useQuery(api.hrd.myActivity, { limit: 100 });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">AUDIT TRAIL</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Aktivitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Riwayat akses profil kandidat oleh perusahaan Anda.
        </p>
      </header>

      {activity === undefined ? (
        <p className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat aktivitas…
        </p>
      ) : activity.length === 0 ? (
        <p className="panel py-12 text-center text-sm text-muted-foreground">
          Belum ada aktivitas tercatat.
        </p>
      ) : (
        <ul className="panel divide-y divide-border" aria-label="Log aktivitas">
          {activity.map((a: any) => (
            <li key={a._id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(a.at).toLocaleString("id-ID")}
              </span>
              <span className="font-medium">{ACTION_LABEL[a.action] ?? a.action}</span>
              {a.detail && <span className="font-mono text-xs text-muted-foreground">{a.detail}</span>}
              {a.studentId && (
                <Link
                  to={`/hrd/candidates/${a.studentId}`}
                  className="text-xs text-primary hover:underline"
                >
                  lihat kandidat
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
