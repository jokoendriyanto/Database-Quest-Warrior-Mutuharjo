/**
 * Action Node untuk Pengaturan Model AI (PRD 9.5, 9.8).
 *
 * Alasan "use node": (1) enkripsi/dekripsi API key butuh process.env
 * APP_ENCRYPTION_KEY + node:crypto; (2) tes koneksi & daftar model butuh
 * fetch ke provider — browser tidak pernah memanggil provider langsung (9.4).
 */
"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { encryptSecret, decryptSecret, maskLast4 } from "../lib/ai-crypto";
import {
  chatComplete,
  listModels,
  validateBaseUrl,
  normalizeBaseUrl,
  friendlyProviderMessage,
  ProviderError,
} from "../lib/ai-provider";

async function requireTeacherAction(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError({ error: "not_authenticated" });
  const me = await ctx.runQuery(internal.aiSettings.roleOf, { userId });
  if (me !== "teacher" && me !== "admin") {
    throw new ConvexError({ error: "forbidden" });
  }
  return userId;
}

/** Validasi field profil (9.2). Melempar ConvexError dengan pesan guru. */
function validateProfileFields(args: {
  name: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeoutSeconds?: number;
}) {
  const name = args.name.trim();
  if (!name || name.length > 64) {
    throw new ConvexError({
      error: "invalid_field",
      field: "name",
      message: "Nama profil wajib diisi, maksimal 64 karakter.",
    });
  }
  let baseUrl: string;
  try {
    baseUrl = validateBaseUrl(args.baseUrl);
  } catch (err) {
    throw new ConvexError({
      error: "invalid_field",
      field: "base_url",
      message: err instanceof Error ? err.message : "Base URL tidak valid.",
    });
  }
  const model = args.model.trim();
  if (!model || model.length > 128) {
    throw new ConvexError({
      error: "invalid_field",
      field: "model",
      message: "Nama model wajib diisi, maksimal 128 karakter.",
    });
  }
  const temperature = args.temperature ?? 0.3;
  if (!(temperature >= 0 && temperature <= 1)) {
    throw new ConvexError({
      error: "invalid_field",
      field: "temperature",
      message: "Temperature harus antara 0.0 dan 1.0.",
    });
  }
  const maxTokens = args.maxTokens ?? 200;
  if (!Number.isInteger(maxTokens) || maxTokens < 50 || maxTokens > 2000) {
    throw new ConvexError({
      error: "invalid_field",
      field: "max_tokens",
      message: "Max tokens harus bilangan bulat antara 50 dan 2000.",
    });
  }
  const timeoutSeconds = args.timeoutSeconds ?? 15;
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 5 || timeoutSeconds > 60) {
    throw new ConvexError({
      error: "invalid_field",
      field: "timeout_seconds",
      message: "Timeout harus bilangan bulat antara 5 dan 60 detik.",
    });
  }
  return { name, baseUrl, model, temperature, maxTokens, timeoutSeconds };
}

function isLocalUrl(baseUrl: string): boolean {
  try {
    const host = new URL(normalizeBaseUrl(baseUrl)).hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "[::1]" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/** POST buat profil (9.3) — tidak otomatis aktif, key terenkripsi. */
export const createProfile = action({
  args: {
    name: v.string(),
    baseUrl: v.string(),
    apiKey: v.optional(v.string()), // opsional untuk provider lokal
    model: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    timeoutSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherAction(ctx);
    const f = validateProfileFields(args);

    const key = args.apiKey?.trim() ?? "";
    let apiKeyEncrypted: string | undefined;
    let apiKeyLast4: string | undefined;
    if (key) {
      try {
        apiKeyEncrypted = encryptSecret(key);
        apiKeyLast4 = maskLast4(key);
      } catch (err) {
        throw new ConvexError({
          error: "encryption_unavailable",
          message: err instanceof Error ? err.message : "Enkripsi gagal.",
        });
      }
    } else if (!isLocalUrl(f.baseUrl)) {
      throw new ConvexError({
        error: "invalid_field",
        field: "api_key",
        message: "API key wajib untuk provider cloud. Kosongkan hanya untuk provider lokal (localhost).",
      });
    }

    const id: Id<"aiProviderProfiles"> = await ctx.runMutation(
      internal.aiSettings.insertProfile,
      {
        teacherId,
        name: f.name,
        baseUrl: f.baseUrl,
        apiKeyEncrypted,
        apiKeyLast4,
        model: f.model,
        temperature: f.temperature,
        maxTokens: f.maxTokens,
        timeoutSeconds: f.timeoutSeconds,
      },
    );
    return { ok: true, id };
  },
});

/** PUT ubah profil (9.2) — apiKey kosong = tidak mengubah key lama. */
export const updateProfile = action({
  args: {
    id: v.id("aiProviderProfiles"),
    name: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    timeoutSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherAction(ctx);

    const existing = await ctx.runQuery(internal.aiSettings.profileSecrets, {
      id: args.id,
    });
    if (!existing) throw new ConvexError({ error: "not_found" });

    // Validasi gabungan: field lama dipakai sebagai default supaya update
    // sebagian tidak menabrak range validasi.
    const f = validateProfileFields({
      name: args.name ?? existing.name,
      baseUrl: args.baseUrl ?? existing.baseUrl,
      model: args.model ?? existing.model,
      temperature: args.temperature ?? existing.temperature,
      maxTokens: args.maxTokens ?? existing.maxTokens,
      timeoutSeconds: args.timeoutSeconds ?? existing.timeoutSeconds,
    });

    const patch: {
      name?: string;
      baseUrl?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      timeoutSeconds?: number;
      apiKeyEncrypted?: string;
      apiKeyLast4?: string;
    } = {};
    if (args.name !== undefined) patch.name = f.name;
    if (args.baseUrl !== undefined) patch.baseUrl = f.baseUrl;
    if (args.model !== undefined) patch.model = f.model;
    if (args.temperature !== undefined) patch.temperature = f.temperature;
    if (args.maxTokens !== undefined) patch.maxTokens = f.maxTokens;
    if (args.timeoutSeconds !== undefined) patch.timeoutSeconds = f.timeoutSeconds;

    const key = args.apiKey?.trim() ?? "";
    if (key) {
      // Hanya encrypt kalau key benar-benar dikirim (9.4.5).
      try {
        patch.apiKeyEncrypted = encryptSecret(key);
        patch.apiKeyLast4 = maskLast4(key);
      } catch (err) {
        throw new ConvexError({
          error: "encryption_unavailable",
          message: err instanceof Error ? err.message : "Enkripsi gagal.",
        });
      }
    }

    await ctx.runMutation(internal.aiSettings.updateProfile, {
      id: args.id,
      teacherId,
      ...patch,
    });
    return { ok: true };
  },
});

/**
 * POST tes koneksi (9.5) — dua mode:
 * a) { profile_id } -> tes profil tersimpan (decrypt key server-side)
 * b) { base_url, api_key, model } -> tes konfigurasi form, belum disimpan
 */
export const testConnection = action({
  args: {
    profileId: v.optional(v.id("aiProviderProfiles")),
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    model: v.optional(v.string()),
    timeoutSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const teacherId = await requireTeacherAction(ctx);

    let baseUrl: string;
    let apiKey: string | null;
    let model: string;
    let timeoutSeconds: number;

    if (args.profileId) {
      const p = await ctx.runQuery(internal.aiSettings.profileSecrets, {
        id: args.profileId,
      });
      if (!p) throw new ConvexError({ error: "not_found" });
      baseUrl = p.baseUrl;
      model = p.model;
      timeoutSeconds = p.timeoutSeconds;
      if (p.apiKeyEncrypted) {
        try {
          apiKey = decryptSecret(p.apiKeyEncrypted);
        } catch {
          await ctx.runMutation(internal.aiSettings.auditTest, {
            teacherId,
            profileId: args.profileId,
            ok: false,
            detail: "Gagal mendekripsi API key (cek APP_ENCRYPTION_KEY)",
          });
          throw new ConvexError({
            error: "encryption_unavailable",
            message:
              "API key tersimpan tidak bisa dibuka. Pastikan env APP_ENCRYPTION_KEY di deployment tidak berubah.",
          });
        }
      } else {
        apiKey = null;
      }
    } else {
      if (!args.baseUrl || !args.model) {
        throw new ConvexError({
          error: "invalid_field",
          message: "Isi base URL dan model untuk menguji konfigurasi form.",
        });
      }
      try {
        baseUrl = validateBaseUrl(args.baseUrl);
      } catch (err) {
        throw new ConvexError({
          error: "invalid_field",
          field: "base_url",
          message: err instanceof Error ? err.message : "Base URL tidak valid.",
        });
      }
      apiKey = args.apiKey?.trim() || null;
      model = args.model.trim();
      timeoutSeconds = args.timeoutSeconds ?? 15;
    }

    try {
      const res = await chatComplete({
        baseUrl,
        apiKey,
        model,
        messages: [{ role: "user", content: "Balas dengan satu kata: siap" }],
        params: {
          temperature: 0,
          maxTokens: 10,
          timeoutMs: timeoutSeconds * 1000,
        },
      });
      await ctx.runMutation(internal.aiSettings.auditTest, {
        teacherId,
        profileId: args.profileId,
        ok: true,
        detail: `Tes koneksi sukses: ${model} merespons dalam ${res.latencyMs} ms`,
      });
      return {
        ok: true,
        latency_ms: res.latencyMs,
        model,
        sample: res.text.slice(0, 100),
      };
    } catch (err) {
      const kind = err instanceof ProviderError ? err.kind : "unknown";
      const detail = err instanceof ProviderError ? err.detail : String(err);
      await ctx.runMutation(internal.aiSettings.auditTest, {
        teacherId,
        profileId: args.profileId,
        ok: false,
        detail: `Tes koneksi gagal (${kind}): ${detail}`,
      });
      return { ok: false, error: kind, detail: friendlyProviderMessage(kind) };
    }
  },
});

/** GET proxy daftar model (9.8) — key dikirim server-side, tidak ke browser. */
export const getModels = action({
  args: {
    profileId: v.optional(v.id("aiProviderProfiles")),
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeacherAction(ctx);

    let baseUrl: string;
    let apiKey: string | null;
    if (args.profileId) {
      const p = await ctx.runQuery(internal.aiSettings.profileSecrets, {
        id: args.profileId,
      });
      if (!p) throw new ConvexError({ error: "not_found" });
      baseUrl = p.baseUrl;
      if (p.apiKeyEncrypted) {
        try {
          apiKey = decryptSecret(p.apiKeyEncrypted);
        } catch {
          apiKey = null;
        }
      } else {
        apiKey = null;
      }
    } else if (args.baseUrl) {
      try {
        baseUrl = validateBaseUrl(args.baseUrl);
      } catch (err) {
        throw new ConvexError({
          error: "invalid_field",
          message: err instanceof Error ? err.message : "Base URL tidak valid.",
        });
      }
      apiKey = args.apiKey?.trim() || null;
    } else {
      throw new ConvexError({
        error: "invalid_field",
        message: "Isi base URL atau pilih profil tersimpan.",
      });
    }

    try {
      const models = await listModels({ baseUrl, apiKey });
      return { ok: true as const, models };
    } catch (err) {
      const kind = err instanceof ProviderError ? err.kind : "unknown";
      const message = err instanceof ProviderError ? err.detail : String(err);
      return {
        ok: false as const,
        error: kind,
        detail: `${friendlyProviderMessage(kind)} (${message})`,
      };
    }
  },
});
