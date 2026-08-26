import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { battlePool, exerciseDataset, EXERCISE_MAP } from "../lib/curriculum";
import { runSql, resultsMatch } from "../lib/sql/engine";
import { awardXp, getStats } from "./gameState";

/* ============================ shared helpers ============================ */

interface Sub {
  correct: boolean;
  seconds: number;
}

interface BracketMatch {
  round: number;
  slot: number;
  playerA?: any; // Id<"users">
  playerB?: any;
  exerciseId?: string;
  subA?: Sub;
  subB?: Sub;
  winner?: any; // Id<"users">
}

const DUEL_WIN_XP = 75;
const DUEL_DRAW_XP = 15;
const TOURNAMENT_WIN_XP = 75;
const CHAMPION_XP = 150;
const RUNNER_UP_XP = 50;

/* ------------------------------ PvP rating ------------------------------ */

const ELO_K = 32;
const DEFAULT_RATING = 1000;

/** ELO-lite: kembalikan delta rating untuk pemain A (pemain B dapat kebalikan). */
function eloDelta(ratingA: number, ratingB: number, scoreA: number): number {
  const expected = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  return Math.round(ELO_K * (scoreA - expected));
}

/**
 * Catat hasil PvP untuk KEDUA pemain: rating + W/L/D.
 * Dipanggil sekali saat duel/match selesai (server-side).
 */
async function applyPvpResult(
  ctx: MutationCtx,
  idA: any,
  idB: any,
  winner: "a" | "b" | "draw",
): Promise<number> {
  const statsA = await getStats(ctx, idA);
  const statsB = await getStats(ctx, idB);
  const ra = statsA.duelRating ?? DEFAULT_RATING;
  const rb = statsB.duelRating ?? DEFAULT_RATING;
  const scoreA = winner === "a" ? 1 : winner === "draw" ? 0.5 : 0;
  const deltaA = eloDelta(ra, rb, scoreA);

  await ctx.db.patch(statsA._id, {
    duelRating: Math.max(100, ra + deltaA),
    duelWins: (statsA.duelWins ?? 0) + (winner === "a" ? 1 : 0),
    duelLosses: (statsA.duelLosses ?? 0) + (winner === "b" ? 1 : 0),
    duelDraws: (statsA.duelDraws ?? 0) + (winner === "draw" ? 1 : 0),
  });
  await ctx.db.patch(statsB._id, {
    duelRating: Math.max(100, rb - deltaA),
    duelWins: (statsB.duelWins ?? 0) + (winner === "b" ? 1 : 0),
    duelLosses: (statsB.duelLosses ?? 0) + (winner === "a" ? 1 : 0),
    duelDraws: (statsB.duelDraws ?? 0) + (winner === "draw" ? 1 : 0),
  });
  return deltaA;
}

/**
 * Anti-farming XP duel: duel ke-1 hari ini antar pasangan yang sama dapat
 * XP penuh, ke-2 setengah, ke-3 dst. tanpa XP (rating tetap berjalan).
 */
async function duelXpMultiplier(ctx: MutationCtx, a: any, b: any): Promise<number> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const ts = dayStart.getTime();
  const asHost = await ctx.db
    .query("duels")
    .withIndex("by_host", (q) => q.eq("hostId", a))
    .collect();
  const asGuest = await ctx.db
    .query("duels")
    .withIndex("by_guest", (q) => q.eq("guestId", b))
    .collect();
  const asHostRev = await ctx.db
    .query("duels")
    .withIndex("by_host", (q) => q.eq("hostId", b))
    .collect();
  const asGuestRev = await ctx.db
    .query("duels")
    .withIndex("by_guest", (q) => q.eq("guestId", a))
    .collect();
  const between = [
    ...asHost.filter((d) => d.guestId === b),
    ...asGuest.filter((d) => d.hostId === a),
    ...asHostRev.filter((d) => d.guestId === a),
    ...asGuestRev.filter((d) => d.hostId === b),
  ].filter(
    (d) => d.status === "finished" && (d.finishedAt ?? 0) >= ts,
  );
  const n = between.length; // jumlah duel selesai hari ini (belum termasuk yang ini)
  if (n === 0) return 1;
  if (n === 1) return 0.5;
  return 0;
}

function pickExerciseId(): string {
  const pool = battlePool();
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Validasi jawaban di server — client tidak pernah menentukan hasil. */
function checkAnswer(exerciseId: string, sql: string): boolean {
  const ex = EXERCISE_MAP.get(exerciseId);
  if (!ex) return false;
  try {
    const userRun = runSql(sql, JSON.parse(JSON.stringify(exerciseDataset(exerciseId))));
    const expected = runSql(ex.solution, exerciseDataset(exerciseId));
    return resultsMatch(userRun, expected, /order\s+by/i.test(ex.solution));
  } catch {
    return false;
  }
}

function fasterWinner(a: Sub, b: Sub, idA: any, idB: any): { winnerId: any; draw: boolean } {
  if (a.correct !== b.correct) {
    return { winnerId: a.correct ? idA : idB, draw: false };
  }
  if (!a.correct && !b.correct) return { winnerId: null, draw: true };
  if (Math.abs(a.seconds - b.seconds) < 0.05) return { winnerId: null, draw: true };
  return { winnerId: a.seconds < b.seconds ? idA : idB, draw: false };
}

async function grantXp(
  ctx: MutationCtx,
  userId: any,
  amount: number,
): Promise<number> {
  if (amount <= 0) return 0;
  const stats = await getStats(ctx, userId);
  const res = await awardXp(ctx, stats, amount);
  return res.xpAwarded;
}

/* ================================ DUEL ================================== */

/** Buat duel baru — server memilih challenge-nya. Balikan: kode 4 huruf. */
export const createDuel = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    // batalkan duel "waiting" lamanya biar tidak menumpuk
    const old = await ctx.db
      .query("duels")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
    for (const d of old) {
      if (d.hostId === userId) await ctx.db.delete(d._id);
    }

    let code = makeCode();
    for (let i = 0; i < 5; i++) {
      const clash = await ctx.db
        .query("duels")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!clash) break;
      code = makeCode();
    }

    await ctx.db.insert("duels", {
      code,
      hostId: userId,
      exerciseId: pickExerciseId(),
      status: "waiting",
      createdAt: Date.now(),
    });
    return { code };
  },
});

/** Join duel pakai kode. Duel langsung mulai. */
export const joinDuel = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const duel = await ctx.db
      .query("duels")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!duel) throw new Error("Kode duel nggak ketemu. Cek lagi ya.");
    if (duel.status !== "waiting") throw new Error("Duel ini sudah dimulai atau selesai.");
    if (duel.hostId === userId) throw new Error("Itu kode duel-mu sendiri. 😄");
    if (duel.guestId && duel.guestId !== userId) throw new Error("Duel ini sudah keambil orang lain.");

    await ctx.db.patch(duel._id, {
      guestId: userId,
      status: "fighting",
      startedAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Host membatalkan duel yang belum dimulai. */
export const cancelDuel = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const duel = await ctx.db
      .query("duels")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!duel || duel.hostId !== userId) throw new Error("Duel tidak ditemukan.");
    if (duel.status !== "waiting") throw new Error("Duel sudah berjalan.");
    await ctx.db.delete(duel._id);
    return { ok: true };
  },
});

/** Kirim jawaban duel. Begitu dua-duanya masuk, pemenang ditentukan server. */
export const submitDuel = mutation({
  args: { code: v.string(), sqlText: v.string(), elapsedSeconds: v.number() },
  handler: async (ctx, { code, sqlText, elapsedSeconds }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const duel = await ctx.db
      .query("duels")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!duel) throw new Error("Duel tidak ditemukan.");
    if (duel.status !== "fighting") throw new Error("Duel tidak sedang berjalan.");
    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;
    if (!isHost && !isGuest) throw new Error("Bukan peserta duel ini.");
    if (isHost && duel.hostSubmitted) throw new Error("Jawabanmu sudah terkunci.");
    if (isGuest && duel.guestSubmitted) throw new Error("Jawabanmu sudah terkunci.");

    const sub: Sub = {
      correct: checkAnswer(duel.exerciseId, sqlText),
      seconds: Math.round(elapsedSeconds * 10) / 10,
    };

    const hostSubmitted = isHost ? sub : duel.hostSubmitted;
    const guestSubmitted = isGuest ? sub : duel.guestSubmitted;

    if (!hostSubmitted || !guestSubmitted) {
      await ctx.db.patch(duel._id, isHost ? { hostSubmitted: sub } : { guestSubmitted: sub });
      return { resolved: false as const };
    }

    // dua-duanya masuk → tentukan pemenang
    const { winnerId, draw } = fasterWinner(hostSubmitted, guestSubmitted, duel.hostId, duel.guestId!);
    // anti-farm multiplier dihitung SEBELUM duel ini ditandai selesai,
    // supaya duel ini sendiri tidak ikut terhitung
    const mult = await duelXpMultiplier(ctx, duel.hostId, duel.guestId!);
    await ctx.db.patch(duel._id, {
      hostSubmitted,
      guestSubmitted,
      winnerId: winnerId ?? undefined,
      isDraw: draw,
      status: "finished",
      finishedAt: Date.now(),
    });

    // rating PvP untuk kedua pemain (sekali, di transaksi penyelesaian)
    const ratingDelta = await applyPvpResult(
      ctx,
      duel.hostId,
      duel.guestId!,
      draw ? "draw" : winnerId === duel.hostId ? "a" : "b",
    );

    // XP dengan anti-farming: hanya pemenang/seri, dikali multiplier harian
    let xpAwarded = 0;
    if (draw) {
      xpAwarded = await grantXp(ctx, userId, Math.round(DUEL_DRAW_XP * mult));
    } else if (winnerId === userId) {
      xpAwarded = await grantXp(ctx, userId, Math.round(DUEL_WIN_XP * mult));
      const stats = await getStats(ctx, userId);
      if (!stats.badges.includes("first_duel_win")) {
        await ctx.db.patch(stats._id, { badges: [...stats.badges, "first_duel_win"] });
      }
    }
    return { resolved: true as const, won: winnerId === userId, draw, xpAwarded, ratingDelta };
  },
});

/** Riwayat duel user (untuk profil): lawan, hasil, durasi, challenge. */
export const myDuelHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const hosted = await ctx.db
      .query("duels")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .collect();
    const guested = await ctx.db
      .query("duels")
      .withIndex("by_guest", (q) => q.eq("guestId", userId))
      .collect();
    const finished = [...hosted, ...guested]
      .filter((d) => d.status === "finished")
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, 20);

    const out = [];
    for (const d of finished) {
      const oppId = d.hostId === userId ? d.guestId : d.hostId;
      const opp = oppId ? await ctx.db.get(oppId) : null;
      const mySub = d.hostId === userId ? d.hostSubmitted : d.guestSubmitted;
      out.push({
        opponent: opp?.name ?? opp?.username ?? "Petualang",
        opponentEmoji: opp?.avatarEmoji ?? "🦉",
        won: d.winnerId === userId,
        draw: d.isDraw ?? false,
        mySeconds: mySub?.seconds ?? null,
        exerciseTitle: EXERCISE_MAP.get(d.exerciseId)?.title ?? d.exerciseId,
        at: d.finishedAt ?? d.createdAt,
      });
    }
    return out;
  },
});

/** Baca satu duel + info publik challenge-nya (tanpa solution!). */
export const getDuel = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const duel = await ctx.db
      .query("duels")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .first();
    if (!duel) return null;
    if (duel.hostId !== userId && duel.guestId !== userId) return null;

    const ex = EXERCISE_MAP.get(duel.exerciseId);
    const host = await ctx.db.get(duel.hostId);
    const guest = duel.guestId ? await ctx.db.get(duel.guestId) : null;

    return {
      code: duel.code,
      status: duel.status,
      exercise: ex
        ? {
            id: ex.id,
            title: ex.title,
            instruction: ex.instruction,
            starter: ex.starter,
            dataset: ex.dataset,
          }
        : null,
      host: { id: duel.hostId, name: host?.name ?? "Host", emoji: host?.avatarEmoji ?? "🦉" },
      guest: guest
        ? { id: duel.guestId!, name: guest.name ?? "Guest", emoji: guest.avatarEmoji ?? "🦉" }
        : null,
      hostSubmitted: duel.hostSubmitted ?? null,
      guestSubmitted: duel.guestSubmitted ?? null,
      winnerId: duel.winnerId ?? null,
      isDraw: duel.isDraw ?? false,
      amHost: duel.hostId === userId,
    };
  },
});

/* ============================== TOURNAMENT =============================== */

/** Buat turnamen (guru/admin). Default SQL Cup 16 slot. */
export const createTournament = mutation({
  args: { name: v.string(), maxSize: v.number() },
  handler: async (ctx, { name, maxSize }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru yang bisa membuat turnamen.");
    }
    if (![4, 8, 16].includes(maxSize)) throw new Error("Ukuran bracket harus 4, 8, atau 16.");

    const id = await ctx.db.insert("tournaments", {
      name: name.trim() || "SQL Cup",
      status: "open",
      hostId: userId,
      maxSize,
      players: [userId],
      bracket: [],
      rounds: Math.log2(maxSize),
      createdAt: Date.now(),
    });
    return { id };
  },
});

/** Siswa gabung turnamen yang masih open. */
export const joinTournament = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Turnamen tidak ditemukan.");
    if (t.status !== "open") throw new Error("Turnamen sudah ditutup.");
    if (t.players.includes(userId)) return { ok: true };
    if (t.players.length >= t.maxSize) throw new Error("Slot turnamen sudah penuh.");
    await ctx.db.patch(id, { players: [...t.players, userId] });
    return { ok: true };
  },
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Mulai turnamen: seeding + bracket round 1 + proses BYE.
 * Bracket size = pangkat 2 terdekat ≥ jumlah pemain.
 */
export const startTournament = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Turnamen tidak ditemukan.");
    if (t.hostId !== userId) throw new Error("Hanya host yang bisa memulai.");
    if (t.status !== "open") throw new Error("Turnamen sudah berjalan.");
    if (t.players.length < 2) throw new Error("Minimal 2 pemain untuk memulai.");

    const bracketSize = Math.max(
      2,
      2 ** Math.ceil(Math.log2(t.players.length)),
    );
    const rounds = Math.log2(bracketSize);
    const seeded = shuffle(t.players);

    const bracket: BracketMatch[] = [];
    const firstRoundMatches = bracketSize / 2;
    for (let slot = 0; slot < firstRoundMatches; slot++) {
      bracket.push({
        round: 1,
        slot,
        playerA: seeded[2 * slot],
        playerB: seeded[2 * slot + 1],
      });
    }

    // babak berikutnya: kosong, menunggu pemenang
    let matchesInRound = firstRoundMatches;
    for (let r = 2; r <= rounds; r++) {
      matchesInRound = matchesInRound / 2;
      for (let slot = 0; slot < matchesInRound; slot++) {
        bracket.push({ round: r, slot });
      }
    }

    // proses BYE: match dengan satu pemain → otomatis lolos
    const advance = (matchIdx: number, winnerId: string) => {
      const m = bracket[matchIdx];
      m.winner = winnerId;
      if (m.round === rounds) return; // final
      const next = bracket.find(
        (b) => b.round === m.round + 1 && b.slot === Math.floor(m.slot / 2),
      )!;
      if (m.slot % 2 === 0) next.playerA = winnerId;
      else next.playerB = winnerId;
      if (next.playerA && next.playerB) next.exerciseId = pickExerciseId();
    };

    for (let i = 0; i < bracket.length; i++) {
      const m = bracket[i];
      if (m.round === 1 && m.playerA && !m.playerB) advance(i, m.playerA);
      else if (m.round === 1 && !m.playerA && m.playerB) advance(i, m.playerB);
      else if (m.round === 1 && m.playerA && m.playerB) m.exerciseId = pickExerciseId();
    }

    await ctx.db.patch(id, { status: "running", bracket, rounds });
    return { ok: true };
  },
});

/**
 * Kirim jawaban match turnamen. Begitu dua-duanya masuk:
 * pemenang maju ke babak berikutnya; final → champion.
 */
export const submitTournamentMatch = mutation({
  args: {
    id: v.id("tournaments"),
    matchRound: v.number(),
    matchSlot: v.number(),
    sqlText: v.string(),
    elapsedSeconds: v.number(),
  },
  handler: async (ctx, { id, matchRound, matchSlot, sqlText, elapsedSeconds }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const t = await ctx.db.get(id);
    if (!t) throw new Error("Turnamen tidak ditemukan.");
    if (t.status !== "running") throw new Error("Turnamen tidak sedang berjalan.");

    const bracket = JSON.parse(JSON.stringify(t.bracket)) as BracketMatch[];
    const idx = bracket.findIndex(
      (m) => m.round === matchRound && m.slot === matchSlot,
    );
    if (idx < 0) throw new Error("Match tidak ditemukan.");
    const m = bracket[idx];
    const isA = m.playerA === userId;
    const isB = m.playerB === userId;
    if (!isA && !isB) throw new Error("Kamu bukan peserta match ini.");
    if (m.winner) throw new Error("Match ini sudah selesai.");
    if (!m.exerciseId) throw new Error("Challenge match belum siap.");

    const sub: Sub = {
      correct: checkAnswer(m.exerciseId, sqlText),
      seconds: Math.round(elapsedSeconds * 10) / 10,
    };
    if (isA) m.subA = sub;
    else m.subB = sub;

    let xpAwarded = 0;
    let champion = false;

    if (!m.subA || !m.subB) {
      await ctx.db.patch(id, { bracket });
      return { resolved: false as const };
    }

    // keduanya sudah submit → tentukan pemenang
    const { winnerId, draw } = fasterWinner(m.subA, m.subB, m.playerA!, m.playerB!);
    if (winnerId) {
      m.winner = winnerId;
    } else {
      // seri → yang lebih dulu submit menang (tie-break sederhana)
      m.winner = m.subA.seconds <= m.subB.seconds ? m.playerA! : m.playerB!;
    }

    const winnerIsMe = m.winner === userId;
    if (winnerIsMe) xpAwarded = await grantXp(ctx, userId, TOURNAMENT_WIN_XP);

    // rating PvP turnamen: setiap match resmi menggerakkan rating kedua pemain
    await applyPvpResult(
      ctx,
      m.playerA!,
      m.playerB!,
      m.winner === m.playerA ? "a" : "b",
    );

    if (m.round === t.rounds) {
      // FINAL — turnamen selesai
      champion = true;
      await ctx.db.patch(id, { bracket, status: "finished", champion: m.winner });
      if (winnerIsMe) {
        xpAwarded += await grantXp(ctx, userId, CHAMPION_XP);
        const stats = await getStats(ctx, userId);
        if (!stats.badges.includes("champion")) {
          await ctx.db.patch(stats._id, { badges: [...stats.badges, "champion"] });
        }
      } else {
        xpAwarded += await grantXp(ctx, userId, RUNNER_UP_XP);
      }
    } else {
      // maju ke babak berikutnya
      const next = bracket.find(
        (b) => b.round === m.round + 1 && b.slot === Math.floor(m.slot / 2),
      )!;
      if (m.slot % 2 === 0) next.playerA = m.winner;
      else next.playerB = m.winner;
      if (next.playerA && next.playerB && !next.exerciseId) {
        next.exerciseId = pickExerciseId();
      }
      await ctx.db.patch(id, { bracket });
    }

    return { resolved: true as const, won: winnerIsMe, champion, xpAwarded };
  },
});

/** Daftar turnamen untuk halaman battle. */
export const listTournaments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const all = await ctx.db.query("tournaments").order("desc").take(20);
    const result = [];
    for (const t of all) {
      const host = await ctx.db.get(t.hostId);
      result.push({
        id: t._id,
        name: t.name,
        status: t.status,
        maxSize: t.maxSize,
        playerCount: t.players.length,
        joined: t.players.includes(userId),
        amHost: t.hostId === userId,
        hostName: host?.name ?? "Guru",
        championName: t.champion
          ? ((await ctx.db.get(t.champion))?.name ?? "—")
          : null,
        createdAt: t.createdAt,
      });
    }
    return result;
  },
});

/** Detail turnamen: bracket lengkap + nama + challenge publik per match. */
export const getTournament = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const t = await ctx.db.get(id);
    if (!t) return null;
    if (!t.players.includes(userId) && t.hostId !== userId) return null;

    const nameOf = new Map<string, { name: string; emoji: string }>();
    for (const pid of t.players) {
      const u = await ctx.db.get(pid);
      if (u) nameOf.set(pid, { name: u.name ?? "Pemain", emoji: u.avatarEmoji ?? "🦉" });
    }

    const matches = [];
    for (const m of t.bracket) {
      const ex = m.exerciseId ? EXERCISE_MAP.get(m.exerciseId) : null;
      matches.push({
        round: m.round,
        slot: m.slot,
        playerA: m.playerA ? { id: m.playerA, ...(nameOf.get(m.playerA) ?? { name: "?", emoji: "🦉" }) } : null,
        playerB: m.playerB ? { id: m.playerB, ...(nameOf.get(m.playerB) ?? { name: "?", emoji: "🦉" }) } : null,
        subA: m.subA ?? null,
        subB: m.subB ?? null,
        winner: m.winner ?? null,
        isMine: m.playerA === userId || m.playerB === userId,
        exercise: ex
          ? { id: ex.id, title: ex.title, instruction: ex.instruction, starter: ex.starter, dataset: ex.dataset }
          : null,
      });
    }

    const champion = t.champion ? (nameOf.get(t.champion) ?? null) : null;
    return {
      id: t._id,
      name: t.name,
      status: t.status,
      rounds: t.rounds,
      maxSize: t.maxSize,
      players: [...nameOf.values()],
      joined: t.players.includes(userId),
      amHost: t.hostId === userId,
      matches,
      champion,
    };
  },
});
