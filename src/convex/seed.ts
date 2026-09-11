/**
 * Seeder data dummy — Database Quest Warrior: Mutuharjo
 *
 * Menanam: 6 kelas, 1 admin, 1 guru, 12 siswa (dengan stats, progress lesson,
 * quiz lulus, attempt latihan, badge), dan 1 Weekly Boss minggu berjalan.
 *
 * - Semua akun dibuat lewat `createAccount` resmi Convex Auth (provider
 *   "password") → hash password valid, bisa login langsung dari UI.
 * - Idempotent: user/kelas/boss yang sudah ada dilewati.
 * - Bootstrap-safe: jika deployment masih kosong (0 user), seeder boleh
 *   dijalankan tanpa login. Setelah ada user, hanya guru/admin.
 *
 * Jalankan (ganti key sesuai deployment):
 *   CONVEX_DEPLOY_KEY='prod:xxx|yyy' bunx convex run seed:seedAll
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { createAccount, retrieveAccount } from "@convex-dev/auth/server";
import { getAuthUserId } from "./auth";

/* ------------------------------ konstanta ------------------------------ */

const DEMO_DOMAIN_SISWA = "siswa.mutuharjo.id";
const ADMIN_EMAIL = "admin@mutuharjo.sch.id";
const TEACHER_EMAIL = "guru@mutuharjo.sch.id";
const ADMIN_PASSWORD = "admin12345";
const TEACHER_PASSWORD = "guru12345";
const SISWA_PASSWORD = "siswa12345";

const DEFAULT_CLASSES = [
  "X PPLG 1",
  "X PPLG 2",
  "XI PPLG 1",
  "XI PPLG 2",
  "XII PPLG 1",
  "XII PPLG 2",
];

/** Urutan lesson resmi dari kurikulum (src/lib/curriculum.ts). */
const LESSON_ORDER = [
  "w1-l1", "w1-l2", "w1-l3",
  "w2-l1", "w2-l2",
  "w3-l1", "w3-l2",
  "w4-l1", "w4-l2",
  "w5-l1", "w5-l2",
  "w6-l1", "w6-l2",
  "w7-l1", "w7-l2",
  "w8-l1", "w8-l2",
  "w9-l1", "w9-l2", "w9-l3",
  "w10-l1", "w10-l2", "w10-l3",
  "w11-l1", "w11-l2", "w11-l3",
  "w12-l1", "w12-l2", "w12-l3",
  "w13-l1", "w13-l2",
  "w14-l1", "w14-l2",
  "w15-l1", "w15-l2", "w15-l3",
];

/** Urutan exercise resmi dari kurikulum. */
const EXERCISE_ORDER = [
  "w3-select-all", "w3-select-cols",
  "w4-class-xi1", "w4-gmail", "w4-score-between",
  "w5-top5", "w5-distinct-class",
  "w6-insert", "w6-update-email", "w6-delete-low",
  "w8-join-basic", "w8-left-join-null",
  "w9-count-per-class", "w9-avg-subject", "w9-boss-kantin",
  "w10-top-price", "w10-cheapest-snack", "w10-max-subject",
  "w11-catalog", "w11-count-class-join", "w11-insert-junction",
  "w12-atomic-category", "w12-dup-buyers",
  "w13-select-needed", "w13-low-stock", "w13-top-sold",
  "w14-safe-update", "w14-insert-tx",
  "w15-min-columns", "w15-gmail-audit",
];

/** 12 siswa dummy: [nama, username, kelas, emoji, jumlah lesson selesai]. */
const DEMO_STUDENTS: Array<[string, string, string, string, number]> = [
  ["Andi Pratama", "andi01", "X PPLG 1", "🦊", 12],
  ["Siti Nurhaliza", "siti02", "X PPLG 1", "🌸", 9],
  ["Budi Santoso", "budi03", "X PPLG 2", "🐯", 10],
  ["Raka Wibowo", "raka04", "X PPLG 2", "🐼", 6],
  ["Dewi Lestari", "dewi05", "XI PPLG 1", "🦋", 8],
  ["Fajri Ramadhan", "fajri06", "XI PPLG 1", "🦁", 5],
  ["Gita Permana", "gita07", "XI PPLG 2", "🐬", 7],
  ["Hafiz Rahman", "hafiz08", "XI PPLG 2", "🦅", 3],
  ["Indah Sari", "indah09", "XII PPLG 1", "🐝", 4],
  ["Jazuli Hidayat", "jazuli10", "XII PPLG 1", "🐺", 2],
  ["Kirana Putri", "kirana11", "XII PPLG 2", "🐱", 6],
  ["Lukman Hakim", "lukman12", "XII PPLG 2", "🐲", 1],
];

/* ------------------------------ utilitas ------------------------------ */

/** PRNG deterministik supaya seed bisa direproduksi. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function currentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const DAY = 86_400_000;

async function userCount(ctx: { db: any }): Promise<number> {
  return (await ctx.db.query("users").collect()).length;
}

async function isAdminOrTeacher(ctx: { db: any }): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return false;
  const me = await ctx.db.get(userId);
  return me?.role === "teacher" || me?.role === "admin";
}

/* ------------------------------- status ------------------------------- */

/** Ringkasan isi database — dipakai untuk cek hasil seed. */
export const seedStatus = query({
  args: {},
  handler: async (ctx) => {
    const [users, classes, stats, progress, quizzes, attempts, boss] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("classes").collect(),
        ctx.db.query("studentStats").collect(),
        ctx.db.query("lessonProgress").collect(),
        ctx.db.query("quizSessions").collect(),
        ctx.db.query("exerciseAttempts").collect(),
        ctx.db.query("weeklyBoss").collect(),
      ]);
    return {
      users: users.length,
      teachers: users.filter((u: any) => u.role === "teacher").length,
      admins: users.filter((u: any) => u.role === "admin").length,
      students: users.filter((u: any) => u.role === "student").length,
      classes: classes.length,
      studentStats: stats.length,
      lessonProgress: progress.length,
      quizSessions: quizzes.length,
      exerciseAttempts: attempts.length,
      weeklyBoss: boss.length,
    };
  },
});

/* ------------------------------- seeder ------------------------------- */

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Bootstrap: deployment kosong → bebas. Kalau sudah ada user → guru/admin.
    const total = await userCount(ctx);
    if (total > 0 && !(await isAdminOrTeacher(ctx))) {
      throw new Error(
        "Seeder hanya bisa dijalankan guru/admin (atau saat database masih kosong).",
      );
    }

    const summary = { classes: 0, staff: 0, students: 0, progress: 0, quizzes: 0, attempts: 0, boss: 0 };
    const now = Date.now();

    /* ---- 1. Kelas ---- */
    const existingClasses = await ctx.db.query("classes").withIndex("by_name").collect();
    const haveClass = new Set(existingClasses.map((c: any) => c.name.toLowerCase()));
    for (const name of DEFAULT_CLASSES) {
      if (!haveClass.has(name.toLowerCase())) {
        await ctx.db.insert("classes", { name, createdAt: now });
        summary.classes++;
      }
    }

    /* ---- 2. Admin & Guru ---- */
    async function upsertStaff(email: string, password: string, name: string, username: string, role: "admin" | "teacher") {
      let user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .first();
      if (!user) {
        try {
          await retrieveAccount(ctx, { provider: "password", account: { id: email } });
        } catch {
          await createAccount(ctx, {
            provider: "password",
            account: { id: email, secret: password },
            profile: { email, name } as any,
          });
        }
        user = await ctx.db
          .query("users")
          .withIndex("email", (q: any) => q.eq("email", email))
          .first();
        summary.staff++;
      }
      if (user) {
        await ctx.db.patch(user._id, {
          name,
          username,
          role,
          onboarded: true,
          avatarEmoji: role === "admin" ? "🛡️" : "🧑‍🏫",
        });
      }
    }

    await upsertStaff(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin Mutuharjo", "admin", "admin");
    await upsertStaff(TEACHER_EMAIL, TEACHER_PASSWORD, "Guru Produktif", "guru", "teacher");

    /* ---- 3. Siswa dummy ---- */
    for (let i = 0; i < DEMO_STUDENTS.length; i++) {
      const [name, username, className, emoji, lessonsDone] = DEMO_STUDENTS[i];
      const email = `${username}@${DEMO_DOMAIN_SISWA}`;

      const exists = await ctx.db
        .query("users")
        .withIndex("username", (q: any) => q.eq("username", username))
        .first();
      if (exists) continue; // idempotent

      await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: SISWA_PASSWORD },
        profile: { email, name } as any,
      });
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .first();
      if (!user) continue;

      await ctx.db.patch(user._id, {
        name,
        username,
        className,
        avatarEmoji: emoji,
        role: "student",
        onboarded: true,
      });

      const rng = mulberry(1000 + i * 77);
      const done = LESSON_ORDER.slice(0, lessonsDone);
      const attemptsCount = Math.min(lessonsDone * 2 + 2, EXERCISE_ORDER.length);
      let correct = 0;
      let queries = 0;

      // lessonProgress + quizSessions lulus
      for (let l = 0; l < done.length; l++) {
        const completedAt = now - Math.floor((done.length - l) * DAY * (1 + rng()));
        await ctx.db.insert("lessonProgress", {
          userId: user._id,
          lessonId: done[l],
          status: "completed",
          completedAt,
        });
        summary.progress++;

        if (l < 10) {
          await ctx.db.insert("quizSessions", {
            userId: user._id,
            lessonId: done[l],
            questionIds: ["q1", "q2", "q3", "q4", "q5"],
            optionOrders: [
              [0, 1, 2, 3], [2, 0, 3, 1], [1, 3, 0, 2], [3, 2, 1, 0], [0, 2, 1, 3],
            ],
            answers: [2, 0, 1, 3, 0],
            status: "passed",
            violations: 0,
            createdAt: completedAt - 30 * 60 * 1000,
            expiresAt: completedAt,
          });
          summary.quizzes++;
        }
      }

      // exerciseAttempts
      for (let e = 0; e < attemptsCount; e++) {
        const isCorrect = rng() < 0.85;
        if (isCorrect) correct++;
        const tries = 1 + Math.floor(rng() * 2);
        queries += tries;
        await ctx.db.insert("exerciseAttempts", {
          userId: user._id,
          exerciseId: EXERCISE_ORDER[e],
          queryText: "-- latihan dummy",
          isCorrect,
          hintsUsed: Math.floor(rng() * 3),
          xpEarned: isCorrect ? 15 : 5,
          at: now - Math.floor((attemptsCount - e) * DAY * 0.7 * (1 + rng() * 0.5)),
        });
        summary.attempts++;
      }

      // studentStats — XP konsisten dengan aktivitas di atas
      const streak = Math.floor(rng() * 9);
      const xp = done.length * 120 + correct * 15 + Math.floor(rng() * 50);
      const badges: string[] = [];
      if (attemptsCount > 0) badges.push("first_query");
      if (done.length >= 1) badges.push("first_lesson");
      if (done.length >= 3) badges.push("world_1_complete");
      if (done.length >= 5) badges.push("lesson_5");
      if (correct >= 10) badges.push("exercise_10");

      const today = new Date(now).toISOString().slice(0, 10);
      await ctx.db.insert("studentStats", {
        userId: user._id,
        xp,
        coins: Math.floor(xp / 10),
        streak,
        longestStreak: streak + Math.floor(rng() * 4),
        lastActiveDate: today,
        lessonsCompleted: done.length,
        exercisesDone: attemptsCount,
        exercisesCorrect: correct,
        queriesRun: queries,
        botWins: Math.floor(rng() * 6),
        botLosses: Math.floor(rng() * 4),
        todayDate: today,
        todayExercises: Math.floor(rng() * 3),
        todayCorrect: Math.floor(rng() * 3),
        badges,
        duelRating: 950 + Math.floor(rng() * 250),
        duelWins: Math.floor(rng() * 5),
        duelLosses: Math.floor(rng() * 5),
        duelDraws: 0,
        shopItems: [],
        streakRewardsClaimed: [],
      });
      summary.students++;
    }

    /* ---- 4. Weekly Boss minggu berjalan ---- */
    const weekKey = currentWeekKey();
    const bossExists = await ctx.db
      .query("weeklyBoss")
      .withIndex("by_week", (q: any) => q.eq("weekKey", weekKey))
      .first();
    if (!bossExists) {
      await ctx.db.insert("weeklyBoss", {
        weekKey,
        title: "Boss Mingguan: Analisis Nilai",
        description:
          "Tabel `scores` menyimpan nilai ulangan. Tampilkan RATA-RATA nilai (kolom `score`) dari seluruh siswa. Gunakan agregasi!",
        datasetKey: "school",
        solutionSql: "SELECT AVG(score) AS rata_nilai FROM scores;",
        xp: 150,
        difficulty: "medium",
        createdAt: now,
      });
      summary.boss++;
    }

    return { ok: true as const, ...summary };
  },
});

/* ------------------------------ pembersih ------------------------------ */

/** Hapus SEMUA data dummy siswa (email @siswa.mutuharjo.id) + turunannya. Admin only. */
export const clearDummyStudents = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdminOrTeacher(ctx))) {
      throw new Error("Hanya guru/admin yang bisa membersihkan data dummy.");
    }
    const suffix = "@" + DEMO_DOMAIN_SISWA;
    const dummies = (await ctx.db.query("users").collect()).filter(
      (u: any) => typeof u.email === "string" && u.email.endsWith(suffix),
    );
    let removed = 0;
    for (const u of dummies) {
      for (const table of ["studentStats", "lessonProgress", "exerciseAttempts", "quizSessions"]) {
        for (const doc of await ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", u._id)).collect()) {
          await ctx.db.delete(doc._id);
        }
      }
      for (const acc of await ctx.db.query("authAccounts").collect()) {
        if (acc.id === u.email) await ctx.db.delete(acc._id);
      }
      await ctx.db.delete(u._id);
      removed++;
    }
    return { removed };
  },
});
