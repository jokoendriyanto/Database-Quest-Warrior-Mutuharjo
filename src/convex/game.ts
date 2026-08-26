import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  EXERCISE_MAP,
  LESSON_MAP,
  exerciseDataset,
} from "../lib/curriculum";
import { runSql, resultsMatch, SqlError } from "../lib/sql/engine";
import {
  botByKey,
  randomBotSuccess,
  randomBotTime,
  rankFromLevel,
  levelFromXp,
} from "../lib/game";
import { getStats, findStats, awardXp, grantBadge, StatsDoc } from "./gameState";

/* --------------------------- shared helpers ---------------------------- */

interface FinalResult {
  xpAwarded: number;
  levelBefore: number;
  levelAfter: number;
  newBadges: string[];
}

/** awardXp + badge tambahan dalam satu penulisan konsisten (server-side). */
async function finalize(
  ctx: any,
  stats: StatsDoc,
  xpAmount: number,
  extraBadges: string[],
): Promise<FinalResult> {
  const res = await awardXp(ctx, stats, xpAmount);
  const allNew = [...res.newBadges];
  for (const b of extraBadges) if (!allNew.includes(b)) allNew.push(b);
  if (allNew.length) {
    await ctx.db.patch(stats._id, {
      badges: [...stats.badges, ...allNew],
    });
  }
  return { ...res, newBadges: allNew };
}

const WIN_COPY = [
  "GG. Query accepted. 🔥",
  "Mantap, database-nya nurut.",
  "Clean query!",
];

function friendlyError(err: SqlError): string {
  if (err.code === "ER_BAD_COLUMN") {
    const base = `Hmm... ${err.message}`;
    return err.suggestion ? `${base}\n\n${err.suggestion}\n\nMungkin maksudmu salah satunya? 🤔` : base;
  }
  if (err.code === "ER_NO_TABLE" && err.suggestion) {
    return `${err.message}\n\n${err.suggestion}`;
  }
  return err.message;
}

function wrongAnswerFeedback(
  userRows: number,
  expectedRows: number,
  userCols: string[],
  expectedCols: string[],
): string {
  const colsDiffer =
    userCols.length !== expectedCols.length ||
    !userCols.every((c) =>
      expectedCols.some((e) => e.toLowerCase() === c.toLowerCase()),
    );
  if (colsDiffer) {
    return "Query-nya jalan, tapi kolom hasilnya belum sesuai. Cek lagi apa saja yang ditampilkan SELECT-nya ya. 👀";
  }
  if (userRows > expectedRows && expectedRows > 0) {
    return "Belum tepat.\n\nQuery-nya jalan, tapi hasilnya masih terlalu banyak. Kayaknya WHERE-nya perlu kita lihat lagi. 👀";
  }
  if (userRows < expectedRows && userRows > 0) {
    return "Belum tepat.\n\nHasilnya kurang nih — ada baris yang seharusnya ikut terambil.";
  }
  if (userRows === 0 && expectedRows > 0) {
    return "Hasilnya kosong padahal seharusnya ada data. Cek nama tabel dan syarat filter-nya ya.";
  }
  return "Belum tepat.\n\nIsi datanya belum cocok dengan yang diminta misi. Bandingkan lagi sama petunjuknya ya.";
}

/* -------------------------- exercise submission ------------------------ */

export const submitExercise = mutation({
  args: {
    exerciseId: v.string(),
    sqlText: v.string(),
    hintsUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const ex = EXERCISE_MAP.get(args.exerciseId);
    if (!ex) throw new Error("Latihan tidak ditemukan.");
    if (args.hintsUsed < 0 || args.hintsUsed > 4) throw new Error("hintsUsed tidak valid");

    const db = exerciseDataset(args.exerciseId);
    const stats = await getStats(ctx, userId);

    // jalankan query user pada salinan dataset
    const workingCopy = JSON.parse(JSON.stringify(db));
    let userRun;
    try {
      userRun = runSql(args.sqlText, workingCopy);
    } catch (err) {
      await ctx.db.patch(stats._id, { queriesRun: stats.queriesRun + 1 });
      await ctx.db.insert("exerciseAttempts", {
        userId,
        exerciseId: args.exerciseId,
        queryText: args.sqlText.slice(0, 2000),
        isCorrect: false,
        hintsUsed: args.hintsUsed,
        xpEarned: 0,
        at: Date.now(),
      });
      if (err instanceof SqlError) {
        return {
          correct: false as const,
          error: { code: err.code, message: err.message, suggestion: err.suggestion },
          feedback: friendlyError(err),
          xpAwarded: 0,
        };
      }
      throw err;
    }

    const expected = runSql(ex.solution, db);
    const orderMatters = /order\s+by/i.test(ex.solution);
    const correct = resultsMatch(userRun, expected, orderMatters);

    const priorCorrect = correct
      ? await ctx.db
          .query("exerciseAttempts")
          .withIndex("by_user_exercise", (q) =>
            q.eq("userId", userId).eq("exerciseId", args.exerciseId),
          )
          .filter((q) => q.eq(q.field("isCorrect"), true))
          .first()
      : null;

    await ctx.db.insert("exerciseAttempts", {
      userId,
      exerciseId: args.exerciseId,
      queryText: args.sqlText.slice(0, 2000),
      isCorrect: correct,
      hintsUsed: args.hintsUsed,
      xpEarned: 0,
      at: Date.now(),
    });

    if (!correct) {
      await ctx.db.patch(stats._id, { queriesRun: stats.queriesRun + 1 });
      return {
        correct: false as const,
        feedback: wrongAnswerFeedback(
          userRun.rows.length,
          expected.rows.length,
          userRun.columns,
          expected.columns,
        ),
        columns: expected.columns,
        rows: [],
        xpAwarded: 0,
      };
    }

    /* benar! hitung XP:
       - hint multiplier: 100% / 90% / 75% / 50% / 25%(lihat jawaban)
       - repeat completion: cuma 10% dari XP kalau sudah pernah benar */
    const hintMult = [1, 0.9, 0.75, 0.5, 0.25][args.hintsUsed] ?? 0.25;
    const repeatMult = priorCorrect ? 0.1 : 1;
    const xpAwarded = Math.max(5, Math.round(ex.xp * hintMult * repeatMult));

    const exercisesDone = stats.exercisesDone + (priorCorrect ? 0 : 1);
    const exercisesCorrect = stats.exercisesCorrect + (priorCorrect ? 0 : 1);

    const extraBadges: string[] = [];
    if (!stats.badges.includes("first_query")) extraBadges.push("first_query");
    if (args.hintsUsed === 0 && !stats.badges.includes("no_hint")) extraBadges.push("no_hint");
    if (exercisesCorrect >= 10 && !stats.badges.includes("exercise_10")) extraBadges.push("exercise_10");

    await ctx.db.patch(stats._id, {
      queriesRun: stats.queriesRun + 1,
      exercisesDone,
      exercisesCorrect,
    });

    const fresh = { ...stats, exercisesDone, exercisesCorrect };
    const result = await finalize(ctx, fresh, xpAwarded, extraBadges);

    const copy =
      args.hintsUsed === 4
        ? "Berhasil! Lain kali coba tanpa lihat jawaban ya — kamu pasti bisa. 😉"
        : WIN_COPY[Math.floor(Math.random() * WIN_COPY.length)];

    return {
      correct: true as const,
      feedback: copy,
      columns: userRun.columns,
      rows: userRun.rows.slice(0, 50),
      xpAwarded: result.xpAwarded,
      levelBefore: result.levelBefore,
      levelAfter: result.levelAfter,
      newBadges: result.newBadges,
    };
  },
});

/* ----------------------------- lesson progress ------------------------- */

export const completeLesson = mutation({
  args: { lessonId: v.string() },
  handler: async (ctx, { lessonId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    if (!LESSON_MAP.has(lessonId)) throw new Error("Lesson tidak ditemukan.");

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lessonId))
      .first();
    if (existing) return { alreadyCompleted: true, xpAwarded: 0 };

    // CEK PEMAHAMAN wajib lulus — divalidasi server, bukan cuma di UI
    const quizPassed = await ctx.db
      .query("quizSessions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lessonId))
      .filter((q) => q.eq(q.field("status"), "passed"))
      .first();
    if (!quizPassed) {
      throw new Error("Lulusi CEK PEMAHAMAN dulu untuk menamatkan lesson ini.");
    }

    await ctx.db.insert("lessonProgress", {
      userId,
      lessonId,
      status: "completed",
      completedAt: Date.now(),
    });

    const stats = await getStats(ctx, userId);
    const lessonsCompleted = stats.lessonsCompleted + 1;
    await ctx.db.patch(stats._id, { lessonsCompleted });

    const extraBadges: string[] = [];
    const has = (id: string) => stats.badges.includes(id) || extraBadges.includes(id);
    const add = (id: string) => { if (!has(id)) extraBadges.push(id); };

    if (!has("first_lesson")) add("first_lesson");
    if (lessonsCompleted >= 5) add("lesson_5");
    if (lessonsCompleted >= 15) add("lesson_15");

    // Check world completion
    const entry = LESSON_MAP.get(lessonId);
    if (entry) {
      const worldLessons = entry.world.lessons.map((l) => l.id);
      const completedInWorld = await ctx.db
        .query("lessonProgress")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const completedIds = new Set(completedInWorld.map((p) => p.lessonId));
      const allWorldDone = worldLessons.every((id) => completedIds.has(id) || id === lessonId);
      if (allWorldDone) {
        const worldNum = entry.world.num;
        if (worldNum === 1) add("world_1_complete");
        // Count total worlds completed
        let worldsCompleted = 0;
        for (const [, wEntry] of LESSON_MAP) {
          if (wEntry.world.num > 16) continue;
          const wLessons = wEntry.world.lessons.map((l) => l.id);
          if (wLessons.every((id) => completedIds.has(id) || id === lessonId)) worldsCompleted++;
        }
        if (worldsCompleted >= 5) add("world_5_complete");
        if (worldsCompleted >= 16) add("world_all_complete");
      }
    }

    const result = await finalize(ctx, { ...stats, lessonsCompleted }, 20, extraBadges);
    return {
      alreadyCompleted: false,
      xpAwarded: result.xpAwarded,
      levelBefore: result.levelBefore,
      levelAfter: result.levelAfter,
      newBadges: result.newBadges,
    };
  },
});

/* -------------------------------- dashboard ----------------------------- */

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const stats = await findStats(ctx, userId);

    const progressRows = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const completedLessons = progressRows.map((r) => r.lessonId);

    const recentAttempts = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(24);

    // posisi leaderboard berdasarkan XP
    const allStats = await ctx.db
      .query("studentStats")
      .withIndex("by_xp")
      .order("desc")
      .take(100);
    let position = 0;
    const idx = allStats.findIndex((s) => s.userId === userId);
    if (idx >= 0) position = idx + 1;
    else {
      const countHigher = allStats.filter((s) => s.xp > stats.xp).length;
      position = countHigher + 1;
    }

    // aktivitas hari ini (UTC)
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const ts = dayStart.getTime();
    const lessonsToday = progressRows.filter((r) => r.completedAt >= ts).length;

    const myBattles = await ctx.db
      .query("battleLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const battlesWonToday = myBattles.filter((b) => b.won && b.at >= ts).length;

    // skill stats per world — dari attempt nyata, bukan angka karangan
    const myAttempts = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const skillMap = new Map<
      number,
      { worldNum: number; attempts: number; correct: number }
    >();
    for (const a of myAttempts) {
      const ex = EXERCISE_MAP.get(a.exerciseId);
      if (!ex) continue;
      const rec =
        skillMap.get(ex.worldNum) ??
        { worldNum: ex.worldNum, attempts: 0, correct: 0 };
      rec.attempts++;
      if (a.isCorrect) rec.correct++;
      skillMap.set(ex.worldNum, rec);
    }
    // aktivitas 7 hari terakhir (UTC) — dari data nyata attempt/battle/lesson
    const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
    const today = dayKey(Date.now());
    const activity7d = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: key,
        exercises: myAttempts.filter((a) => dayKey(a.at) === key).length,
        battlesWon: myBattles.filter((b) => b.won && dayKey(b.at) === key).length,
        lessons: progressRows.filter((r) => dayKey(r.completedAt) === key).length,
      };
    });

    const skillStats = [...skillMap.values()]
      .map((s) => ({
        ...s,
        accuracy: Math.round((s.correct / Math.max(1, s.attempts)) * 100),
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return {
      user: {
        name: user.name ?? "Petualang",
        username: user.username ?? "",
        className: user.className ?? "",
        avatarEmoji: user.avatarEmoji ?? "🦉",
        avatarUrl: user.image ? await ctx.storage.getUrl(user.image) : null,
        onboarded: user.onboarded ?? false,
        role: user.role ?? "student",
      },
      stats: {
        xp: stats.xp,
        streak: stats.streak,
        longestStreak: stats.longestStreak,
        lessonsCompleted: stats.lessonsCompleted,
        exercisesDone: stats.exercisesDone,
        exercisesCorrect: stats.exercisesCorrect,
        queriesRun: stats.queriesRun,
        botWins: stats.botWins,
        botLosses: stats.botLosses,
        todayExercises: stats.todayExercises,
        todayCorrect: stats.todayCorrect,
        badges: stats.badges,
        lastActiveDate: stats.lastActiveDate ?? "",
        duelRating: stats.duelRating ?? 1000,
        duelWins: stats.duelWins ?? 0,
        duelLosses: stats.duelLosses ?? 0,
        duelDraws: stats.duelDraws ?? 0,
      },
      level: levelFromXp(stats.xp),
      rank: rankFromLevel(levelFromXp(stats.xp)),
      completedLessons,
      leaderboardPosition: position,
      lessonsToday,
      battlesWonToday,
      skillStats,
      activity7d,
      today,
      recentAttempts: recentAttempts.map((a) => ({
        exerciseId: a.exerciseId,
        isCorrect: a.isCorrect,
        xpEarned: a.xpEarned,
        at: a.at,
      })),
    };
  },
});

/* ------------------------------- leaderboard ---------------------------- */

function getSemesterDates(semester: string): { from: number; to: number } {
  const now = new Date();
  const year = now.getFullYear();
  if (semester === "s1") {
    // Semester 1: Juli - Desember
    return { from: new Date(year, 6, 1).getTime(), to: new Date(year, 11, 31, 23, 59, 59).getTime() };
  } else if (semester === "s2") {
    // Semester 2: Januari - Juni
    return { from: new Date(year, 0, 1).getTime(), to: new Date(year, 5, 30, 23, 59, 59).getTime() };
  } else if (semester === "all") {
    return { from: 0, to: Date.now() };
  }
  // Default: semester aktif
  const month = now.getMonth();
  if (month >= 6) return { from: new Date(year, 6, 1).getTime(), to: new Date(year, 11, 31, 23, 59, 59).getTime() };
  return { from: new Date(year, 0, 1).getTime(), to: new Date(year, 5, 30, 23, 59, 59).getTime() };
}

export const leaderboard = query({
  args: {
    className: v.optional(v.string()),
    mode: v.optional(v.union(v.literal("xp"), v.literal("rating"))),
    semester: v.optional(v.union(v.literal("all"), v.literal("s1"), v.literal("s2"), v.literal("active"))),
  },
  handler: async (ctx, args) => {
    const mode = args.mode ?? "xp";
    const classFilter = args.className?.trim() ?? "";
    const semester = args.semester ?? "active";
    const semesterDates = getSemesterDates(semester);

    let top;
    if (mode === "rating") {
      // ranked: urut rating duel (ELO). Skala sekolah → collect + sort aman.
      const all = await ctx.db.query("studentStats").collect();
      top = all
        .filter((s) => (s.duelRating ?? 1000) > 1000 || (s.duelWins ?? 0) + (s.duelLosses ?? 0) > 0)
        .sort((a, b) => (b.duelRating ?? 1000) - (a.duelRating ?? 1000))
        .slice(0, 30);
    } else {
      top = await ctx.db
        .query("studentStats")
        .withIndex("by_xp")
        .order("desc")
        .take(100);
    }

    const entries = [];
    for (const s of top) {
      const u = await ctx.db.get(s.userId);
      if (!u?.username) continue;
      if (u.role && u.role !== "student") continue;
      if (classFilter && (u.className ?? "") !== classFilter) continue;
      if (mode === "xp" && s.xp <= 0) continue;
      // Filter by semester based on last active date
      if (semester !== "all") {
        const lastActive = s.lastActiveDate ? new Date(s.lastActiveDate).getTime() : 0;
        if (lastActive < semesterDates.from || lastActive > semesterDates.to) continue;
      }
      entries.push({
        username: u.username,
        name: u.name ?? u.username,
        className: u.className ?? "",
        avatarEmoji: u.avatarEmoji ?? "🦉",
        xp: s.xp,
        rating: s.duelRating ?? 1000,
        duelWins: s.duelWins ?? 0,
        duelLosses: s.duelLosses ?? 0,
        level: levelFromXp(s.xp),
        rank: rankFromLevel(levelFromXp(s.xp)).name,
        rankEmoji: rankFromLevel(levelFromXp(s.xp)).emoji,
      });
      if (entries.length >= 30) break;
    }
    return entries;
  },
});

/* ------------------------------ teacher view ---------------------------- */

export const teacherOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      return { denied: true as const, students: [], insights: [] };
    }

    const users = await ctx.db.query("users").collect();
    const students = [];
    for (const u of users) {
      if (u.role !== "student") continue;
      const s = await ctx.db
        .query("studentStats")
        .withIndex("by_user", (q) => q.eq("userId", u._id))
        .first();
      if (!s) continue;
      const accuracy =
        s.exercisesDone > 0
          ? Math.round((s.exercisesCorrect / s.exercisesDone) * 100)
          : 0;
      const daysInactive = s.lastActiveDate
        ? Math.floor((Date.now() - new Date(s.lastActiveDate + "T00:00:00Z").getTime()) / 86400000)
        : 999;
      const riskFlags: string[] = [];
      if (daysInactive > 7) riskFlags.push("Tidak aktif > 7 hari");
      if (s.exercisesDone >= 3 && accuracy < 50) riskFlags.push("Accuracy < 50%");
      students.push({
        userId: u._id,
        name: u.name ?? u.username ?? "?",
        username: u.username ?? "",
        className: u.className ?? "",
        avatarEmoji: u.avatarEmoji ?? "🦉",
        xp: s.xp,
        level: levelFromXp(s.xp),
        lessonsCompleted: s.lessonsCompleted,
        exercisesDone: s.exercisesDone,
        exercisesCorrect: s.exercisesCorrect,
        accuracy,
        streak: s.streak,
        daysInactive,
        atRisk: riskFlags.length > 0,
        riskFlags,
      });
    }

    // satu kali baca semua attempt → dipakai untuk insights + skill matrix
    const attempts = await ctx.db.query("exerciseAttempts").collect();

    // topik tersulit: rasio gagal per latihan (min. 3 percobaan)
    const byExercise = new Map<string, { total: number; fails: number }>();
    // skill matrix per siswa per world (akurasi attempt nyata)
    const byUserWorld = new Map<string, Map<number, { attempts: number; correct: number }>>();
    for (const a of attempts) {
      const rec = byExercise.get(a.exerciseId) ?? { total: 0, fails: 0 };
      rec.total++;
      if (!a.isCorrect) rec.fails++;
      byExercise.set(a.exerciseId, rec);

      const ex = EXERCISE_MAP.get(a.exerciseId);
      if (!ex) continue;
      const key = String(a.userId);
      let worlds = byUserWorld.get(key);
      if (!worlds) {
        worlds = new Map();
        byUserWorld.set(key, worlds);
      }
      const w = worlds.get(ex.worldNum) ?? { attempts: 0, correct: 0 };
      w.attempts++;
      if (a.isCorrect) w.correct++;
      worlds.set(ex.worldNum, w);
    }
    const insights = [...byExercise.entries()]
      .filter(([, v]) => v.total >= 3)
      .map(([id, v]) => ({ exerciseId: id, failRate: Math.round((v.fails / v.total) * 100), attempts: v.total }))
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 5);

    const enriched = students.map((s) => {
      const u = users.find((x) => x.username === s.username);
      const worlds = u ? byUserWorld.get(String(u._id)) : undefined;
      const worldSkills = worlds
        ? [...worlds.entries()]
            .map(([worldNum, w]) => ({ worldNum, accuracy: Math.round((w.correct / w.attempts) * 100) }))
            .sort((a, b) => a.worldNum - b.worldNum)
        : [];
      return { ...s, worldSkills };
    });

    return { denied: false as const, students: enriched, insights };
  },
});

/* ------------------------------- bot battle ------------------------------ */

export const playBotMatch = mutation({
  args: {
    botKey: v.string(),
    exerciseId: v.string(),
    sqlText: v.string(),
    elapsedSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const bot = botByKey(args.botKey);
    if (!bot) throw new Error("Bot tidak dikenal.");
    const ex = EXERCISE_MAP.get(args.exerciseId);
    if (!ex) throw new Error("Challenge tidak ditemukan.");

    const db = exerciseDataset(args.exerciseId);
    const stats = await getStats(ctx, userId);

    // validasi jawaban di server — client tidak menentukan hasil
    let correct = false;
    try {
      const userRun = runSql(args.sqlText, JSON.parse(JSON.stringify(db)));
      const expected = runSql(ex.solution, db);
      correct = resultsMatch(userRun, expected, /order\s+by/i.test(ex.solution));
    } catch {
      correct = false;
    }

    const botFinishSec = randomBotTime(bot);
    const botSuccess = randomBotSuccess(bot);
    const won = correct && (args.elapsedSeconds <= botFinishSec || !botSuccess);

    await ctx.db.insert("battleLogs", {
      userId,
      botKey: args.botKey,
      won,
      xpEarned: 0,
      elapsedSeconds: Math.round(args.elapsedSeconds),
      at: Date.now(),
    });

    const botWins = stats.botWins + (won ? 1 : 0);
    const botLosses = stats.botLosses + (won ? 0 : 1);

    let xpAmount = 0;
    if (won) {
      const myBattles = await ctx.db
        .query("battleLogs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const hadPriorWinVsBot = myBattles.some(
        (b) => b.botKey === args.botKey && b.won && b.at < Date.now() - 1000,
      );
      // menang pertama lawan bot ini: full XP; rematch: dikurangi (anti farming)
      xpAmount = hadPriorWinVsBot ? 10 : 100;
    }

    const extraBadges: string[] = [];
    if (won && !stats.badges.includes("first_battle_win")) extraBadges.push("first_battle_win");
    if (botWins >= 5 && !stats.badges.includes("bot_slayer")) extraBadges.push("bot_slayer");

    await ctx.db.patch(stats._id, { botWins, botLosses });

    const result: FinalResult = won
      ? await finalize(ctx, { ...stats, botWins, botLosses }, xpAmount, extraBadges)
      : {
          xpAwarded: 0,
          levelBefore: levelFromXp(stats.xp),
          levelAfter: levelFromXp(stats.xp),
          newBadges: [],
        };

    return {
      correct,
      won,
      botName: bot.name,
      botFinishSec,
      botSuccess,
      playerSeconds: Math.round(args.elapsedSeconds * 10) / 10,
      xpAwarded: result.xpAwarded,
      levelAfter: result.levelAfter,
      newBadges: result.newBadges ?? [],
      victoryCopy: won
        ? "VICTORY! 🔥\n\nSQL hari ini berpihak kepadamu."
        : correct
          ? `Belum kali ini.\n\nKamu telat ${(Math.round((args.elapsedSeconds - botFinishSec) * 10) / 10).toFixed(1)} detik. Rematch? 😤`
          : "Belum kali ini.\n\nQuery-nya belum tepat, jadi bot unggul duluan. Bedah hint-nya lalu rematch ya!",
    };
  },
});
