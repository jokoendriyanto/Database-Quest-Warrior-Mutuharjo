import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Compass } from "lucide-react";
import { COMPETENCY_UNITS } from "@/lib/certificate";

/**
 * Skill Explorer — cari kandidat berdasar kompetensi + level minimum.
 * Memanfaatkan data candidatePool (server) + filter matrix di klien.
 * Tidak membuat ranking baru — hasil = daftar kandidat yang cocok.
 */
export default function HrdSkillExplorerPage() {
  const pool = useQuery(api.hrd.candidatePool, {});
  const [selected, setSelected] = useState<string[]>([]);
  const [minAccuracy, setMinAccuracy] = useState(60);
  const [submitted, setSubmitted] = useState<{ skills: string[]; min: number } | null>(null);

  const toggle = (code: string) =>
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  const results = useMemo(() => {
    if (!pool) return null;
    if (!submitted) return null;
    const unitByTitle = new Map(
      COMPETENCY_UNITS.map((u) => [u.title, u.code] as const),
    );
    const wantedCodes = submitted.skills
      .map((title) => unitByTitle.get(title))
      .filter((c): c is string => !!c);
    return pool.filter((cand: any) => {
      if (cand.avgAccuracy < submitted.min) return false;
      if (wantedCodes.length === 0) return true;
      // Kandidat dianggap cocok bila punya unit KOMPETEN pada salah satu
      // unit yang dicari (Skill Matrix sumber, tanpa ranking baru).
      const titles = new Set(cand.competentTitles);
      return COMPETENCY_UNITS.some(
        (u) => wantedCodes.includes(u.code) && titles.has(u.title),
      );
    });
  }, [pool, submitted]);

  const search = () => setSubmitted({ skills: [...selected], min: minAccuracy });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker"> pencarian kompetensi</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Skill Explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter kandidat berdasarkan unit kompetensi Skill Matrix.
        </p>
      </header>

      <section aria-label="Filter kompetensi" className="panel space-y-4 p-5">
        <div>
          <p className="kicker mb-2">UNIT KOMPETENSI</p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {COMPETENCY_UNITS.map((u) => (
              <label key={u.code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(u.code)}
                  onChange={() => toggle(u.code)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="font-mono text-[11px] text-muted-foreground">{u.code}</span>
                <span className="truncate">{u.title}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="explorer-min">Akurasi minimum (%)</Label>
            <input
              id="explorer-min"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minAccuracy}
              onChange={(e) => setMinAccuracy(Number(e.target.value))}
              className="w-40"
            />
            <span className="ml-2 font-mono text-xs font-bold">{minAccuracy}%</span>
          </div>
          <Button onClick={search} className="font-bold">
            <Compass className="size-4" /> Cari Kandidat
          </Button>
        </div>
      </section>

      {pool === undefined ? (
        <p className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat kandidat…
        </p>
      ) : results === null ? (
        <p className="panel py-10 text-center text-sm text-muted-foreground">
          Pilih unit kompetensi lalu tekan "Cari Kandidat".
        </p>
      ) : results.length === 0 ? (
        <p className="panel py-10 text-center text-sm text-muted-foreground">
          Tidak ada kandidat yang cocok dengan kriteria.
        </p>
      ) : (
        <section aria-label="Hasil pencarian" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {results.length} kandidat cocok (urut akurasi tertinggi):
          </p>
          <ul className="space-y-2">
            {[...results]
              .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
              .map((c) => (
                <li key={c.studentId} className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {c.className ?? c.username} · akurasi {c.avgAccuracy}% ·{" "}
                      {c.competentUnits} unit kompeten
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/hrd/candidates/${c.studentId}`}>Profil</Link>
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
