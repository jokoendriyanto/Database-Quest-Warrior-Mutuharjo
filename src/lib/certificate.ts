/**
 * Konfigurasi Skill Matrix → Sertifikat Kompetensi
 *
 * Unit kompetensi diturunkan dari kurikulum (WORLDS di src/lib/curriculum.ts).
 * Tiap world = 1 unit kompetensi dengan kode resmi sekolah.
 * Kode/judul hanya di sini — komponen sertifikat TIDAK boleh hard-code.
 */

import { WORLDS } from "./curriculum";

/* ------------------------- Identitas sekolah -------------------------- */
// Sesuai instruksi: identitas TIDAK di-hard-code di komponen sertifikat.
// Nilai di bawah adalah konfigurasi tunggal aplikasi (bisa dipindah ke DB nanti
// tanpa mengubah komponen sertifikat).
export const SCHOOL = {
  name: "SMK Muhammadiyah 1 Sukoharjo",
  nameShort: "SMK Muh 1 Sukoharjo",
  address: "Jl. Raya Yongkadipiro, Sukoharjo, Jawa Tengah",
  programKeahlian: "PPLG (Pengembangan Perangkat Lunak dan Gim)",
  programKeahlianEn: "Software Engineering",
  // logo system: /logo.svg (public). Putih-diatas-hitam → di-invert saat render.
  logo: "/logo.svg",
  city: "Sukoharjo",
} as const;

/* --------------------------- Penandatangan ---------------------------- */
export const SIGNATORIES = {
  principal: {
    title: "Kepala Sekolah",
    titleEn: "Principal",
    name: "Kepala Sekolah", // TODO ganti nama asli saat tersedia
    nip: "", // dikosongkan → tidak ditampilkan
  },
  teacher: {
    title: "Guru Produktif",
    titleEn: "Productive Teacher",
    name: "Guru Produktif",
    nip: "",
  },
} as const;

/* ------------------------- Skema kompetensi --------------------------- */
export const SCHEME = {
  name: "Junior Database Programmer",
  nameEn: "Junior Database Programmer",
} as const;

/* --------------------------- Masa berlaku ----------------------------- */
// Kebijakan sekolah. undefined/null → tidak dinyatakan berlaku X tahun.
export const CERTIFICATE_VALIDITY_YEARS: number | null = null; // belum ditetapkan sekolah

export const VALIDITY_WORDING_NO_POLICY = {
  id: "Sertifikat ini diterbitkan berdasarkan hasil Skill Matrix siswa.",
  en: "This certificate is issued based on the student's Skill Matrix results.",
} as const;

/* --------------------- Unit kompetensi (Skill Matrix) ------------------ */
// Threshold "kompeten": mengikuti logic Skill Matrix existing (TeacherPage):
// akurasi attempt ≥ 60% dianggap Kompeten (≥85 sangat baik). Ini konstanta
// evaluasi yang sama yang dipakai penilaian kelas — bukan aturan baru.
export const COMPETENT_THRESHOLD = 60;

export interface CompetencyUnit {
  code: string;
  title: string;
  titleEn: string;
  worldNum: number;
}

/**
 * Diturunkan otomatis dari WORLDS — urutan & judul selalu mengikuti kurikulum.
 * Kode unit: DB-01..DB-15 (stabil walau world bertambah).
 */
export const COMPETENCY_UNITS: CompetencyUnit[] = WORLDS.map((w, i) => ({
  code: `DB-${String(i + 1).padStart(2, "0")}`,
  title: w.title,
  titleEn: w.title, // kurikulum berbahasa Inggris netral; judul ID = judul EN
  worldNum: w.num,
}));

export const UNIT_BY_WORLD: Map<number, CompetencyUnit> = new Map(
  COMPETENCY_UNITS.map((u) => [u.worldNum, u]),
);

/* --------------------------- Nomor sertifikat -------------------------- */
// Pola: SK/SMK-MUH1-RPL/<tahun>/<seri 6 digit> — seri dari sequence DB, bukan
// Math.random(), agar stabil & tidak berubah saat cetak ulang.
export const CERT_NUMBER_PREFIX = "SK/SMK-MUH1-RPL";

export function formatCertificateNumber(year: number, seq: number): string {
  return `${CERT_NUMBER_PREFIX}/${year}/${String(seq).padStart(6, "0")}`;
}

/* ------------------------------ Verifikasi ----------------------------- */
// Domain publik untuk QR. Tersedia agar verifikasi mudah dikembangkan;
// di-preview dijalankan dari host aktif.
export const PUBLIC_VERIFY_BASE = "https://database.smkmuh1-skh.sch.id";

export function verifyUrlFor(certificateNumber: string): string {
  return `${PUBLIC_VERIFY_BASE}/verify/certificate/${encodeURIComponent(certificateNumber)}`;
}
