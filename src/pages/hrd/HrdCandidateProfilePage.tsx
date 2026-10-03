import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";

const AVAILABILITY_LABEL: Record<string, string> = {
  open: "Terbuka untuk peluang",
  looking: "Sedang mencari",
  not_available: "Tidak tersedia",
};

/** Bar Skill Matrix gaya terminal — ██████░░░ */
function SkillBar({ accuracy }: { accuracy: number }) {
  const filled = Math.round((accuracy / 100) * 18);
  return (
    <span aria-hidden className="font-mono text-xs text-primary">
      {"█".repeat(filled)}
      <span className="text-border">{"░".repeat(18 - filled)}</span>
    </span>
  );
}

/**
 * Candidate Profile — Competency Profile dari Skill Matrix sumber,
 * evidence per unit, portfolio (bila diizinkan), sertifikat (bila diizinkan).
 */
export default function HrdCandidateProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [openWorld, setOpenWorld] = useState<number | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const profile = useQuery(
    api.hrd.candidateProfile,
    studentId ? { studentId: studentId as Id<"users"> } : "skip",
  );
  const shortlistStatus = useQuery(
    api.hrd.shortlistStatus,
    studentId ? { studentId: studentId as Id<"users"> } : "skip",
  );
  const evidence = useQuery(
    api.hrd.candidateEvidence,
    studentId && openWorld !== null
      ? { studentId: studentId as Id<"users">, worldNum: openWorld }
      : "skip",
  );
  const upsertShortlist = useMutation(api.hrd.upsertShortlist);
  const logActivity = useMutation(api.hrd.logHrdActivity);
  const loggedRef = useRef<string | null>(null);

  // Query tidak boleh menulis ke db, jadi jejak audit dikirim lewat mutasi.
  // Dibatasi satu kali per kandidat supaya tidak mengulang tiap render.
  useEffect(() => {
    if (!profile || !studentId) return;
    const key = String(studentId);
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    void logActivity({
      action: "view_candidate",
      studentId: studentId as Id<"users">,
    }).catch(() => {});
  }, [profile, studentId, logActivity]);

  if (!studentId) return <p className="text-sm text-muted-foreground">ID kandidat tidak valid.</p>;
  if (profile === undefined) {
    return (
      <p className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat profil…
      </p>
    );
  }
  if (profile === null) {
    return (
      <div className="panel mx-auto max-w-md p-8 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-lg font-bold">Profil tidak tersedia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Siswa ini belum mengizinkan profilnya dilihat industri, atau profilnya
          tidak ada.
        </p>
        <Button asChild variant="secondary" className="mt-4">
          <Link to="/hrd/candidates">Kembali ke Candidate Pool</Link>
        </Button>
      </div>
    );
  }

  const setStatus = async (status: "saved" | "reviewed" | "shortlisted" | "contacted") => {
    setSavingStatus(status);
    try {
      await upsertShortlist({ studentId: studentId as Id<"users">, status });
    } finally {
      setSavingStatus(null);
    }
  };

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/hrd/candidates" className="hover:text-foreground">Candidate Pool</Link></li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{profile.name}</li>
        </ol>
      </nav>

      {/* Identitas */}
      <header className="flex flex-wrap items-start gap-4">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary/50 text-2xl">
          {profile.avatarEmoji ?? "🦉"}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            @{profile.username}
            {profile.className ? ` · ${profile.className}` : ""}
            {profile.level ? ` · LV ${profile.level} ${profile.rank ?? ""}` : ""}
          </p>
          {profile.headline && <p className="mt-2 text-sm font-medium">{profile.headline}</p>}
          {profile.summary && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{profile.summary}</p>
          )}
          <p className="mt-2 inline-block rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
            {AVAILABILITY_LABEL[profile.availability] ?? profile.availability}
          </p>
        </div>
      </header>

      {/* Statistik ringkas dari data nyata */}
      <dl className="grid gap-3 sm:grid-cols-4">
        <div className="panel p-4">
          <dt className="text-xs font-semibold text-muted-foreground">Unit kompeten</dt>
          <dd className="mt-1 text-xl font-extrabold">
            {profile.competentUnits}/{profile.competenciesTotal}
          </dd>
        </div>
        <div className="panel p-4">
          <dt className="text-xs font-semibold text-muted-foreground">Latihan selesai</dt>
          <dd className="mt-1 text-xl font-extrabold">{profile.exercisesDone}</dd>
        </div>
        <div className="panel p-4">
          <dt className="text-xs font-semibold text-muted-foreground">Query dijalankan</dt>
          <dd className="mt-1 text-xl font-extrabold">{profile.queriesRun}</dd>
        </div>
        <div className="panel p-4">
          <dt className="text-xs font-semibold text-muted-foreground">Menang battle</dt>
          <dd className="mt-1 text-xl font-extrabold">{profile.botWins}</dd>
        </div>
      </dl>

      {/* Skill Matrix */}
      <section aria-labelledby="cp-matrix" className="panel p-6">
        <h2 id="cp-matrix" className="kicker mb-4">COMPETENCY PROFILE · SKILL MATRIX</h2>
        <ul className="space-y-1.5">
          {profile.matrix.map((c: any) => (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => setOpenWorld(openWorld === c.worldNum ? null : c.worldNum)}
                aria-expanded={openWorld === c.worldNum}
                className="flex w-full flex-wrap items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-secondary/50"
              >
                {openWorld === c.worldNum ? (
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="w-40 shrink-0 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {c.code} · {c.title}
                </span>
                <SkillBar accuracy={c.accuracy} />
                <span className="font-mono text-xs font-semibold">
                  {c.accuracy}%
                </span>
                {c.competent && (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 font-mono text-[10px] font-bold text-success">
                    KOMPETEN
                  </span>
                )}
              </button>
              {openWorld === c.worldNum && (
                <div className="mt-2 mb-3 ml-6 border-l border-border pl-4">
                  {evidence === undefined ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" /> Memuat evidence…
                    </p>
                  ) : evidence === null || evidence.evidence.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Belum ada aktivitas latihan pada unit ini.
                    </p>
                  ) : (
                    <ul className="space-y-1.5" aria-label={`Evidence ${c.title}`}>
                      {evidence.evidence.map((e: any) => (
                        <li key={`${e.exerciseId}-${e.at}`} className="text-xs">
                          <span aria-hidden className={e.isCorrect ? "text-success" : "text-destructive"}>
                            {e.isCorrect ? "✓" : "✗"}
                          </span>{" "}
                          <span className="font-semibold">{e.title}</span>{" "}
                          <span className="font-mono text-muted-foreground">
                            · {e.difficulty} · {e.isCorrect ? "benar" : "salah"}
                            {` · hint ${e.hintsUsed} · ${new Date(e.at).toLocaleDateString("id-ID")}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Nilai berasal dari akurasi attempt latihan nyata — aturan yang sama
          dengan penilaian kelas (≥3 attempt, akurasi ≥60% = kompeten).
        </p>
      </section>

      {/* Sertifikat */}
      <section aria-labelledby="cp-cert" className="panel p-6">
        <h2 id="cp-cert" className="kicker mb-3">SERTIFIKAT KOMPETENSI</h2>
        {!profile.consentCertificate ? (
          <p className="text-sm text-muted-foreground">
            Siswa tidak mengizinkan sertifikatnya ditampilkan.
          </p>
        ) : profile.certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada sertifikat terbit.</p>
        ) : (
          <ul className="space-y-2">
            {profile.certificates.map((cert: any) => (
              <li key={cert.certificateNumber} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2.5">
                <div>
                  <p className="font-mono text-sm font-semibold">{cert.certificateNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.schemeName} · terbit {new Date(cert.issuedAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/hrd/verify?no=${encodeURIComponent(cert.certificateNumber)}`}>
                    Verifikasi
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Portfolio */}
      <section aria-labelledby="cp-portfolio" className="panel p-6">
        <h2 id="cp-portfolio" className="kicker mb-3">PORTFOLIO</h2>
        {!profile.consentPortfolio ? (
          <p className="text-sm text-muted-foreground">
            Siswa tidak mengizinkan portfolio ditampilkan.
          </p>
        ) : profile.portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada project yang dipublikasikan.</p>
        ) : (
          <ul className="space-y-3">
            {profile.portfolio.map((p: any) => (
              <li key={p._id} className="rounded border border-border p-4">
                <p className="text-sm font-bold">{p.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                {p.problemSolved && (
                  <p className="mt-2 text-xs"><span className="font-semibold">Masalah diselesaikan:</span> {p.problemSolved}</p>
                )}
                {p.techStack.length > 0 && (
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.techStack.join(" · ")}</p>
                )}
                {p.skills.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.skills.map((s: any) => (
                      <li key={s} className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 font-mono text-[10px]">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Shortlist */}
      <section aria-labelledby="cp-shortlist" className="panel p-6">
        <h2 id="cp-shortlist" className="kicker mb-3">SHORTLIST SAYA</h2>
        <p className="text-xs text-muted-foreground">
          Status saat ini:{" "}
          <span className="font-mono font-bold text-foreground">
            {shortlistStatus?.status ?? "belum ada"}
          </span>
          . Data ini privat — hanya terlihat oleh perusahaan Anda.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["saved", "reviewed", "shortlisted", "contacted"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={shortlistStatus?.status === s ? "default" : "outline"}
              disabled={savingStatus === s}
              onClick={() => setStatus(s)}
            >
              {savingStatus === s ? <Loader2 className="size-3.5 animate-spin" /> : s}
            </Button>
          ))}
        </div>
        {!profile.consentContact && (
          <p className="mt-3 text-xs text-muted-foreground">
            Siswa belum mengizinkan kontak profesional.
          </p>
        )}
      </section>
    </div>
  );
}
