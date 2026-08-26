import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { exerciseDataset } from "../lib/curriculum";
import { runSql, resultsMatch } from "../lib/sql/engine";
import { awardXp } from "./gameState";

/** Get current week key (YYYY-Wnn) */
function currentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Get this week's boss challenge + user's status */
export const getCurrentBoss = query({
  args: {},
  handler: async (ctx) => {
    const weekKey = currentWeekKey();
    const boss = await ctx.db
      .query("weeklyBoss")
      .withIndex("by_week", (q) => q.eq("weekKey", weekKey))
      .first();
    if (!boss) return null;

    const userId = await getAuthUserId(ctx);
    let mySubmission = null;
    if (userId) {
      mySubmission = await ctx.db
        .query("weeklyBossSubmissions")
        .withIndex("by_week_user", (q) => q.eq("weekKey", weekKey).eq("userId", userId))
        .order("desc")
        .first();
    }

    const allSubmissions = await ctx.db
      .query("weeklyBossSubmissions")
      .withIndex("by_week_user", (q) => q.eq("weekKey", weekKey))
      .collect();
    const uniqueParticipants = new Set(allSubmissions.map((s) => s.userId)).size;

    const topScores = allSubmissions
      .filter((s) => s.correct)
      .sort((a, b) => a.elapsedMs - b.elapsedMs)
      .slice(0, 5);

    const topWithNames = await Promise.all(
      topScores.map(async (s) => {
        const u = await ctx.db.get(s.userId);
        return {
          name: u?.name ?? u?.username ?? "?",
          avatarEmoji: u?.avatarEmoji ?? "🦉",
          elapsedMs: s.elapsedMs,
          xpEarned: s.xpEarned,
        };
      }),
    );

    return {
      ...boss,
      mySubmission: mySubmission
        ? { correct: mySubmission.correct, elapsedMs: mySubmission.elapsedMs, xpEarned: mySubmission.xpEarned }
        : null,
      participants: uniqueParticipants,
      topScores: topWithNames,
    };
  },
});

/** Submit answer to weekly boss */
export const submitBossAnswer = mutation({
  args: { sqlText: v.string() },
  handler: async (ctx, { sqlText }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const weekKey = currentWeekKey();
    const boss = await ctx.db
      .query("weeklyBoss")
      .withIndex("by_week", (q) => q.eq("weekKey", weekKey))
      .first();
    if (!boss) throw new Error("No boss challenge this week.");

    const existing = await ctx.db
      .query("weeklyBossSubmissions")
      .withIndex("by_week_user", (q) => q.eq("weekKey", weekKey).eq("userId", userId))
      .first();
    if (existing?.correct) throw new Error("Already solved this week's boss!");

    const startTime = Date.now();
    const db = exerciseDataset(boss.datasetKey);
    const expected = runSql(boss.solutionSql, db);
    const actual = runSql(sqlText, db);
    const orderMatters = /order\s+by/i.test(boss.solutionSql);
    const correct = resultsMatch(expected, actual, orderMatters);
    const elapsedMs = Date.now() - startTime;

    let xpEarned = 0;
    if (correct) {
      const xpMap = { easy: 100, medium: 150, hard: 200 };
      xpEarned = xpMap[boss.difficulty] ?? 100;
      if (elapsedMs < 5000) xpEarned += 50;
      else if (elapsedMs < 10000) xpEarned += 25;

      const stats = await ctx.db
        .query("studentStats")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (stats) await awardXp(ctx, stats, xpEarned);
    }

    await ctx.db.insert("weeklyBossSubmissions", {
      weekKey,
      userId,
      sqlText,
      correct,
      elapsedMs,
      xpEarned,
      at: Date.now(),
    });

    return { correct, elapsedMs, xpEarned };
  },
});

/** Teacher: create weekly boss challenge */
export const createBoss = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    datasetKey: v.string(),
    solutionSql: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      throw new Error("Hanya guru yang bisa membuat boss challenge.");
    }

    const weekKey = currentWeekKey();
    try {
      const db = exerciseDataset(args.datasetKey);
      runSql(args.solutionSql, db);
    } catch {
      throw new Error("Query solusi error — periksa syntax SQL.");
    }

    const existing = await ctx.db
      .query("weeklyBoss")
      .withIndex("by_week", (q) => q.eq("weekKey", weekKey))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        datasetKey: args.datasetKey,
        solutionSql: args.solutionSql,
        difficulty: args.difficulty,
      });
    } else {
      await ctx.db.insert("weeklyBoss", {
        weekKey,
        title: args.title,
        description: args.description,
        datasetKey: args.datasetKey,
        solutionSql: args.solutionSql,
        xp: 0,
        difficulty: args.difficulty,
        createdAt: Date.now(),
      });
    }
    return { ok: true, weekKey };
  },
});
