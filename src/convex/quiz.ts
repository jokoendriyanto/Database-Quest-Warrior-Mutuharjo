import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QUIZ_BANK } from "../lib/quizBank";

/**
 * CEK PEMAHAMAN anti-cheat:
 * - Soal diacak di server (3-5 dari pool per lesson) + urutan opsi diacak.
 * - Kunci jawaban TIDAK PERNAH dikirim ke client — divalidasi murni di sini.
 * - Satu sesi = satu kali submit. Ulang = sesi baru dengan soal baru.
 * - Copy/paste/klik-kanan/pindah tab dicatat; 3 pelanggaran = sesi dibatalkan.
 */

const QUIZ_TTL_MS = 20 * 60 * 1000; // sesi kedaluwarsa dalam 20 menit
const MAX_VIOLATIONS = 3;

/** PRNG deterministik (mutation Convex melarang Math.random). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mulai sesi kuis baru untuk lesson — kembalikan soal TANPA kunci jawaban. */
export const startQuizSession = mutation({
  args: { lessonId: v.string() },
  handler: async (ctx, { lessonId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const pool = QUIZ_BANK[lessonId];
    if (!pool || pool.length === 0) {
      throw new Error("Lesson ini belum punya bank soal.");
    }

    // seed dari waktu + identitas + jumlah sesi lama → tiap siswa & tiap percobaan beda
    const prior = await ctx.db
      .query("quizSessions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lessonId))
      .collect();
    const seed =
      (Date.now() ^ hashStr(`${userId}:${lessonId}:${prior.length}`)) >>> 0;
    const rand = mulberry32(seed);

    const count = Math.min(pool.length, 3 + Math.floor(rand() * 3)); // 3..5
    const picked = shuffled(pool, rand).slice(0, count);

    const questionIds: string[] = [];
    const optionOrders: number[][] = [];
    const answers: number[] = [];
    const questions = picked.map((q) => {
      const order = shuffled(
        q.options.map((_, i) => i),
        rand,
      );
      questionIds.push(q.id);
      optionOrders.push(order);
      answers.push(order.indexOf(q.answer));
      return {
        id: q.id,
        question: q.q,
        options: order.map((oi) => q.options[oi]),
      };
    });

    const now = Date.now();
    const expiresAt = now + QUIZ_TTL_MS;
    const sessionId = await ctx.db.insert("quizSessions", {
      userId,
      lessonId,
      questionIds,
      optionOrders,
      answers,
      status: "active",
      violations: 0,
      createdAt: now,
      expiresAt,
    });
    return { sessionId, questions, expiresAt };
  },
});

/** Submit jawaban — dinilai penuh di server. */
export const submitQuiz = mutation({
  args: { sessionId: v.id("quizSessions"), picks: v.array(v.number()) },
  handler: async (ctx, { sessionId, picks }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const s = await ctx.db.get(sessionId);
    if (!s || s.userId !== userId) {
      throw new Error("Sesi kuis tidak ditemukan.");
    }
    if (s.status === "void") {
      throw new Error("Sesi dibatalkan karena aktivitas mencurigakan. Mulai ulang kuisnya.");
    }
    if (s.status !== "active") {
      throw new Error("Sesi ini sudah selesai — mulai ulang untuk soal baru.");
    }
    if (Date.now() > s.expiresAt) {
      await ctx.db.patch(sessionId, { status: "failed" });
      throw new Error("Waktu kuis habis. Mulai ulang dengan soal baru.");
    }

    const byId = new Map((QUIZ_BANK[s.lessonId] ?? []).map((q) => [q.id, q]));
    const results = s.questionIds.map((qid, i) => {
      const src = byId.get(qid);
      const options = src ? s.optionOrders[i].map((oi) => src.options[oi]) : [];
      const correctIndex = s.answers[i];
      const pick = picks[i] ?? -1;
      return {
        question: src?.q ?? "",
        options,
        pick,
        correctIndex,
        correct: pick === correctIndex,
        explain: src?.explain ?? "",
      };
    });

    const total = results.length;
    const score = results.filter((r) => r.correct).length;
    const passed = score >= Math.ceil(total * 0.75); // 3/3 · 3/4 · 4/5
    await ctx.db.patch(sessionId, { status: passed ? "passed" : "failed" });

    // Badge checks
    const { findStats, grantBadge } = await import("./gameState");
    const stats = await findStats(ctx, userId);
    const newBadges: string[] = [];
    if (passed && score === total) {
      const awarded = await grantBadge(ctx, stats, "perfect_quiz");
      newBadges.push(...awarded);
    }
    // Check quiz streak (5 consecutive passes)
    if (passed) {
      const recentPassed = await ctx.db
        .query("quizSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5);
      if (recentPassed.length >= 5 && recentPassed.every((s) => s.status === "passed")) {
        const awarded = await grantBadge(ctx, stats, "quiz_streak_5");
        newBadges.push(...awarded);
      }
    }

    return { passed, score, total, results, newBadges };
  },
});

/** Catat pelanggaran anti-cheat (copy/paste/klik kanan/pindah tab). */
export const reportViolation = mutation({
  args: { sessionId: v.id("quizSessions"), kind: v.string() },
  handler: async (ctx, { sessionId, kind }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { violations: 0, voided: false };
    const s = await ctx.db.get(sessionId);
    if (!s || s.userId !== userId || s.status !== "active") {
      return { violations: s?.violations ?? 0, voided: s?.status === "void" };
    }
    const violations = s.violations + 1;
    const voided = violations >= MAX_VIOLATIONS;
    await ctx.db.patch(sessionId, {
      violations,
      status: voided ? "void" : s.status,
    });
    void kind;
    return { violations, voided };
  },
});

/** Apakah user sudah pernah LULUS kuis lesson ini? (dipakai gate lesson) */
export const hasPassedQuiz = query({
  args: { lessonId: v.string() },
  handler: async (ctx, { lessonId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const passed = await ctx.db
      .query("quizSessions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lessonId))
      .filter((q) => q.eq(q.field("status"), "passed"))
      .first();
    return passed !== null;
  },
});
