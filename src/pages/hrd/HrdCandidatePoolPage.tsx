import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ScrollText } from "lucide-react";

const AVAILABILITY_LABEL: Record<string, string> = {
  open: "Terbuka",
  looking: "Sedang mencari",
  not_available: "Tidak tersedia",
};

/**
 * Candidate Pool — hanya kandidat yang mengizinkan profilnya ditampilkan.
 * Search + filter memakai agregat yang sudah dihitung server.
 */
export default function HrdCandidatePoolPage() {
  const [search, setSearch] = useState("");
  const [onlyCompetent, setOnlyCompetent] = useState(false);
  const [minAccuracy, setMinAccuracy] = useState(0);
  const [availability, setAvailability] = useState("all");
  const [shortlisting, setShortlisting] = useState<string | null>(null);

  const pool = useQuery(api.hrd.candidatePool, {
    search: search.trim() || undefined,
    onlyCompetent: onlyCompetent || undefined,
    minAccuracy: minAccuracy > 0 ? minAccuracy : undefined,
  });
  const upsertShortlist = useMutation(api.hrd.upsertShortlist);
  const shortlist = useQuery(api.hrd.myShortlist);
  const logActivity = useMutation(api.hrd.logHrdActivity);
  const loggedRef = useRef<string | null>(null);
  const searchTerm = search.trim();

  // Query tidak boleh menulis ke db — jejak pencarian dikirim lewat mutasi,
  // satu kali per kata kunci.
  useEffect(() => {
    if (!pool || !searchTerm) return;
    if (loggedRef.current === searchTerm) return;
    loggedRef.current = searchTerm;
    void logActivity({
      action: "search",
      detail: `pool: ${pool.length} hasil`,
    }).catch(() => {});
  }, [pool, searchTerm, logActivity]);

  const shortlistedIds = useMemo(
    () => new Set((shortlist ?? []).map((s: any) => s.studentId)),
    [shortlist],
  );

  const filtered = useMemo(() => {
    if (!pool) return [];
    if (availability === "all") return pool;
    return pool.filter((c: any) => c.availability === availability);
  }, [pool, availability]);

  const addToShortlist = async (studentId: GenericId<"users">) => {
    setShortlisting(studentId);
    try {
      await upsertShortlist({ studentId, status: "saved" });
    } finally {
      setShortlisting(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">TALENT POOL</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Candidate Pool</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kandidat yang mengizinkan profil kompetensinya dilihat industri.
        </p>
      </header>

      {/* Search & filter */}
      <section aria-label="Pencarian dan filter" className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1 space-y-1">
            <Label htmlFor="pool-search">Cari</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="pool-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama, username, skill, kelas…"
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pool-availability">Availability</Label>
            <select
              id="pool-availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            >
              <option value="all">Semua</option>
              <option value="open">Terbuka</option>
              <option value="looking">Sedang mencari</option>
              <option value="not_available">Tidak tersedia</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pool-minacc">Akurasi min. (%)</Label>
            <Input
              id="pool-minacc"
              type="number"
              min={0}
              max={100}
              value={minAccuracy}
              onChange={(e) => setMinAccuracy(Number(e.target.value) || 0)}
              className="w-28"
            />
          </div>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyCompetent}
              onChange={(e) => setOnlyCompetent(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Punya unit kompeten
          </label>
        </div>
      </section>

      {/* Hasil */}
      {pool === undefined ? (
        <p className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat kandidat…
        </p>
      ) : filtered.length === 0 ? (
        <p className="panel py-12 text-center text-sm text-muted-foreground">
          Belum ada kandidat yang cocok. Kandidat muncul otomatis ketika siswa
          mengaktifkan Talent Profile mereka.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Daftar kandidat">
          {filtered.map((c: any) => (
            <li key={c.studentId} className="panel p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-secondary/50 text-xl">
                  {c.avatarEmoji ?? "🦉"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {c.name}
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {AVAILABILITY_LABEL[c.availability] ?? c.availability}
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {c.username}
                    {c.className ? ` · ${c.className}` : ""}
                    {` · ${c.competentUnits}/${c.totalUnits} unit kompeten · akurasi ${c.avgAccuracy}%`}
                    {c.certCount > 0 ? ` · ${c.certCount} sertifikat` : ""}
                  </p>
                  {c.headline && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{c.headline}</p>
                  )}
                  {c.topSkills.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skill utama">
                      {c.topSkills.map((s: any) => (
                        <li
                          key={s.title}
                          className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 font-mono text-[10px]"
                        >
                          {s.title} · {s.accuracy}%
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/hrd/candidates/${c.studentId}`}>Lihat Profil</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={shortlistedIds.has(c.studentId) ? "ghost" : "outline"}
                    disabled={shortlisting === c.studentId}
                    onClick={() => addToShortlist(c.studentId)}
                  >
                    {shortlisting === c.studentId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <ScrollText className="size-3.5" />
                        {shortlistedIds.has(c.studentId) ? "Tersimpan" : "Shortlist"}
                      </>
                    )}
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
