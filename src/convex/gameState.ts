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

  // Badge streak 7 hari
  const newBadges: string[] = [];
  if (streak >= 7 && !stats.badges.includes("week_warrior")) {
    newBadges.push("week_warrior");
  }

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
