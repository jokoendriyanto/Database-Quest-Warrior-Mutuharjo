/**
 * Halaman Sertifikat Kompetensi (route: /certificate?studentId=...)
 *
 * - Siswa      : hanya dirinya sendiri (studentId diabaikan — backend yang memutuskan).
 * - Guru/Admin : boleh sebutkan ?studentId= untuk siswa di kelas yang diampu.
 * - Preview    : realtime dari Skill Matrix (tanpa nomor sertifikat).
 * - Issue      : snapshot permanen + nomor unik (guru: api.certificates.issue,
 *                siswa: api.certificates.issueSelf).
 * - Print      : window.print() — hanya .print-root yang tercetak (2 halaman A4).
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Printer, Award, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CertificateDocument, type CertificateDoc } from "@/components/CertificateDocument";
import {
  SCHOOL,
  SCHEME,
  SIGNATORIES,
  CERTIFICATE_VALIDITY_YEARS,
  VALIDITY_WORDING_NO_POLICY,
  PUBLIC_VERIFY_BASE,
} from "@/lib/certificate";

type MatrixResult = {
  student: { name: string; username: string; className: string; nis: string | null };
  competencies: {
    code: string;
    title: string;
    titleEn: string;
    worldNum: number;
    accuracy: number;
    attempts: number;
    competent: boolean;
  }[];
  totalCompetent: number;
  totalUnits: number;
  issuedCertificate: {
    id: string;
    certificateNumber: string;
    issuedAt: number;
    validUntil: number | null;
    status: "issued" | "revoked";
  } | null;
};

type IssuedSnapshot = {
  certificateNumber: string;
  studentName: string;
  studentUsername: string;
  className: string | null;
  schemeName: string;
  schemeNameEn: string;
  competencies: { code: string; title: string; titleEn?: string; accuracy: number }[];
  status: "issued" | "revoked";
  issuedAt: number;
  validUntil: number | null;
};

export default function CertificatePage() {
  const [params] = useSearchParams();
  const studentId = (params.get("studentId") as Id<"users"> | null) ?? null;

  const me = useQuery(api.users.currentUser);

  const isTeacher = me?.role === "teacher" || me?.role === "admin";

  // Guru/admin dengan ?studentId= melihat matrix siswa tsb (backend memvalidasi
  // scope kelas). Tanpa studentId → matrix milik sendiri.
  const matrix = useQuery(
    api.certificates.preview,
    studentId && isTeacher ? { studentId } : {},
  ) as MatrixResult | null | undefined;
  // Snapshot hanya relevan bila menganggap diri siswa (teacher melihat matrix live).
  const snapshot = useQuery(
    api.certificates.getForRender,
    !isTeacher && matrix?.issuedCertificate
      ? { certificateId: matrix.issuedCertificate.id as Id<"certificates"> }
      : "skip",
  ) as IssuedSnapshot | null | undefined;

  const issueByTeacher = useMutation(api.certificates.issue);
  const issueOwn = useMutation(api.certificates.issueSelf);
  const [issuing, setIssuing] = useState(false);

  const doc: CertificateDoc | null = useMemo(() => {
    if (!matrix) return null;
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : PUBLIC_VERIFY_BASE;
    const issued = !isTeacher && snapshot && snapshot.status === "issued" ? snapshot : null;
    if (issued) {
      return {
        certificateNumber: issued.certificateNumber,
        status: "issued",
        issuedAt: issued.issuedAt,
        validUntil: issued.validUntil,
        validityNote: null,
        student: {
          name: issued.studentName,
          username: issued.studentUsername,
          className: issued.className ?? matrix.student.className,
          nis: null,
        },
        school: {
          ...SCHOOL,
          programKeahlianEn: SCHOOL.programKeahlianEn,
        },
        scheme: {
          name: issued.schemeName,
          nameEn: issued.schemeNameEn ?? issued.schemeName,
        },
        competencies: issued.competencies.map((c) => ({
          code: c.code,
          title: c.title,
          titleEn: c.titleEn ?? c.title,
          accuracy: c.accuracy,
          attempts: 0,
          competent: true,
        })),
        signatures: {
          left: {
            title: SIGNATORIES.principal.title,
            name: SIGNATORIES.principal.name,
            nip: SIGNATORIES.principal.nip,
          },
          right: {
            title: SIGNATORIES.teacher.title,
            name: SIGNATORIES.teacher.name,
            nip: SIGNATORIES.teacher.nip,
          },
        },
        verifyBaseUrl: origin,
      };
    }
    return {
      certificateNumber: matrix.issuedCertificate?.certificateNumber ?? null,
      status:
        matrix.issuedCertificate?.status === "revoked"
          ? "revoked"
          : matrix.issuedCertificate
            ? "issued"
            : "preview",
      issuedAt: matrix.issuedCertificate?.issuedAt ?? null,
      validUntil: matrix.issuedCertificate?.validUntil ?? null,
      validityNote:
        CERTIFICATE_VALIDITY_YEARS == null ? VALIDITY_WORDING_NO_POLICY.id : null,
      student: matrix.student,
      school: { ...SCHOOL, programKeahlianEn: SCHOOL.programKeahlianEn },
      scheme: SCHEME,
      competencies: matrix.competencies,
      signatures: {
        left: {
          title: SIGNATORIES.principal.title,
          name: SIGNATORIES.principal.name,
          nip: SIGNATORIES.principal.nip,
        },
        right: {
          title: SIGNATORIES.teacher.title,
          name: SIGNATORIES.teacher.name,
          nip: SIGNATORIES.teacher.nip,
        },
      },
      verifyBaseUrl: origin,
    };
  }, [matrix, snapshot, isTeacher]);

  // Guru wajib memilih siswa (via ?studentId=) sebelum bisa menerbitkan.
  const canIssue =
    matrix != null &&
    matrix.totalCompetent > 0 &&
    !(isTeacher && !studentId) &&
    !(matrix.issuedCertificate && matrix.issuedCertificate.status === "issued");

  const handleIssue = async () => {
    setIssuing(true);
    try {
      if (isTeacher) {
        if (!studentId) throw new Error("Pilih siswa terlebih dahulu.");
        await issueByTeacher({ studentId });
      } else {
        await issueOwn({});
      }
      toast.success("Sertifikat diterbitkan — nomor sudah dikunci.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menerbitkan sertifikat.");
    } finally {
      setIssuing(false);
    }
  };

  const handlePrint = () => {
    if (!doc) return;
    const prevTitle = document.title;
    document.title = `Sertifikat ${doc.student.name}`.replace(/[\\/:*?"<>|]/g, "-");
    window.print();
    document.title = prevTitle;
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Toolbar — tidak ikut tercetak */}
      <div className="cert-no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="#back" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              <ArrowLeft className="size-4" /> Kembali
            </a>
          </Button>
          <div className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Button size="sm" onClick={handlePrint} disabled={!doc}>
            <Printer className="size-4" /> Cetak / Simpan PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleIssue}
            disabled={!canIssue || issuing}
            title={
              canIssue
                ? "Kunci Skill Matrix menjadi sertifikat resmi dengan nomor"
                : "Butuh minimal 1 unit kompeten untuk menerbitkan"
            }
          >
            {issuing ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
            {matrix?.issuedCertificate?.status === "issued"
              ? "Sudah Diterbitkan"
              : "Terbitkan Sertifikat"}
          </Button>

          <div className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {doc?.status === "issued" ? (
              <span className="flex items-center gap-1 text-success">
                <ShieldCheck className="size-3.5" /> {doc.certificateNumber}
              </span>
            ) : doc?.status === "revoked" ? (
              <span className="text-destructive">Sertifikat dicabut</span>
            ) : (
              <span>Mode Pratinjau</span>
            )}
          </div>
        </div>
      </div>

      {/* Preview A4 — di layar; saat print hanya .print-root yang tampil */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {matrix === null ? (
          <div className="panel flex h-64 flex-col items-center justify-center gap-3 text-center">
            <ShieldCheck className="size-8 text-muted-foreground" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Tidak berhak melihat sertifikat siswa ini.
            </p>
          </div>
        ) : !doc ? (
          <div className="panel flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Pratinjau A4 Portrait · 210 × 297 mm · 2 halaman
            </p>
            <CertificateDocument doc={doc} />
          </>
        )}
      </div>
    </div>
  );
}
