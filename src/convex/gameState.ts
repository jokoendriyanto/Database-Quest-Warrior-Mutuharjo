import { QueryCtx, MutationCtx } from "./_generated/server";
import { levelFromXp } from "../lib/game";

export interface StatsDoc {
  _id: any;
  userId: any;
  xp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  lastActiveDate?: string;
  lessonsCompleted: number;
  exercisesDone: number;
  exercisesCorrect: number;
  queriesRun: number;
  botWins: number;
  botLosses: number;
  todayDate?: string;
  todayExercises: number;
  todayCorrect: number;
  badges: string[];
  // PvP rating (ELO-lite) — hasil duel & turnamen
  duelRating?: number;
  duelWins?: number;
  duelLosses?: number;
  duelDraws?: number;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Stats kosong untuk dipakai di query read-only (tanpa menulis ke DB). */
export function zeroStats(userId: any): StatsDoc {
  return {
    _id: "",
    userId,
    xp: 0,
    coins: 0,
    streak: 0,
    longestStreak: 0,
    lessonsCompleted: 0,
    exercisesDone: 0,
    exercisesCorrect: 0,
    queriesRun: 0,
    botWins: 0,
    botLosses: 0,
    todayExercises: 0,
    todayCorrect: 0,
    badges: [],
    duelRating: 1000,
    duelWins: 0,
    duelLosses: 0,
    duelDraws: 0,
  } as unknown as StatsDoc;
}

/** Baca stats tanpa menulis — aman dipanggil dari query. */
export async function findStats(ctx: { db: any }, userId: any): Promise<StatsDoc> {
  const existing = await ctx.db
    .query("studentStats")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  return existing ? (existing as StatsDoc) : zeroStats(userId);
}

/** Ambil stats user, buat baris baru kalau belum ada. Mutation-only. */
export async function getStats(ctx: { db: any }, userId: any): Promise<StatsDoc> {
  const existing = await ctx.db
    .query("studentStats")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  if (existing) return existing as StatsDoc;
  const id = await ctx.db.insert("studentStats", {
    userId,
    xp: 0,
    coins: 0,
    streak: 0,
    longestStreak: 0,
    lessonsCompleted: 0,
    exercisesDone: 0,
    exercisesCorrect: 0,
    queriesRun: 0,
    botWins: 0,
    botLosses: 0,
    todayExercises: 0,
    todayCorrect: 0,
    badges: [],
    duelRating: 1000,
    duelWins: 0,
    duelLosses: 0,
    duelDraws: 0,
  });
  return (await ctx.db.get(id))! as unknown as StatsDoc;
}

export interface AwardResult {
  xpAwarded: number;
  levelBefore: number;
  levelAfter: number;
  newBadges: string[];
}

/**
 * Tambah XP + update streak + reset penghitung harian.
 * Selalu dipanggil dari server (mutation), tidak pernah dari client.
 */
export async function awardXp(
  ctx: MutationCtx,
  stats: StatsDoc,
  amount: number,
): Promise<AwardResult> {
  const today = todayStr();
  const patch: Record<string, unknown> = {};
  let streak = stats.streak;

  if (stats.lastActiveDate !== today) {
    streak =
      stats.lastActiveDate === yesterdayStr() ? stats.streak + 1 : 1;
    patch.streak = streak;
    patch.longestStreak = Math.max(stats.longestStreak, streak);
    patch.lastActiveDate = today;
  }
  if (stats.todayDate !== today) {
    patch.todayDate = today;
    patch.todayExercises = 0;
    patch.todayCorrect = 0;
  }

  const levelBefore = levelFromXp(stats.xp);
  const newXp = stats.xp + amount;
  const levelAfter = levelFromXp(newXp);

  // Badge checks
  const newBadges: string[] = [];
  const has = (id: string) => stats.badges.includes(id) || newBadges.includes(id);
  const add = (id: string) => { if (!has(id)) newBadges.push(id); };

  // Streak badges
  if (streak >= 7) add("week_warrior");
  if (streak >= 30) add("month_warrior");

  // Learning milestones (check after XP update)
  if (stats.lessonsCompleted >= 5) add("lesson_5");
  if (stats.lessonsCompleted >= 15) add("lesson_15");
  if (stats.exercisesDone >= 10) add("exercise_10");
  if (stats.exercisesDone >= 25) add("exercise_25");
  if (stats.exercisesDone >= 50) add("exercise_50");

  // Time-based badges
  const hour = new Date().getUTCHours();
  // UTC+7 untuk Indonesia: jam 3-10 UTC = 10-17 WIB (siang), jam 15-24 UTC = 22-7 WIB (malam)
  // Night owl: 22-02 WIB = 15-19 UTC
  if (hour >= 15 && hour <= 19) add("night_owl");
  // Early bird: 05-07 WIB = 22-24 UTC
  if (hour >= 22 || hour === 0) add("early_bird");

  await ctx.db.patch(stats._id, {
    ...patch,
    xp: newXp,
    coins: stats.coins + Math.round(amount / 10),
    ...(newBadges.length ? { badges: [...stats.badges, ...newBadges] } : {}),
  });

  return {
    xpAwarded: amount,
    levelBefore,
    levelAfter,
    newBadges,
  };
}

/** Tambahkan badge ke stats bila belum dimiliki; kembalikan yang baru. */
export async function grantBadge(
  ctx: MutationCtx,
  stats: StatsDoc,
  badgeId: string,
): Promise<string[]> {
  if (stats.badges.includes(badgeId)) return [];
  await ctx.db.patch(stats._id, { badges: [...stats.badges, badgeId] });
  return [badgeId];
}
