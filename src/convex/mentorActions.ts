/**
 * Action Node untuk AI Mentor (PRD 8.6-8.7).
 *
 * Dipisah dari mentor.ts karena: (1) butuh fetch ke provider AI, hanya
 * tersedia di action; (2) membaca env fallback MENTOR_BASE_URL/API_KEY/MODEL.
 * File ini wajib "use node" — Convex melarang export query/mutation di sini.
 */
"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { buildMentorContext } from "../lib/mentor-context";
import { chatComplete, postFilterOutput, DEFAULT_CHAT_PARAMS } from "../lib/ai-provider";
import { decryptSecret } from "../lib/ai-crypto";

/**
 * Feature flag rollout (PRD 12): AI_MENTOR_ENABLED harus "true"/"1".
 * Default OFF supaya biaya AI tidak menyala sebelum pilot siap.
 */
function mentorFlagOn(): boolean {
  const flag = (process.env.AI_MENTOR_ENABLED ?? "").toLowerCase();
  return flag === "true" || flag === "1";
}

/**
 * POST hint (PRD 8.7). Alur:
 * 1. Cek profil aktif atau env fallback -> 503 mentor_not_configured jika nihil.
 * 2. Validasi eligibility via internal.mentor.checkEligibility (urutan level,
 *    gagal >= 2x, cooldown 20s, daily cap 30) -> ConvexError { error }.
 * 3. Rakit prompt (8.5, tanpa PII) -> panggil provider.
 * 4. Post-filter never-rules + em dash. Jika gagal filter, hint TIDAK
 *    dihitung terpakai (level bisa dipinta ulang).
 * 5. Catat ke mentorHints (evidence) dan kembalikan hint.
 */
export const requestHint = action({
  args: {
    exerciseId: v.string(),
    level: v.union(v.literal(1), v.literal(2), v.literal(3)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ error: "not_authenticated" });
    }

    // 0. Feature flag rollout (PRD 12) — default off
    if (!mentorFlagOn()) {
      throw new ConvexError({ error: "mentor_not_configured" });
    }

    // 1. Konfigurasi: profil aktif (dikelola guru) atau env fallback (8.6)
    const active = await ctx.runQuery(
      internal.aiSettings.activeProfileConfig,
      {},
    );
    let baseUrl: string;
    let apiKey: string | null;
    let model: string;
    let temperature: number;
    let maxTokens: number;
    let timeoutMs: number;
    let profileId: Id<"aiProviderProfiles"> | undefined;

    if (active) {
      baseUrl = active.baseUrl;
      model = active.model;
      temperature = active.temperature;
      maxTokens = active.maxTokens;
      timeoutMs = active.timeoutSeconds * 1000;
      profileId = active._id;
      try {
        apiKey = active.apiKeyEncrypted ? decryptSecret(active.apiKeyEncrypted) : null;
      } catch {
        // Master key hilang/berubah — jangan bocorkan detail ke siswa.
        throw new ConvexError({ error: "provider_error" });
      }
    } else {
      const envBase = process.env.MENTOR_BASE_URL;
      const envKey = process.env.MENTOR_API_KEY;
      const envModel = process.env.MENTOR_MODEL;
      if (!envBase || !envModel) {
        throw new ConvexError({ error: "mentor_not_configured" });
      }
      baseUrl = envBase;
      apiKey = envKey ?? null;
      model = envModel;
      temperature = DEFAULT_CHAT_PARAMS.temperature;
      maxTokens = DEFAULT_CHAT_PARAMS.maxTokens;
      timeoutMs = DEFAULT_CHAT_PARAMS.timeoutMs;
    }

    // 2. Eligibility (urutan level, cooldown, daily cap) — server-side
    const elig = await ctx.runQuery(internal.mentor.checkEligibility, {
      exerciseId: args.exerciseId,
      level: args.level,
    });
    if (!elig.ok) {
      if (elig.error === "cooldown") {
        throw new ConvexError({
          error: "cooldown",
          retry_after_seconds: elig.retry_after_seconds,
        });
      }
      throw new ConvexError({ error: elig.error });
    }

    // 3. Rakit prompt (tanpa nama/email — hanya ID internal, PRD 10.2)
    const ctxParts = buildMentorContext({
      level: args.level,
      exerciseId: args.exerciseId,
      lastQuery: elig.lastQuery,
      lastError: elig.lastError,
      priorHints: elig.priorHints,
    });
    if (!ctxParts) {
      throw new ConvexError({ error: "not_eligible" });
    }

    // 4. Panggil provider (gagal/timeout -> 502, hint tidak dihitung terpakai)
    let raw: { text: string; tokensUsed: number | null; latencyMs: number };
    try {
      raw = await chatComplete({
        baseUrl,
        apiKey,
        model,
        messages: [
          { role: "system", content: ctxParts.system },
          { role: "user", content: ctxParts.user },
        ],
        params: { temperature, maxTokens, timeoutMs },
      });
    } catch {
      // Detail error hanya di log server (8.9) — siswa dapat pesan ramah.
      console.error("[AI Mentor] provider gagal", { baseUrl, model, profileId });
      throw new ConvexError({ error: "provider_error" });
    }

    // 4b. Post-filter never-rules (8.4) + em dash (10.3)
    const hint = postFilterOutput(raw.text);
    if (hint === null) {
      console.error("[AI Mentor] output melanggar never-rules, hint ditolak", {
        model,
        profileId,
        level: args.level,
        exerciseId: args.exerciseId,
      });
      throw new ConvexError({ error: "provider_error" });
    }

    // 5. Catat evidence lengkap (8.10): prompt -> hint -> model -> latency
    await ctx.runMutation(internal.mentor.recordHint, {
      userId,
      exerciseId: args.exerciseId,
      attemptId: elig.lastAttemptId ?? undefined,
      profileId,
      hintLevel: args.level,
      promptText: `${ctxParts.system}\n\n${ctxParts.user}`.slice(0, 8000),
      responseText: raw.text.slice(0, 4000),
      model,
      tokensUsed: raw.tokensUsed ?? undefined,
      latencyMs: raw.latencyMs,
    });

    return {
      hint,
      level: args.level,
      hints_remaining: 3 - args.level,
      cooldown_seconds: 20,
      model,
    };
  },
});

/**
 * GET status (PRD 8.7) — action karena perlu membaca env fallback.
 * enabled=true jika ada profil aktif ATAU env MENTOR_* lengkap.
 */
export const statusWithEnv = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ enabled: boolean; model: string | null }> => {
    if (!mentorFlagOn()) return { enabled: false, model: null };
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { enabled: false, model: null };

    const active = await ctx.runQuery(internal.aiSettings.activeProfileConfig, {});
    if (active) return { enabled: true, model: active.model };

    const envOn = Boolean(
      process.env.MENTOR_BASE_URL && process.env.MENTOR_MODEL,
    );
    return { enabled: envOn, model: process.env.MENTOR_MODEL ?? null };
  },
});
