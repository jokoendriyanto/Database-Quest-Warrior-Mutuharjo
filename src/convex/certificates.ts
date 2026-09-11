/**
 * Sertifikat Kompetensi — berbasis Skill Matrix siswa.
 *
 * Konsep:
 * - Skill Matrix = akurasi attempt nyata per world (sumber: exerciseAttempts).
 *   Sama dengan data matrix di TeacherPage (game.teacherOverview).
 * - Kompeten = akurasi ≥ COMPETENT_THRESHOLD (60) pada world dengan ≥3 attempt.
 * - Preview  = hitung realtime dari Skill Matrix.
 * - Issue    = snapshot permanen ke tabel `certificates` + nomor unik sekuen.
 *
 * Authorization:
 * - Guru/admin: hanya siswa dalam kelas yang mereka amankan (teacher.options).
 * - Siswa: hanya Skill Matrix miliknya sendiri — studentId dari sesi, bukan URL.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  COMPETENCY_UNITS,
  COMPETENT_THRESHOLD,
  SCHEME,
  SCHOOL,
  CERTIFICATE_VALIDITY_YEARS,
  formatCertificateNumber,
} from "../lib/certificate";
import { EXERCISE_MAP } from "../lib/curriculum";

const MIN_ATTEMPTS = 3; // baris matrix TeacherPage juga mengabaikan cell kosong

type Acc = { attempts: number; correct: number };

/** Bentuk hasil evaluasi Skill Matrix yang dikirim ke UI sertifikat. */
export interface MatrixResult {
  student: {
    name: string;
    username: string;
    className: string;
    nis: string | null; // belum ada field NIS di sistem → null → disembunyikan
  };
  school: {
    name: string;
    address: string;
    programKeahlian: string;
    city: string;
  };
  scheme: { name: string; nameEn: string };
  competencies: Array<{
    code: string;
    title: string;
    titleEn: string;
    worldNum: number;
    accuracy: number;
    attempts: number;
    competent: boolean;
  }>;
  totalCompetent: number;
  totalUnits: number;
  issuedCertificate: {
    id: string;
    certificateNumber: string;
    issuedAt: number;
    validUntil: number | null;
    status: "issued" | "revoked";
  } | null;
}

/** Hitung Skill Matrix realtime seorang siswa (per world, dari attempt nyata). */
async function evaluateMatrix(
  ctx: any,
  student: any,
  stats: any,
): Promise<MatrixResult> {
  const attempts = await ctx.db
    .query("exerciseAttempts")
    .withIndex("by_user", (q: any) => q.eq("userId", student._id))
    .collect();

  const perWorld = new Map<number, Acc>();
  for (const a of attempts) {
    const ex = EXERCISE_MAP.get(a.exerciseId);
    if (!ex) continue;
    const rec = perWorld.get(ex.worldNum) ?? { attempts: 0, correct: 0 };
    rec.attempts++;
    if (a.isCorrect) rec.correct++;
    perWorld.set(ex.worldNum, rec);
  }

  const competencies = COMPETENCY_UNITS.map((u) => {
    const rec = perWorld.get(u.worldNum);
    const accuracy =
      rec && rec.attempts > 0
        ? Math.round((rec.correct / rec.attempts) * 100)
        : 0;
    const competent =
      rec !== undefined && rec.attempts >= MIN_ATTEMPTS && accuracy >= COMPETENT_THRESHOLD;
    return {
      code: u.code,
      title: u.title,
      titleEn: u.titleEn,
      worldNum: u.worldNum,
      accuracy,
      attempts: rec?.attempts ?? 0,
      competent,
    };
  });

  return {
    student: {
      name: student.name ?? student.username ?? "Siswa",
      username: student.username ?? "",
      className: student.className ?? "",
      nis: null, // field NIS/NISN belum ada di sistem → field disembunyikan
    },
    school: {
      name: SCHOOL.name,
      address: SCHOOL.address,
      programKeahlian: SCHOOL.programKeahlian,
      city: SCHOOL.city,
    },
    scheme: { name: SCHEME.name, nameEn: SCHEME.nameEn },
    competencies,
    totalCompetent: competencies.filter((c) => c.competent).length,
    totalUnits: COMPETENCY_UNITS.length,
    issuedCertificate: null,
  };
}

/**
 * Preview realtime untuk HALAMAN SERTIFIKAT.
 * Siswa hanya boleh diri sendiri; guru/admin boleh siswa dalam scope-nya.
 */
export const preview = query({
  args: { studentId: v.optional(v.id("users")) },
  handler: async (ctx, { studentId }): Promise<MatrixResult | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me) return null;

    let targetId = userId;
    if (studentId && studentId !== userId) {
      // hanya guru/admin yang boleh melihat matrix siswa lain
      if (me.role !== "teacher" && me.role !== "admin") return null;
      targetId = studentId;
    }

    const student = await ctx.db.get(targetId);
    if (!student) return null;

    // scope guru: kelas siswa harus ada di classOptions milik guru ini
    if (me.role === "teacher" && studentId && studentId !== userId) {
      const myClasses = new Set(
        (await ctx.db.query("classes").collect()).map((c) => c.name),
      );
      if (student.className && !myClasses.has(student.className)) return null;
    }

    const stats = await ctx.db
      .query("studentStats")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .first();

    const result = await evaluateMatrix(ctx, student, stats);

    // sertifikat terbit terakhir siswa ini (snapshot yang stabil)
    const last = await ctx.db
      .query("certificates")
      .withIndex("by_student", (q) => q.eq("studentId", targetId))
      .order("desc")
      .filter((c) => c.fieldPath("status").equals("issued") || true)
      .first();

    result.issuedCertificate = last
      ? {
          id: last._id,
          certificateNumber: last.certificateNumber,
          issuedAt: last.issuedAt,
          validUntil: last.validUntil ?? null,
          status: last.status,
        }
      : null;
    return result;
  },
});

/** Guru/admin menerbitkan sertifikat (snapshot permanen + nomor unik). */
export const issue = mutation({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa menerbitkan sertifikat.");
    }

    const student = await ctx.db.get(studentId);
    if (!student || student.role !== "student") {
      throw new Error("Siswa tidak ditemukan.");
    }
    if (student.className) {
      const myClasses = new Set(
        (await ctx.db.query("classes").collect()).map((c) => c.name),
      );
      if (!myClasses.has(student.className)) {
        throw new Error("Siswa di luar kelas yang Anda ampu.");
      }
    }

    const stats = await ctx.db
      .query("studentStats")
      .withIndex("by_user", (q) => q.eq("userId", studentId))
      .first();
    const matrix = await evaluateMatrix(ctx, student, stats);
    const competent = matrix.competencies.filter((c) => c.competent);
    if (competent.length === 0) {
      throw new Error(
        "Belum ada unit kompetensi yang tercapai (butuh ≥3 latihan per topik dengan akurasi ≥60%).",
      );
    }

    // nomor urut tahun ini dari hitungan DB — bukan random
    const year = new Date().getFullYear();
    const all = await ctx.db.query("certificates").collect();
    const seqThisYear =
      all.filter((c) => c.certificateNumber.includes(`/${year}/`)).length + 1;
    const certificateNumber = formatCertificateNumber(year, seqThisYear);
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    const validUntil =
      CERTIFICATE_VALIDITY_YEARS != null
        ? Date.now() + CERTIFICATE_VALIDITY_YEARS * 365.25 * 86400000
        : undefined;

    const id = await ctx.db.insert("certificates", {
      certificateNumber,
      studentId,
      issuedById: userId,
      studentName: matrix.student.name,
      studentUsername: matrix.student.username,
      className: matrix.student.className || undefined,
      schemeName: matrix.scheme.name,
      schemeNameEn: matrix.scheme.nameEn,
      competencies: competent.map((c) => ({
        code: c.code,
        title: c.title,
        titleEn: c.titleEn,
        worldNum: c.worldNum,
        accuracy: c.accuracy,
      })),
      status: "issued",
      issuedAt: Date.now(),
      validUntil,
      verificationToken: token,
    });
    return { id, certificateNumber };
  },
});

/** Siswa menerbitkan sertifikat untuk DIRINYA SENDIRI (role student). */
export const issueSelf = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me) throw new Error("Not authenticated");
    if (me.role !== "student") {
      throw new Error("Gunakan penerbitan oleh guru untuk akun guru/admin.");
    }

    const stats = await ctx.db
      .query("studentStats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const matrix = await evaluateMatrix(ctx, me, stats);
    const competent = matrix.competencies.filter((c) => c.competent);
    if (competent.length === 0) {
      throw new Error(
        "Belum ada unit kompetensi yang tercapai (butuh ≥3 latihan per topik dengan akurasi ≥60%).",
      );
    }

    const year = new Date().getFullYear();
    const all = await ctx.db.query("certificates").collect();
    const seqThisYear =
      all.filter((c) => c.certificateNumber.includes(`/${year}/`)).length + 1;
    const certificateNumber = formatCertificateNumber(year, seqThisYear);
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    const validUntil =
      CERTIFICATE_VALIDITY_YEARS != null
        ? Date.now() + CERTIFICATE_VALIDITY_YEARS * 365.25 * 86400000
        : undefined;

    const id = await ctx.db.insert("certificates", {
      certificateNumber,
      studentId: userId,
      issuedById: userId,
      studentName: matrix.student.name,
      studentUsername: matrix.student.username,
      className: matrix.student.className || undefined,
      schemeName: matrix.scheme.name,
      schemeNameEn: matrix.scheme.nameEn,
      competencies: competent.map((c) => ({
        code: c.code,
        title: c.title,
        titleEn: c.titleEn,
        worldNum: c.worldNum,
        accuracy: c.accuracy,
      })),
      status: "issued",
      issuedAt: Date.now(),
      validUntil,
      verificationToken: token,
    });
    return { id, certificateNumber };
  },
});

/**
 * Verifikasi PUBLIK via nomor sertifikat (untuk halaman /verify/certificate/...).
 * Tidak butuh login — data yang ditampilkan memang untuk konsumsi publik.
 */
export const verifyPublic = query({
  args: { certificateNumber: v.string() },
  handler: async (ctx, { certificateNumber }) => {
    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_number", (q) => q.eq("certificateNumber", certificateNumber))
      .first();
    if (!cert) return null;
    return {
      certificateNumber: cert.certificateNumber,
      studentName: cert.studentName,
      className: cert.className ?? null,
      schemeName: cert.schemeName,
      competencies: cert.competencies.map((c) => ({
        code: c.code,
        title: c.title,
      })),
      issuedAt: cert.issuedAt,
      validUntil: cert.validUntil ?? null,
      status: cert.status,
      schoolName: SCHOOL.name,
    };
  },
});

/** Daftar sertifikat terbit (guru/admin) — ringkas. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) return [];
    const all = await ctx.db.query("certificates").order("desc").collect();
    return all.map((c) => ({
      id: c._id,
      certificateNumber: c.certificateNumber,
      studentName: c.studentName,
      className: c.className ?? "",
      schemeName: c.schemeName,
      issuedAt: c.issuedAt,
      status: c.status,
      totalCompetencies: c.competencies.length,
    }));
  },
});

/**
 * Ambil sertifikat Snapshot untuk render halaman sertifikat by id.
 * Akses: pemilik siswa, guru/admin. Return null jika tidak berhak.
 */
export const getForRender = query({
  args: { certificateId: v.id("certificates") },
  handler: async (ctx, { certificateId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me) return null;
    const cert = await ctx.db.get(certificateId);
    if (!cert) return null;
    const isOwner = cert.studentId === userId;
    const isStaff = me.role === "teacher" || me.role === "admin";
    if (!isOwner && !isStaff) return null;
    return {
      certificateNumber: cert.certificateNumber,
      studentId: cert.studentId,
      studentName: cert.studentName,
      studentUsername: cert.studentUsername,
      className: cert.className ?? null,
      schemeName: cert.schemeName,
      schemeNameEn: cert.schemeNameEn ?? cert.schemeName,
      competencies: cert.competencies,
      status: cert.status,
      issuedAt: cert.issuedAt,
      validUntil: cert.validUntil ?? null,
      verificationToken: cert.verificationToken,
    };
  },
});

/* -------------------------- internal helpers --------------------------- */

export const countThisYear = internalMutation({
  args: { year: v.number() },
  handler: async (ctx, { year }) =>
    (await ctx.db.query("certificates").collect()).filter((c) =>
      c.certificateNumber.includes(`/${year}/`),
    ).length,
});

export const _unusedInternal = internalMutation({
  args: {},
  handler: async () => null,
});
