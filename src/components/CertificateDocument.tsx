/**
 * Sertifikat Kompetensi — dokumen 2 halaman A4 Portrait.
 *
 * Halaman 1 : Sertifikat Kompetensi
 * Halaman 2 : Daftar Unit Kompetensi / List of Unit(s) of Competency
 *
 * Semua isi (identitas sekolah, skema, unit kompetensi, tanggal, nomor)
 * datang dari `doc` — komponen ini TIDAK hard-code identitas apa pun.
 * Desain formal internal sekolah (bukan replika sertifikat BNSP).
 */

export interface CertificateDoc {
  /** null saat preview — sertifikat belum diterbitkan */
  certificateNumber: string | null;
  status: "preview" | "issued" | "revoked";
  issuedAt: number | null;
  validUntil: number | null;
  validityNote: string | null; // kebijakan masa berlaku belum ditetapkan
  student: { name: string; username: string; className: string; nis: string | null };
  school: {
    name: string;
    nameShort: string;
    address: string;
    programKeahlian: string;
    programKeahlianEn: string;
    city: string;
    logo: string;
  };
  scheme: { name: string; nameEn: string };
  /** Baris matrix lengkap (preview) atau unit kompeten terbit (snapshot). */
  competencies: {
    code: string;
    title: string;
    titleEn: string;
    accuracy: number;
    attempts: number;
    competent: boolean;
  }[];
  signatures: {
    left: { title: string; name: string; nip: string };
    right: { title: string; name: string; nip: string };
  };
  verifyBaseUrl: string;
}

const fmtDateID = (ts: number | null) =>
  ts == null
    ? "—"
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(ts));

/** Nama penanda tangan hanya ditampilkan bila benar-benar diisi (≠ placeholder judul). */
function SigBlock({
  title,
  name,
  nip,
  align = "center",
}: {
  title: string;
  name: string;
  nip: string;
  align?: "center";
}) {
  const showName = name && name !== title;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="cert-serif text-[3.2mm] leading-snug">{title}</p>
      <div className="h-[13mm]" aria-hidden /> {/* ruang tanda tangan basah */}
      <div className="w-[52mm] border-t border-black/80 pt-[1.5mm]">
        {showName && <p className="cert-serif text-[3.4mm] font-bold">{name}</p>}
        {nip && <p className="cert-serif text-[2.8mm]">NIP. {nip}</p>}
      </div>
    </div>
  );
}

export function CertificateDocument({ doc }: { doc: CertificateDoc }) {
  const {
    certificateNumber,
    status,
    issuedAt,
    validUntil,
    validityNote,
    student,
    school,
    scheme,
    competencies,
    signatures,
    verifyBaseUrl,
  } = doc;

  const competent = competencies.filter((c) => c.competent);
  const codeList = competent.map((c) => c.code).join("  ·  ");
  const verifyUrl = certificateNumber
    ? `${verifyBaseUrl}/verify/certificate/${encodeURIComponent(certificateNumber)}`
    : null;

  return (
    <div className="print-root cert-serif text-[3.5mm] leading-relaxed text-black">
      {/* ============================ HALAMAN 1 ============================ */}
      <div className="cert-sheet">
        <div className="cert-frame">
          {/* Identifier atas */}
          <div className="flex items-start justify-between font-mono text-[2.6mm] uppercase tracking-wider">
            <span>
              {status === "issued"
                ? `No. Dok ${certificateNumber}`
                : status === "revoked"
                  ? `DICABUT · ${certificateNumber}`
                  : "PRATINJAU — BELUM DITERBITKAN"}
            </span>
            <span>Halaman 1 dari 2</span>
          </div>

          {/* Kepala sekolah */}
          <div className="mt-[4mm] flex flex-col items-center">
            <img
              src={school.logo}
              alt={`Logo ${school.nameShort}`}
              className="size-[20mm] rounded-[2mm] object-contain"
            />
            <p className="cert-serif mt-[2mm] text-[4.6mm] font-bold uppercase tracking-wide">
              {school.name}
            </p>
            <p className="cert-serif text-[2.9mm]">{school.address}</p>
          </div>

          {/* Judul */}
          <div className="mt-[7mm] border-y-[0.6mm] border-black/85 py-[3.5mm] text-center">
            <h1 className="cert-serif text-[8mm] font-bold uppercase tracking-[0.08em]">
              Sertifikat Kompetensi
            </h1>
            <p className="cert-serif text-[3.8mm] italic tracking-wide">
              Certificate of Competence
            </p>
          </div>

          <p className="cert-serif mt-[5mm] text-center text-[3.4mm]">
            Nomor: <span className="font-bold">{certificateNumber ?? "—"}</span>
          </p>

          <p className="cert-serif mt-[5mm] text-center">
            Dengan ini menyatakan bahwa:
            <br />
            <span className="italic">This is to certify that</span>
          </p>

          {/* Nama siswa */}
          <p className="cert-serif cert-underline mt-[4mm] text-center text-[7.5mm] font-bold uppercase tracking-wide">
            {student.name}
          </p>
          <p className="cert-serif mt-[1.5mm] text-center text-[3mm]">
            {student.nis ? `Nomor Identitas: ${student.nis}` : `Akun: @${student.username}`}
            {student.className ? ` · Kelas: ${student.className}` : ""}
          </p>

          <p className="cert-serif mt-[4.5mm] text-center">
            Telah kompeten pada bidang
            <br />
            <span className="italic">Has been competent in the area of</span>
          </p>

          <p className="cert-serif mt-[3mm] text-center text-[4.2mm] font-bold tracking-wide">
            {codeList || "—"}
          </p>

          <p className="cert-serif mt-[4.5mm] text-center">
            Dengan kualifikasi/kompetensi:
            <br />
            <span className="italic">With qualifications/competence of</span>
          </p>

          <p className="cert-serif cert-underline mt-[3mm] text-center text-[5.4mm] font-bold uppercase">
            {scheme.name}
          </p>
          <p className="cert-serif mt-[1mm] text-center text-[3mm]">{school.programKeahlianEn}</p>

          {/* Masa berlaku */}
          <div className="cert-serif mt-[4.5mm] text-center text-[3.2mm]">
            {validUntil ? (
              <p>
                Masa berlaku: <span className="font-bold">s.d. {fmtDateID(validUntil)}</span>
              </p>
            ) : (
              validityNote && <p className="italic">{validityNote}</p>
            )}
          </div>

          {/* Tanda tangan */}
          <div className="cert-serif mt-[6mm] text-center text-[3.2mm]">
            <p>
              {school.city}, {fmtDateID(issuedAt)}
            </p>
          </div>
          <div className="mt-[4mm] flex items-start justify-around gap-[8mm]">
            <SigBlock
              title={signatures.left.title}
              name={signatures.left.name}
              nip={signatures.left.nip}
            />
            <SigBlock
              title={signatures.right.title}
              name={signatures.right.name}
              nip={signatures.right.nip}
            />
          </div>

          {/* Footer verifikasi */}
          <div className="mt-auto border-t border-black/40 pt-[2mm] text-center font-mono text-[2.3mm]">
            {verifyUrl ? (
              <p>
                Verifikasi keaslian: <span className="font-bold">{verifyUrl}</span>
              </p>
            ) : (
              <p>Dokumen pratinjau — nomor sertifikat akan muncul setelah diterbitkan.</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================ HALAMAN 2 ============================ */}
      <div className="cert-sheet">
        <div className="cert-frame">
          <div className="flex items-start justify-between font-mono text-[2.6mm] uppercase tracking-wider">
            <span>No. Dok {certificateNumber ?? "—"}</span>
            <span>Halaman 2 dari 2</span>
          </div>

          <div className="mt-[4mm] border-b-[0.6mm] border-black/85 pb-[3mm] text-center">
            <h1 className="cert-serif text-[6.4mm] font-bold uppercase tracking-[0.06em]">
              Daftar Unit Kompetensi
            </h1>
            <p className="cert-serif text-[3.4mm] italic">List of Unit(s) of Competency</p>
          </div>

          {/* Identitas pemilik */}
          <table className="cert-serif mt-[5mm] w-full text-[3.2mm]">
            <tbody>
              <tr>
                <td className="w-[42mm] py-[0.8mm]">Nama</td>
                <td className="w-[4mm]">:</td>
                <td className="font-bold">{student.name}</td>
              </tr>
              <tr>
                <td className="py-[0.8mm]">Kelas</td>
                <td>:</td>
                <td>{student.className || "—"}</td>
              </tr>
              <tr>
                <td className="py-[0.8mm]">Skema/Kualifikasi</td>
                <td>:</td>
                <td>{scheme.name}</td>
              </tr>
              <tr>
                <td className="py-[0.8mm]">No. Sertifikat</td>
                <td>:</td>
                <td>{certificateNumber ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-[0.8mm]">Tanggal Terbit</td>
                <td>:</td>
                <td>{fmtDateID(issuedAt)}</td>
              </tr>
            </tbody>
          </table>

          {/* Tabel unit */}
          <table className="cert-serif mt-[5mm] w-full border-collapse text-[3.1mm]">
            <thead>
              <tr className="bg-black/5 text-left">
                <th className="border border-black/70 px-[2mm] py-[1.4mm] text-center w-[10mm]">No</th>
                <th className="border border-black/70 px-[2mm] py-[1.4mm] w-[18mm]">Kode</th>
                <th className="border border-black/70 px-[2mm] py-[1.4mm]">Unit Kompetensi</th>
                <th className="border border-black/70 px-[2mm] py-[1.4mm] text-center w-[20mm]">
                  Akurasi
                </th>
                <th className="border border-black/70 px-[2mm] py-[1.4mm] text-center w-[22mm]">
                  Hasil
                </th>
              </tr>
            </thead>
            <tbody>
              {competencies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-black/70 px-[2mm] py-[3mm] text-center italic">
                    Belum ada unit kompetensi yang dievaluasi.
                  </td>
                </tr>
              ) : (
                competencies.map((c, i) => (
                  <tr key={c.code}>
                    <td className="border border-black/70 px-[2mm] py-[1.2mm] text-center">{i + 1}</td>
                    <td className="border border-black/70 px-[2mm] py-[1.2mm] font-bold">{c.code}</td>
                    <td className="border border-black/70 px-[2mm] py-[1.2mm]">
                      {c.title}
                      <span className="italic"> — {c.titleEn}</span>
                    </td>
                    <td className="border border-black/70 px-[2mm] py-[1.2mm] text-center tabular-nums">
                      {c.attempts > 0 ? `${c.accuracy}% (${c.attempts} attempt)` : "—"}
                    </td>
                    <td className="border border-black/70 px-[2mm] py-[1.2mm] text-center font-bold uppercase">
                      {c.competent ? "Kompeten" : "Belum"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="cert-serif mt-[3mm] text-[2.8mm] italic">
            Kompeten = minimal 3 latihan per unit dengan akurasi ≥ 60% (Skill Matrix internal sekolah).
          </p>

          <div className="mt-auto text-center font-mono text-[2.3mm]">
            <p>
              {school.nameShort} · {scheme.name} ·{" "}
              {certificateNumber ?? "pratinjau"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
