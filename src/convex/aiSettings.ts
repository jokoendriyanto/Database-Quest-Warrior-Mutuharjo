/**
 * Pengaturan Model AI — backend untuk guru (PRD section 9).
 *
 * Runtime default: query/mutation di sini. Enkripsi API key & fetch ke
 * provider terjadi di aiSettingsActions.ts ("use node"), yang memanggil
 * internal mutation di file ini.
 *
 * Keamanan (9.4):
 * - apiKeyEncrypted TIDAK PERNAH dikirim ke client; list hanya mengembalikan
 *   apiKeyLast4.
 * - Semua endpoint guru-dibatasi; siswa -> error "Hanya guru/admin".
 * - Satu profil aktif ditegakkan transactionally di `activate`.
 */
import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Helper: assert caller is teacher or admin (pola repo yang sudah ada). */
async function requireTeacher(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const me = await ctx.db.get(userId);
  if (!me || (me.role !== "teacher" && me.role !== "admin")) {
    throw new Error("Hanya guru/admin yang bisa mengakses fitur ini.");
  }
  return userId;
}

/** Tulis baris audit (9.7). Detail TIDAK boleh memuat API key. */
async function logAudit(
  ctx: MutationCtx,
  teacherId: Id<"users">,
  action: string,
  profileId: Id<"aiProviderProfiles"> | undefined,
  detail: string,
) {
  await ctx.db.insert("aiSettingsAudit", {
    teacherId,
    action,
    profileId,
    detail: detail.slice(0, 1000),
    createdAt: Date.now(),
  });
}

/* ------------------------- internal (dipakai action) --------------------- */

/**
 * Konfigurasi profil aktif untuk AI Mentor — termasuk apiKeyEncrypted.
 * Hanya dipanggil server-side (internal); jangan pernah diteruskan ke client.
 */
export const activeProfileConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("aiProviderProfiles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

/** Role user untuk guard di action Node (server-only). */
export const roleOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.db.get(userId);
    return me?.role ?? null;
  },
});

/** Baca satu profil (untuk tes koneksi profil tersimpan). Server-only. */
export const profileSecrets = internalQuery({
  args: { id: v.id("aiProviderProfiles") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Insert profil dari action (sudah terenkripsi di sisi action). */
export const insertProfile = internalMutation({
  args: {
    teacherId: v.id("users"),
    name: v.string(),
    baseUrl: v.string(),
    apiKeyEncrypted: v.optional(v.string()),
    apiKeyLast4: v.optional(v.string()),
    model: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    timeoutSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const { teacherId, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("aiProviderProfiles", {
      ...rest,
      createdBy: teacherId,
      isActive: false, // profil baru TIDAK otomatis aktif (9.3)
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(
      ctx,
      args.teacherId,
      "create",
      id,
      `Profil "${args.name}" dibuat (base: ${args.baseUrl}, model: ${args.model})`,
    );
    return id;
  },
});

/** Update profil dari action. Field opsional = tidak diubah. */
export const updateProfile = internalMutation({
  args: {
    id: v.id("aiProviderProfiles"),
    name: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    apiKeyEncrypted: v.optional(v.string()),
    apiKeyLast4: v.optional(v.string()),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    timeoutSeconds: v.optional(v.number()),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id, teacherId, ...patch } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Profil tidak ditemukan.");

    const changes: string[] = [];
    if (patch.name !== undefined && patch.name !== existing.name) changes.push("nama");
    if (patch.baseUrl !== undefined && patch.baseUrl !== existing.baseUrl) changes.push("base URL");
    if (patch.model !== undefined && patch.model !== existing.model) changes.push("model");
    if (patch.temperature !== undefined && patch.temperature !== existing.temperature) changes.push("temperature");
    if (patch.maxTokens !== undefined && patch.maxTokens !== existing.maxTokens) changes.push("max tokens");
    if (patch.timeoutSeconds !== undefined && patch.timeoutSeconds !== existing.timeoutSeconds) changes.push("timeout");
    if (patch.apiKeyEncrypted !== undefined) changes.push("API key");

    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
    await logAudit(
      ctx,
      teacherId,
      "update",
      id,
      `Profil "${existing.name}" diperbarui: ${changes.join(", ") || "tidak ada perubahan field"}`,
    );
    return id;
  },
});

/** Catat hasil tes koneksi dari action. */
export const auditTest = internalMutation({
  args: {
    teacherId: v.id("users"),
    profileId: v.optional(v.id("aiProviderProfiles")),
    ok: v.boolean(),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    await logAudit(
      ctx,
      args.teacherId,
      args.ok ? "test_ok" : "test_fail",
      args.profileId,
      args.detail,
    );
  },
});

/* --------------------------- query/mutation guru ------------------------- */

/** GET daftar profil (masked) + active_profile_id (9.8). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireTeacher(ctx);
    const rows = await ctx.db.query("aiProviderProfiles").order("desc").collect();
    const active = rows.find((p) => p.isActive);
    return {
      profiles: rows.map((p) => ({
        id: p._id,
        name: p.name,
        base_url: p.baseUrl,
        api_key_last4: p.apiKeyLast4 ?? null,
        has_api_key: p.apiKeyEncrypted !== undefined,
        model: p.model,
        temperature: p.temperature,
        max_tokens: p.maxTokens,
        timeout_seconds: p.timeoutSeconds,
        is_active: p.isActive,
        updated_at: p.updatedAt,
      })),
      active_profile_id: active?._id ?? null,
    };
  },
});

/**
 * POST aktivasi profil (9.3/9.6): tepat satu profil aktif.
 * Transactional — mengaktifkan B menonaktifkan A dalam satu mutasi.
 */
export const activate = mutation({
  args: { id: v.id("aiProviderProfiles") },
  handler: async (ctx, { id }) => {
    const teacherId = await requireTeacher(ctx);
    const target = await ctx.db.get(id);
    if (!target) throw new Error("Profil tidak ditemukan.");

    const all = await ctx.db.query("aiProviderProfiles").collect();
    for (const p of all) {
      if (p.isActive && p._id !== id) {
        await ctx.db.patch(p._id, { isActive: false, updatedAt: Date.now() });
      }
    }
    if (!target.isActive) {
      await ctx.db.patch(id, { isActive: true, updatedAt: Date.now() });
    }
    await logAudit(
      ctx,
      teacherId,
      "activate",
      id,
      `Profil "${target.name}" (${target.model}) diaktifkan`,
    );
    return { ok: true };
  },
});

/** DELETE profil (9.8): tolak jika sedang aktif (400 profile_active). */
export const remove = mutation({
  args: { id: v.id("aiProviderProfiles") },
  handler: async (ctx, { id }) => {
    const teacherId = await requireTeacher(ctx);
    const target = await ctx.db.get(id);
    if (!target) {
      throw new ConvexError({ error: "not_found", message: "Profil tidak ditemukan." });
    }
    if (target.isActive) {
      // ConvexError supaya pesannya sampai ke UI guru (9.10 butuh pesan jelas)
      throw new ConvexError({
        error: "profile_active",
        message: "Profil ini sedang aktif. Nonaktifkan atau ganti dulu dengan profil lain.",
      });
    }
    await logAudit(
      ctx,
      teacherId,
      "delete",
      id,
      `Profil "${target.name}" (${target.model}) dihapus`,
    );
    await ctx.db.delete(id);
    return { ok: true };
  },
});

/** Riwayat audit untuk guru (transparansi konfigurasi). */
export const auditLog = query({
  args: {},
  handler: async (ctx) => {
    await requireTeacher(ctx);
    const rows = await ctx.db.query("aiSettingsAudit").order("desc").take(50);
    return rows.map((r) => ({
      action: r.action,
      profileId: r.profileId,
      detail: r.detail,
      at: r.createdAt,
    }));
  },
});
