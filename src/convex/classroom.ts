import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { exerciseDataset, EXERCISE_MAP } from "../lib/curriculum";
import { runSql, resultsMatch } from "../lib/sql/engine";
import { awardXp } from "./gameState";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Teacher: create classroom session */
export const createSession = mutation({
  args: { className: v.string(), exerciseId: v.string() },
  handler: async (ctx, { className, exerciseId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      throw new Error("Hanya guru yang bisa memulai sesi kelas.");
    }
    const exercise = EXERCISE_MAP.get(exerciseId);
    if (!exercise) throw new Error("Latihan tidak ditemukan.");

    const code = generateCode();
    const sessionId = await ctx.db.insert("classroomSessions", {
      teacherId: userId,
      className,
      code,
      exerciseId,
      status: "waiting",
      participants: [],
      results: [],
      createdAt: Date.now(),
    });
    return { sessionId, code };
  },
});

/** Student: join classroom session */
export const joinSession = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Silakan login terlebih dahulu.");

    // Normalize code: trim and uppercase, remove any spaces
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (normalizedCode.length !== 4) {
      throw new Error("Kode harus tepat 4 karakter.");
    }

    const session = await ctx.db
      .query("classroomSessions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
    if (!session) {
      throw new Error("Kode sesi tidak ditemukan. Pastikan kode sudah benar dan guru sudah membuat sesi.");
    }
    if (session.status === "finished") {
      throw new Error("Sesi ini sudah selesai. Tunggu guru membuat sesi baru.");
    }
    if (session.participants.includes(userId)) {
      return { sessionId: session._id };
    }

    await ctx.db.patch(session._id, {
      participants: [...session.participants, userId],
    });
    return { sessionId: session._id };
  },
});

/** Teacher: start session (status → active) */
export const startSession = mutation({
  args: { sessionId: v.id("classroomSessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const session = await ctx.db.get(sessionId);
    if (!session || session.teacherId !== userId) throw new Error("Unauthorized.");
    await ctx.db.patch(sessionId, { status: "active", startedAt: Date.now() });
  },
});

/** Student: submit answer in classroom */
export const submitAnswer = mutation({
  args: { sessionId: v.id("classroomSessions"), sqlText: v.string() },
  handler: async (ctx, { sessionId, sqlText }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Silakan login terlebih dahulu.");
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== "active") throw new Error("Sesi tidak aktif atau belum dimulai.");

    // Already submitted correctly?
    const existing = session.results.find((r) => r.userId === userId);
    if (existing?.correct) throw new Error("Kamu sudah menjawab benar.");

    const exercise = EXERCISE_MAP.get(session.exerciseId);
    if (!exercise) throw new Error("Latihan tidak ditemukan.");

    const db = exerciseDataset(exercise.dataset);
    const startTime = Date.now();
    const expected = runSql(exercise.solution, db);
    const actual = runSql(sqlText, db);
    const orderMatters = /order\s+by/i.test(exercise.solution);
    const correct = resultsMatch(expected, actual, orderMatters);
    const elapsedMs = Date.now() - startTime;

    let xpEarned = 0;
    if (correct) {
      xpEarned = exercise.xp;
      const stats = await ctx.db
        .query("studentStats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (stats) await awardXp(ctx, stats, xpEarned);
    }

    const newResult = { userId, correct, elapsedMs, xpEarned };
    const newResults = existing
      ? session.results.map((r) => (r.userId === userId ? newResult : r))
      : [...session.results, newResult];

    await ctx.db.patch(sessionId, { results: newResults });
    return { correct, elapsedMs, xpEarned };
  },
});

/** Get session status (polling for realtime feel) */
export const getSession = query({
  args: { sessionId: v.id("classroomSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;

    const participants = await Promise.all(
      session.participants.map(async (pid) => {
        const u = await ctx.db.get(pid);
        const result = session.results.find((r) => r.userId === pid);
        return {
          userId: pid,
          name: u?.name ?? u?.username ?? "?",
          avatarEmoji: u?.avatarEmoji ?? "🦉",
          correct: result?.correct ?? false,
          elapsedMs: result?.elapsedMs ?? null,
          xpEarned: result?.xpEarned ?? 0,
        };
      }),
    );

    // Sort: correct first, then fastest
    participants.sort((a, b) => {
      if (a.correct !== b.correct) return a.correct ? -1 : 1;
      if (a.elapsedMs !== null && b.elapsedMs !== null) return a.elapsedMs - b.elapsedMs;
      return 0;
    });

    const exercise = EXERCISE_MAP.get(session.exerciseId);
    return {
      ...session,
      exercise: exercise ? { title: exercise.title, dataset: exercise.dataset } : null,
      participants,
    };
  },
});

/** Teacher: end session */
export const endSession = mutation({
  args: { sessionId: v.id("classroomSessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const session = await ctx.db.get(sessionId);
    if (!session || session.teacherId !== userId) throw new Error("Unauthorized.");
    await ctx.db.patch(sessionId, { status: "finished", finishedAt: Date.now() });
  },
});

/** Teacher: get their active sessions */
export const mySessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("classroomSessions")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .order("desc")
      .take(10);
  },
});
