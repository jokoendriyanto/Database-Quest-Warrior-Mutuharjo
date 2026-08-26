import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { kantinDb, schoolDb } from "../lib/data/datasets";
import { runSql, resultsMatch, SqlError, type RunResult } from "../lib/sql/engine";
import { getStats, awardXp } from "./gameState";

const DATASETS: Record<string, any> = { school: schoolDb, kantin: kantinDb };
const CHALLENGE_XP = 60;

function datasetFor(key: string) {
  const db = DATASETS[key];
  if (!db) {
    throw new Error("Dataset tidak dikenal. Pilihan: school, kantin.");
  }
  return db;
}

/* ------------------------------ guru -------------------------------------- */

/** Guru membuat studi kasus: prompt + dataset + query jawaban (divalidasi). */
export const create = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    datasetKey: v.string(),
    solutionSql: v.string(),
    xp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa membuat challenge.");
    }

    const title = args.title.trim();
    const prompt = args.prompt.trim();
    if (!title) throw new Error("Judul challenge tidak boleh kosong.");
    if (!prompt) throw new Error("Instruksi kasus tidak boleh kosong.");

    const db = datasetFor(args.datasetKey);

    // query jawaban HARUS jalan di dataset — kalau error, tolak
    let expected;
    try {
      expected = runSql(args.solutionSql, db);
    } catch (err) {
      if (err instanceof SqlError) {
        throw new Error(`Query jawaban gagal dieksekusi: ${err.message}`);
      }
      throw err;
    }
    if (expected.kind !== "select") {
      throw new Error("Query jawaban harus berupa SELECT (hasilnya dibandingkan ke siswa).");
    }

    const id = await ctx.db.insert("customChallenges", {
      teacherId: userId,
      title,
      prompt,
      datasetKey: args.datasetKey,
      solutionSql: args.solutionSql.trim(),
      xp: Math.min(200, Math.max(10, args.xp ?? CHALLENGE_XP)),
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const remove = mutation({
  args: { id: v.id("customChallenges") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa menghapus challenge.");
    }
    const subs = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge_user", (q) => q.eq("challengeId", id))
      .collect();
    for (const s of subs) await ctx.db.delete(s._id);
    await ctx.db.delete(id);
    return { ok: true };
  },
});

/** Daftar challenge untuk guru: + statistik pengerjaan. */
export const listForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { denied: true as const, challenges: [] };
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      return { denied: true as const, challenges: [] };
    }
    const rows = await ctx.db.query("customChallenges").order("desc").take(100);
    const challenges = [];
    for (const c of rows) {
      const subs = await ctx.db
        .query("challengeSubmissions")
        .withIndex("by_challenge_user", (q) => q.eq("challengeId", c._id))
        .collect();
      challenges.push({
        id: c._id,
        title: c.title,
        prompt: c.prompt,
        datasetKey: c.datasetKey,
        xp: c.xp,
        createdAt: c.createdAt,
        attempts: subs.length,
        solvedBy: new Set(subs.filter((s) => s.correct).map((s) => s.userId)).size,
      });
    }
    return { denied: false as const, challenges };
  },
});

/* ------------------------------ siswa ------------------------------------- */

/** Challenge yang tersedia untuk siswa — TANPA query jawaban. */
export const listForStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db.query("customChallenges").order("desc").take(100);
    const out = [];
    for (const c of rows) {
      const mine = await ctx.db
        .query("challengeSubmissions")
        .withIndex("by_challenge_user", (q) =>
          q.eq("challengeId", c._id).eq("userId", userId),
        )
        .collect();
      const solved = mine.some((s) => s.correct);
      out.push({
        id: c._id,
        title: c.title,
        prompt: c.prompt,
        datasetKey: c.datasetKey,
        xp: c.xp,
        solved,
        attempts: mine.length,
      });
    }
    return out;
  },
});

/**
 * Siswa mengerjakan studi kasus. Query dijalankan server-side dan
 * dibandingkan dengan query jawaban guru — client tidak menentukan hasil.
 */
export const submit = mutation({
  args: { challengeId: v.id("customChallenges"), sqlText: v.string() },
  handler: async (ctx, { challengeId, sqlText }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const c = await ctx.db.get(challengeId);
    if (!c) throw new Error("Challenge tidak ditemukan.");
    const db = datasetFor(c.datasetKey);

    const priorCorrect = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge_user", (q) =>
        q.eq("challengeId", challengeId).eq("userId", userId),
      )
      .filter((q) => q.eq(q.field("correct"), true))
      .first();

    let correct = false;
    let userRun: RunResult | null = null;
    try {
      userRun = runSql(sqlText, JSON.parse(JSON.stringify(db)));
      const expected = runSql(c.solutionSql, db);
      correct = resultsMatch(userRun, expected, /order\s+by/i.test(c.solutionSql));
    } catch (err) {
      await ctx.db.insert("challengeSubmissions", {
        challengeId,
        userId,
        sqlText: sqlText.slice(0, 2000),
        correct: false,
        at: Date.now(),
      });
      if (err instanceof SqlError) {
        return { correct: false as const, error: err.message, xpAwarded: 0 };
      }
      throw err;
    }

    await ctx.db.insert("challengeSubmissions", {
      challengeId,
      userId,
      sqlText: sqlText.slice(0, 2000),
      correct,
      at: Date.now(),
    });

    if (!correct) {
      return {
        correct: false as const,
        error:
          "Query-nya jalan, tapi hasilnya belum cocok dengan yang diminta kasus. Bedah lagi prompt-nya ya. 👀",
        xpAwarded: 0,
      };
    }

    // benar — XP penuh untuk solve pertama, 10% untuk ulangan
    const xpAwarded = priorCorrect
      ? Math.max(5, Math.round(c.xp * 0.1))
      : c.xp;
    const stats = await getStats(ctx, userId);
    const result = await awardXp(ctx, stats, xpAwarded);

    return {
      correct: true as const,
      error: null,
      xpAwarded: result.xpAwarded,
      levelAfter: result.levelAfter,
      columns: userRun?.columns ?? [],
      rows: (userRun?.rows ?? []).slice(0, 50),
    };
  },
});
