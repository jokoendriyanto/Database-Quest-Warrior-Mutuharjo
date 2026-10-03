/**
 * MODUL HRD — lapisan read-only di atas data kompetensi yang sudah ada.
 *
 * Prinsip (PRD Dashboard HRD):
 * - Additive: tidak mengubah fungsi siswa/guru/admin mana pun.
 * - Reuse: Skill Matrix dari exerciseAttempts (sama dengan certificates.ts),
 *   sertifikat dari tabel `certificates`, statistik dari `studentStats`.
 * - Least privilege: HRD hanya melihat kandidat dengan consentProfile = true.
 * - Audit: akses profil dicatat ke hrdActivityLogs.
 *
 * HANYA fungsi pembacaan + shortlist/consent milik HRD/siswa sendiri.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { COMPETENCY_UNITS, COMPETENT_THRESHOLD } from "../lib/certificate";
import { EXERCISE_MAP } from "../lib/curriculum";
import { levelFromXp, rankFromLevel } from "../lib/game";

const MIN_ATTEMPTS = 3; // sama dengan aturan Skill Matrix di certificates.ts

/* ----------------------------- helpers ---------------------------------- */

/** Ambil user sesi + pastikan role hrd. Throw jika bukan HRD. */
async function requireHrd(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const me = await ctx.db.get(userId);
  if (!me || me.role !== "hrd") throw new Error("Hanya akun HRD.");
  return me;
}

/** Skill Matrix seorang siswa — logika identik dengan certificates.ts. */
async function matrixFor(ctx: any, studentId: any) {
  const attempts = await ctx.db
    .query("exerciseAttempts")
    .withIndex("by_user", (q: any) => q.eq("userId", studentId))
    .collect();

  const perWorld = new Map<number, { attempts: number; correct: number }>();
  for (const a of attempts) {
    const ex = EXERCISE_MAP.get(a.exerciseId);
    if (!ex) continue;
    const rec = perWorld.get(ex.worldNum) ?? { attempts: 0, correct: 0 };
    rec.attempts++;
    if (a.isCorrect) rec.correct++;
    perWorld.set(ex.worldNum, rec);
  }

  return COMPETENCY_UNITS.map((u) => {
    const rec = perWorld.get(u.worldNum);
    const accuracy =
      rec && rec.attempts > 0
        ? Math.round((rec.correct / rec.attempts) * 100)
        : 0;
    const competent =
      rec !== undefined &&
      rec.attempts >= MIN_ATTEMPTS &&
      accuracy >= COMPETENT_THRESHOLD;
    return {
      code: u.code,
      title: u.title,
      worldNum: u.worldNum,
      accuracy,
      attempts: rec?.attempts ?? 0,
      competent,
    };
  });
}

async function logActivity(
  ctx: any,
  hrdUserId: any,
  action: string,
  studentId?: any,
  detail?: string,
) {
  await ctx.db.insert("hrdActivityLogs", {
    hrdUserId,
    action,
    studentId: studentId ?? undefined,
    detail: detail ?? undefined,
    at: Date.now(),
  });
}

/**
 * Catat jejak audit dari sisi klien.
 *
 * Query Convex TIDAK BOLEH menulis ke database — itulah why log tidak lagi
 * dipanggil dari dalam query. Halaman memanggil mutasi ini setelah query
 * terkait berhasil di sisi klien.
 */
export const logHrdActivity = mutation({
  args: {
    action: v.string(),
    studentId: v.optional(v.id("users")),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireHrd(ctx);
    await logActivity(ctx, me._id, args.action, args.studentId, args.detail);
    return { ok: true };
  },
});

/* ------------------------------- akun HRD -------------------------------- */

/**
 * Promosikan akun baru menjadi HRD + daftarkan perusahaan sekaligus.
 * Hanya diizinkan untuk akun yang belum punya role siswa/guru/admin —
 * akun pembelajaran tidak boleh dikonversi menjadi HRD.
 */
export const registerHrdAccount = mutation({
  args: {
    companyName: v.string(),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    about: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me) throw new Error("Not authenticated");
    if (
      me.role === "student" ||
      me.role === "teacher" ||
      me.role === "admin"
    ) {
      throw new Error(
        "Akun pembelajaran tidak bisa jadi HRD. Gunakan email perusahaan.",
      );
    }
    if (!args.companyName.trim()) {
      throw new Error("Nama perusahaan wajib diisi.");
    }

    // Set role hrd (idempoten untuk akun yang sudah hrd) + nama rekruter
    if (me.role !== "hrd") {
      await ctx.db.patch(userId, { role: "hrd" });
    }
    if (args.name?.trim() && !me.name) {
      await ctx.db.patch(userId, { name: args.name.trim() });
    }

    // Perusahaan: buat sekali, idempoten per akun HRD
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_creator", (q: any) => q.eq("createdBy", userId))
      .first();
    if (existing) return { companyId: existing._id, created: false };

    const companyId = await ctx.db.insert("companies", {
      name: args.companyName.trim(),
      industry: args.industry ?? undefined,
      website: args.website ?? undefined,
      about: args.about ?? undefined,
      createdBy: userId,
      createdAt: Date.now(),
    });
    return { companyId, created: true };
  },
});

/**
 * Daftarkan perusahaan untuk akun HRD yang sedang login.
 * Dipanggil sekali setelah registrasi HRD (idempoten).
 */
export const registerCompany = mutation({
  args: {
    companyName: v.string(),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    about: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "hrd") throw new Error("Hanya akun HRD.");

    const existing = await ctx.db
      .query("companies")
      .withIndex("by_creator", (q: any) => q.eq("createdBy", userId))
      .first();
    if (existing) return { companyId: existing._id, created: false };

    const companyId = await ctx.db.insert("companies", {
      name: args.companyName.trim(),
      industry: args.industry ?? undefined,
      website: args.website ?? undefined,
      about: args.about ?? undefined,
      createdBy: userId,
      createdAt: Date.now(),
    });
    return { companyId, created: true };
  },
});

/** Profil perusahaan milik HRD ini (untuk halaman Company Profile). */
export const myCompany = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "hrd") return null;
    const company = await ctx.db
      .query("companies")
      .withIndex("by_creator", (q: any) => q.eq("createdBy", userId))
      .first();
    return company
      ? {
          _id: company._id,
          name: company.name,
          industry: company.industry ?? null,
          website: company.website ?? null,
          about: company.about ?? null,
        }
      : null;
  },
});

/* ----------------------------- candidate pool ---------------------------- */

/**
 * Candidate Pool — HANYA siswa dengan consentProfile = true.
 * Ringkasan ringan untuk daftar: identitas dasar + agregat kompetensi.
 */
export const candidatePool = query({
  args: {
    search: v.optional(v.string()),
    className: v.optional(v.string()),
    minAccuracy: v.optional(v.number()),
    onlyCompetent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireHrd(ctx);

    const profiles = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_consent", (q: any) => q.eq("consentProfile", true))
      .collect();

    const search = args.search?.trim().toLowerCase();

    const out = [];
    for (const p of profiles) {
      const student = await ctx.db.get(p.studentId);
      if (!student || student.role !== "student") continue;
      if (args.className && student.className !== args.className) continue;

      const matrix = await matrixFor(ctx, p.studentId);
      const totalUnits = matrix.length;
      const competentUnits = matrix.filter((c) => c.competent).length;
      const attempted = matrix.filter((c) => c.attempts > 0);
      const avgAccuracy = attempted.length
        ? Math.round(
            attempted.reduce((s: number, c: any) => s + c.accuracy, 0) /
              attempted.length,
          )
        : 0;
      const topSkills = attempted
        .filter((c: any) => c.accuracy > 0)
        .sort((a: any, b: any) => b.accuracy - a.accuracy)
        .slice(0, 3)
        .map((c: any) => ({ title: c.title, accuracy: c.accuracy }));

      if (args.onlyCompetent && competentUnits === 0) continue;
      if (args.minAccuracy !== undefined && avgAccuracy < args.minAccuracy)
        continue;
      if (search) {
        const hay = `${student.name ?? ""} ${student.username ?? ""} ${
          student.className ?? ""
        } ${p.headline ?? ""} ${topSkills.map((s) => s.title).join(" ")}`.toLowerCase();
        if (!hay.includes(search)) continue;
      }

      const certCount = (
        await ctx.db
          .query("certificates")
          .withIndex("by_student", (q: any) => q.eq("studentId", p.studentId))
          .collect()
      ).filter((c: any) => c.status === "issued").length;

      out.push({
        studentId: p.studentId,
        name: student.name ?? student.username ?? "Kandidat",
        username: student.username ?? "",
        className: student.className ?? null,
        avatarEmoji: student.avatarEmoji ?? null,
        headline: p.headline ?? null,
        availability: p.availability,
        consentPortfolio: p.consentPortfolio,
        consentCertificate: p.consentCertificate,
        consentContact: p.consentContact,
      competentUnits,
      totalUnits,
      avgAccuracy,
      topSkills,
      competentTitles: matrix
        .filter((c) => c.competent)
        .map((c) => c.title),
      certCount,
      });
    }

    // Query ini reaktif dan bisa dievaluasi ulang berkali-kali. Jejak
    // pencarian dicatat dari klien lewat mutasi logHrdActivity.
    return out;
  },
});

/* --------------------------- candidate profile --------------------------- */

/**
 * Profil kompetensi kandidat untuk HRD.
 * Menolak (null) jika consentProfile siswa = false.
 * Setiap akses sukses dicatat ke log aktivitas.
 */
export const candidateProfile = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    await requireHrd(ctx);

    const profile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
      .first();
    if (!profile || !profile.consentProfile) return null; // privat

    const student = await ctx.db.get(studentId);
    if (!student || student.role !== "student") return null;

    const matrix = await matrixFor(ctx, studentId);
    const stats = await ctx.db
      .query("studentStats")
      .withIndex("by_user", (q: any) => q.eq("userId", studentId))
      .first();

    // Sertifikat hanya jika siswa mengizinkan (consentCertificate).
    let certificates: Array<{
      certificateNumber: string;
      schemeName: string;
      issuedAt: number;
      status: string;
    }> = [];
    if (profile.consentCertificate) {
      const certs = await ctx.db
        .query("certificates")
        .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
        .collect();
      certificates = certs
        .filter((c: any) => c.status === "issued")
        .map((c: any) => ({
          certificateNumber: c.certificateNumber,
          schemeName: c.schemeName,
          issuedAt: c.issuedAt,
          status: c.status,
        }));
    }

    // Portfolio hanya yang published DAN consentPortfolio = true.
    let portfolio: Array<{
      _id: any;
      title: string;
      description: string;
      problemSolved: string | null;
      techStack: string[];
      skills: string[];
    }> = [];
    if (profile.consentPortfolio) {
      const items = await ctx.db
        .query("candidatePortfolio")
        .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
        .collect();
      portfolio = items
        .filter((i: any) => i.published)
        .map((i: any) => ({
          _id: i._id,
          title: i.title,
          description: i.description,
          problemSolved: i.problemSolved ?? null,
          techStack: i.techStack ?? [],
          skills: i.skills ?? [],
        }));
    }

    return {
      name: student.name ?? student.username ?? "Kandidat",
      username: student.username ?? "",
      className: student.className ?? null,
      avatarEmoji: student.avatarEmoji ?? null,
      headline: profile.headline ?? null,
      summary: profile.summary ?? null,
      availability: profile.availability,
      consentPortfolio: profile.consentPortfolio,
      consentCertificate: profile.consentCertificate,
      consentContact: profile.consentContact,
      matrix,
      competenciesTotal: COMPETENCY_UNITS.length,
      competentUnits: matrix.filter((c) => c.competent).length,
      xp: stats?.xp ?? 0,
      level: stats ? levelFromXp(stats.xp) : null,
      rank: stats ? rankFromLevel(levelFromXp(stats.xp)).name : null,
      queriesRun: stats?.queriesRun ?? 0,
      exercisesDone: stats?.exercisesDone ?? 0,
      botWins: stats?.botWins ?? 0,
      certificates,
      portfolio,
    };
  },
});

/**
 * Evidence per unit kompetensi — jejak attempt nyata yang mendukung level.
 * Hanya untuk kandidat yang mengizinkan profilnya tampil.
 */
export const candidateEvidence = query({
  args: {
    studentId: v.id("users"),
    worldNum: v.number(),
  },
  handler: async (ctx, { studentId, worldNum }) => {
    await requireHrd(ctx);

    const profile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
      .first();
    if (!profile || !profile.consentProfile) return null;

    const attempts = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user", (q: any) => q.eq("userId", studentId))
      .collect();

    const evidence = attempts
      .map((a: any) => {
        const ex = EXERCISE_MAP.get(a.exerciseId);
        if (!ex || ex.worldNum !== worldNum) return null;
        return {
          exerciseId: a.exerciseId,
          title: ex.title,
          difficulty: ex.difficulty,
          isCorrect: a.isCorrect,
          hintsUsed: a.hintsUsed,
          xpEarned: a.xpEarned,
          at: a.at,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.at - a.at)
      .slice(0, 30);

    return { worldNum, evidence };
  },
});

/* ------------------------- siswa: consent & portfolio -------------------- */

/**
 * Simpan/ubah pengaturan Talent Profile milik SISWA sendiri.
 * Default semua consent false — siswa harus mengaktifkan secara eksplisit.
 */
export const updateMyTalentProfile = mutation({
  args: {
    headline: v.optional(v.string()),
    summary: v.optional(v.string()),
    availability: v.optional(
      v.union(
        v.literal("open"),
        v.literal("looking"),
        v.literal("not_available"),
      ),
    ),
    consentProfile: v.optional(v.boolean()),
    consentPortfolio: v.optional(v.boolean()),
    consentCertificate: v.optional(v.boolean()),
    consentContact: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "student") {
      throw new Error("Hanya akun siswa yang punya Talent Profile.");
    }

    const existing = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_student", (q: any) => q.eq("studentId", userId))
      .first();

    if (!existing) {
      // Non-konsen default: jika siswa menyimpan profil tanpa menyalakan
      // consent apa pun, tetap dibuat dengan consentProfile false.
      await ctx.db.insert("candidateProfiles", {
        studentId: userId,
        headline: args.headline ?? undefined,
        summary: args.summary ?? undefined,
        availability: args.availability ?? "not_available",
        consentProfile: args.consentProfile ?? false,
        consentPortfolio: args.consentPortfolio ?? false,
        consentCertificate: args.consentCertificate ?? false,
        consentContact: args.consentContact ?? false,
        updatedAt: Date.now(),
      });
      return { ok: true };
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.headline !== undefined) patch.headline = args.headline;
    if (args.summary !== undefined) patch.summary = args.summary;
    if (args.availability !== undefined) patch.availability = args.availability;
    if (args.consentProfile !== undefined)
      patch.consentProfile = args.consentProfile;
    if (args.consentPortfolio !== undefined)
      patch.consentPortfolio = args.consentPortfolio;
    if (args.consentCertificate !== undefined)
      patch.consentCertificate = args.consentCertificate;
    if (args.consentContact !== undefined)
      patch.consentContact = args.consentContact;
    await ctx.db.patch(existing._id, patch);
    return { ok: true };
  },
});

/** Lihat Talent Profile milik sendiri (siswa). */
export const myTalentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "student") return null;
    const p = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_student", (q: any) => q.eq("studentId", userId))
      .first();
    return p
      ? {
          headline: p.headline ?? "",
          summary: p.summary ?? "",
          availability: p.availability,
          consentProfile: p.consentProfile,
          consentPortfolio: p.consentPortfolio,
          consentCertificate: p.consentCertificate,
          consentContact: p.consentContact,
        }
      : null;
  },
});

/** Tambah item portfolio (siswa). Default published = false (privat). */
export const addPortfolioItem = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    problemSolved: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    schemaNote: v.optional(v.string()),
    querySample: v.optional(v.string()),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "student") throw new Error("Hanya akun siswa.");

    await ctx.db.insert("candidatePortfolio", {
      studentId: userId,
      title: args.title.trim(),
      description: args.description.trim(),
      problemSolved: args.problemSolved ?? undefined,
      techStack: args.techStack ?? undefined,
      skills: args.skills ?? undefined,
      schemaNote: args.schemaNote ?? undefined,
      querySample: args.querySample ?? undefined,
      published: args.published,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Daftar portfolio milik sendiri (siswa). */
export const myPortfolio = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "student") return [];
    const items = await ctx.db
      .query("candidatePortfolio")
      .withIndex("by_student", (q: any) => q.eq("studentId", userId))
      .collect();
    return items.map((i: any) => ({
      _id: i._id as string,
      title: i.title,
      description: i.description,
      problemSolved: i.problemSolved ?? null,
      techStack: i.techStack ?? [],
      skills: i.skills ?? [],
      querySample: i.querySample ?? null,
      published: i.published,
      createdAt: i.createdAt,
    }));
  },
});

/** Publish / unpublish item portfolio (siswa, miliknya). */
export const setPortfolioPublished = mutation({
  args: { itemId: v.id("candidatePortfolio"), published: v.boolean() },
  handler: async (ctx, { itemId, published }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item || item.studentId !== userId) {
      throw new Error("Item tidak ditemukan.");
    }
    await ctx.db.patch(itemId, { published });
    return { ok: true };
  },
});

/* -------------------------------- shortlist ------------------------------ */

/** Simpan / perbarui status shortlist (HRD). Data privat per perusahaan. */
export const upsertShortlist = mutation({
  args: {
    studentId: v.id("users"),
    status: v.union(
      v.literal("saved"),
      v.literal("reviewed"),
      v.literal("shortlisted"),
      v.literal("contacted"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { studentId, status, note }) => {
    const me = await requireHrd(ctx);

    // Kandidat harus masih consent — tidak bisa menyimpan siswa privat.
    const profile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_student", (q: any) => q.eq("studentId", studentId))
      .first();
    if (!profile || !profile.consentProfile) {
      throw new Error("Kandidat tidak tersedia (profil privat).");
    }

    const existing = await ctx.db
      .query("shortlists")
      .withIndex("by_hrd_student", (q: any) =>
        q.eq("hrdUserId", me._id).eq("studentId", studentId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status,
        note: note ?? existing.note,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("shortlists", {
        hrdUserId: me._id,
        studentId,
        status,
        note: note ?? undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    await logActivity(ctx, me._id, "shortlist_update", studentId, status);
    return { ok: true };
  },
});

/** Daftar shortlist milik HRD ini (privat). */
export const myShortlist = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireHrd(ctx);
    const rows = await ctx.db
      .query("shortlists")
      .withIndex("by_hrd", (q: any) => q.eq("hrdUserId", me._id))
      .collect();

    const out = [];
    for (const r of rows) {
      const student = await ctx.db.get(r.studentId);
      if (!student) continue;
      out.push({
        _id: r._id as string,
        studentId: r.studentId,
        name: student.name ?? student.username ?? "Kandidat",
        username: student.username ?? "",
        className: student.className ?? null,
        status: r.status,
        note: r.note ?? null,
        updatedAt: r.updatedAt,
      });
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/** Status shortlist HRD ini untuk satu kandidat (untuk tombol di profil). */
export const shortlistStatus = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, { studentId }) => {
    const me = await requireHrd(ctx);
    const row = await ctx.db
      .query("shortlists")
      .withIndex("by_hrd_student", (q: any) =>
        q.eq("hrdUserId", me._id).eq("studentId", studentId),
      )
      .first();
    return row ? { status: row.status, note: row.note ?? null } : null;
  },
});

/* ------------------------------ overview & log --------------------------- */

/**
 * Overview dashboard HRD — semua angka dari data aktual:
 - kandidat tersedia (consentProfile),
 - kandidat baru 7 hari terakhir,
 - distribusi kompetensi (unit kompeten),
 - shortlist milik HRD ini.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireHrd(ctx);

    const profiles = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_consent", (q: any) => q.eq("consentProfile", true))
      .collect();

    const weekAgo = Date.now() - 7 * 86400000;
    let newThisWeek = 0;
    const skillDist = new Map<string, number>();

    for (const p of profiles) {
      if (p.updatedAt >= weekAgo) newThisWeek++;
      const matrix = await matrixFor(ctx, p.studentId);
      for (const c of matrix) {
        if (c.competent) {
          skillDist.set(c.title, (skillDist.get(c.title) ?? 0) + 1);
        }
      }
    }

    const distribution = [...skillDist.entries()]
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const shortlist = await ctx.db
      .query("shortlists")
      .withIndex("by_hrd", (q: any) => q.eq("hrdUserId", me._id))
      .collect();

    const byStatus = {
      saved: shortlist.filter((s: any) => s.status === "saved").length,
      reviewed: shortlist.filter((s: any) => s.status === "reviewed").length,
      shortlisted: shortlist.filter((s: any) => s.status === "shortlisted")
        .length,
      contacted: shortlist.filter((s: any) => s.status === "contacted").length,
    };

    return {
      availableCandidates: profiles.length,
      newThisWeek,
      distribution,
      shortlistTotal: shortlist.length,
      shortlistByStatus: byStatus,
    };
  },
});

/** Log aktivitas HRD ini (audit trail). */
export const myActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const me = await requireHrd(ctx);
    const rows = await ctx.db
      .query("hrdActivityLogs")
      .withIndex("by_hrd", (q: any) => q.eq("hrdUserId", me._id))
      .collect();
    return rows
      .sort((a: any, b: any) => b.at - a.at)
      .slice(0, limit ?? 50)
      .map((r: any) => ({
        _id: r._id as string,
        action: r.action,
        studentId: r.studentId ?? null,
        detail: r.detail ?? null,
        at: r.at,
      }));
  },
});

/* --------------------------- verifikasi sertifikat ----------------------- */

/**
 * Verifikasi sertifikat oleh HRD (butuh login HRD).
 * Reuse tabel `certificates` — tidak ada sistem sertifikat kedua.
 */
export const verifyCertificate = query({
  args: { certificateNumber: v.string() },handler: async (ctx, { certificateNumber }) => {
    await requireHrd(ctx);

    const cert = await ctx.db
      .query("certificates")
      .withIndex("by_number", (q: any) =>
        q.eq("certificateNumber", certificateNumber.trim()),
      )
      .first();
    if (!cert) return null;
    return {
      certificateNumber: cert.certificateNumber,
      studentId: cert.studentId,
      studentName: cert.studentName,
      studentUsername: cert.studentUsername,
      className: cert.className ?? null,
      schemeName: cert.schemeName,
      competencies: cert.competencies.map((c: any) => ({
        code: c.code,
        title: c.title,
        accuracy: c.accuracy,
      })),
      status: cert.status,
      issuedAt: cert.issuedAt,
      validUntil: cert.validUntil ?? null,
    };
  },
});
