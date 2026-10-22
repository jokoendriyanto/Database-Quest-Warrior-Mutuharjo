import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { EXERCISE_MAP } from "../lib/curriculum";
import {
  COOLDOWN_SECONDS,
  DAILY_CAP,
  MAX_LEVEL,
} from "../lib/mentor-context";

/* --------------------------- status & history --------------------------- */

/**
 * GET status AI Mentor (PRD 8.7). Dipakai UI untuk menyembunyikan panel
 * saat belum dikonfigurasi. enabled=true hanya jika ada profil aktif.
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { enabled: false, model: null };

    const active = await ctx.db
      .query("aiProviderProfiles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    // Fallback env (MENTOR_*) diverifikasi di action requestHint — di sini
    // cukup laporkan profil aktif supaya query tetap murah.
    return { enabled: active !== null, model: active?.model ?? null };
  },
});

/** Riwayat hint milik siswa sendiri untuk satu case (PRD 8.7 history). */
export const history = query({
  args: { exerciseId: v.string() },
  handler: async (ctx, { exerciseId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { hints: [] };
    const rows = await ctx.db
      .query("mentorHints")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", exerciseId),
      )
      .order("asc")
      .collect();
    return {
      hints: rows.map((h) => ({
        level: h.hintLevel,
        hint: h.responseText,
        created_at: new Date(h.createdAt).toISOString(),
      })),
    };
  },
});

/**
 * Progres siswa untuk satu case (PRD 8.9) — dipakai panel UI untuk state
 * tombol: disabled (belum eligible), countdown cooldown, dan kartu stuck.
 * Angka eligibility/cooldown-nya sama persis dengan checkEligibility,
 * tapi dihitung tanpa melempar error supaya murah dipanggil reaktif.
 */
export const progress = query({
  args: { exerciseId: v.string() },
  handler: async (ctx, { exerciseId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    if (!EXERCISE_MAP.has(exerciseId)) return null;

    const attempts = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", exerciseId),
      )
      .collect();
    const failedAttempts = attempts.filter((a) => !a.isCorrect).length;

    const hints = await ctx.db
      .query("mentorHints")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", exerciseId),
      )
      .order("asc")
      .collect();
    const usedLevels = hints.map((h) => h.hintLevel);

    const nextLevel = usedLevels.length === 0 ? 1 : Math.max(...usedLevels) + 1;

    const lastHint = hints[hints.length - 1];
    const cooldownRemaining = lastHint
      ? Math.max(
          0,
          Math.ceil((COOLDOWN_SECONDS * 1000 - (Date.now() - lastHint.createdAt)) / 1000),
        )
      : 0;

    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("mentorHints")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", dayAgo),
      )
      .collect();
    const dailyRemaining = Math.max(0, DAILY_CAP - recent.length);

    const eligibleByFailures = failedAttempts >= 2;
    const eligibleByChain =
      nextLevel > 1 && usedLevels.some((l) => l === nextLevel - 1);
    const eligible =
      nextLevel <= MAX_LEVEL &&
      (eligibleByFailures || eligibleByChain) &&
      cooldownRemaining === 0 &&
      dailyRemaining > 0;

    // Kartu stuck (PRD 8.9): 3 petunjuk sudah dipakai + minimal 5 kali gagal
    const stuck = usedLevels.length >= MAX_LEVEL && failedAttempts >= 5;

    return {
      failedAttempts,
      hintsUsed: usedLevels.length,
      nextLevel,
      cooldownRemaining,
      dailyRemaining,
      eligible,
      stuck,
    };
  },
});

/* --------------------- internal: eligibility & record -------------------- */

async function lastAttemptOf(
  ctx: QueryCtx,
  userId: Id<"users">,
  exerciseId: string,
) {
  return await ctx.db
    .query("exerciseAttempts")
    .withIndex("by_user_exercise", (q) =>
      q.eq("userId", userId).eq("exerciseId", exerciseId),
    )
    .order("desc")
    .first();
}

/**
 * Validasi eligibility hint (PRD 8.7) — dipanggil dari action sebelum LLM.
 * Mengembalikan { ok: false, error } atau data lengkap untuk rakit prompt.
 */
export const checkEligibility = internalQuery({
  args: { exerciseId: v.string(), level: v.union(v.literal(1), v.literal(2), v.literal(3)) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { ok: false as const, error: "not_authenticated" as const };

    if (!EXERCISE_MAP.has(args.exerciseId)) {
      return { ok: false as const, error: "not_eligible" as const };
    }

    // Hitung attempt gagal pada case ini
    const attempts = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId),
      )
      .collect();
    const failedAttempts = attempts.filter((a) => !a.isCorrect).length;

    // Hint yang sudah dipakai pada case ini
    const hints = await ctx.db
      .query("mentorHints")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId),
      )
      .order("asc")
      .collect();
    const usedLevels = hints.map((h) => h.hintLevel);

    // Level harus berurutan: = hint terakhir + 1, tidak boleh loncat (8.7)
    const nextLevel = usedLevels.length === 0 ? 1 : Math.max(...usedLevels) + 1;
    if (args.level !== nextLevel || args.level > MAX_LEVEL) {
      return { ok: false as const, error: "level_invalid" as const };
    }

    // Eligibility: gagal >= 2x ATAU level > 1 dengan level sebelumnya terpakai
    const eligibleByFailures = failedAttempts >= 2;
    const eligibleByChain =
      args.level > 1 && usedLevels.some((l) => l === args.level - 1);
    if (!eligibleByFailures && !eligibleByChain) {
      return { ok: false as const, error: "not_eligible" as const };
    }

    // Cooldown 20 detik sejak hint terakhir (8.7)
    const lastHint = hints[hints.length - 1];
    if (lastHint && Date.now() - lastHint.createdAt < COOLDOWN_SECONDS * 1000) {
      return {
        ok: false as const,
        error: "cooldown" as const,
        retry_after_seconds: Math.ceil(
          (COOLDOWN_SECONDS * 1000 - (Date.now() - lastHint.createdAt)) / 1000,
        ),
      };
    }

    // Daily cap 30 request/hari per siswa (10.4)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("mentorHints")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", dayAgo),
      )
      .collect();
    if (recent.length >= DAILY_CAP) {
      return { ok: false as const, error: "daily_cap" as const };
    }

    const lastAttempt = await lastAttemptOf(ctx, userId, args.exerciseId);
    return {
      ok: true as const,
      userId,
      failedAttempts,
      usedLevels,
      lastAttemptId: lastAttempt?._id,
      lastQuery: lastAttempt?.queryText ?? null,
      lastError: lastAttempt?.errorMessage ?? null,
      priorHints: hints.map((h) => ({
        hintLevel: h.hintLevel,
        responseText: h.responseText,
      })),
    };
  },
});

/** Catat hint berhasil — hanya dipanggil dari action setelah LLM sukses. */
export const recordHint = internalMutation({
  args: {
    userId: v.id("users"),
    exerciseId: v.string(),
    attemptId: v.optional(v.id("exerciseAttempts")),
    profileId: v.optional(v.id("aiProviderProfiles")),
    hintLevel: v.union(v.literal(1), v.literal(2), v.literal(3)),
    promptText: v.string(),
    responseText: v.string(),
    model: v.string(),
    tokensUsed: v.optional(v.number()),
    latencyMs: v.number(),
  },
  handler: async (ctx: MutationCtx, args) => {
    return await ctx.db.insert("mentorHints", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
