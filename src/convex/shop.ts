/**
 * SHOP & DAILY QUESTS — Coin economy + daily challenges + streak milestones
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getStats, findStats } from "./gameState";

/* ======================== SHOP ITEMS ======================== */

export const SHOP_ITEMS = [
  // Avatar Packs
  { id: "avatar_ninja", label: "Ninja Avatar", icon: "🥷", category: "avatar", price: 50, desc: "Emotikon avatar ninja keren!" },
  { id: "avatar_alien", label: "Alien Avatar", icon: "👽", category: "avatar", price: 75, desc: "Emotikon avatar alien misterius." },
  { id: "avatar_robot", label: "Robot Avatar", icon: "🤖", category: "avatar", price: 100, desc: "Emotikon avatar robot masa depan." },
  { id: "avatar_wizard", label: "Wizard Avatar", icon: "🧙", category: "avatar", price: 120, desc: "Emotikon avatar penyihir SQL." },
  { id: "avatar_dragon", label: "Dragon Avatar", icon: "🐉", category: "avatar", price: 200, desc: "Emotikon avatar naga legendaris." },
  { id: "avatar_unicorn", label: "Unicorn Avatar", icon: "🦄", category: "avatar", price: 150, desc: "Emotikon avatar unicorn ajaib." },

  // Titles
  { id: "title_sql_ninja", label: "SQL Ninja", icon: "🏅", category: "title", price: 80, desc: "Judul 'SQL Ninja' untuk profil." },
  { id: "title_db_master", label: "DB Master", icon: "🏆", category: "title", price: 150, desc: "Judul 'DB Master' untuk profil." },
  { id: "title_query_king", label: "Query King", icon: "👑", category: "title", price: 200, desc: "Judul 'Query King' untuk profil." },
  { id: "title_code_warrior", label: "Code Warrior", icon: "⚔️", category: "title", price: 100, desc: "Judul 'Code Warrior' untuk profil." },

  // Boosters
  { id: "booster_2x_xp", label: "2x XP (1 sesi)", icon: "⚡", category: "booster", price: 60, desc: "XP 2x lipat untuk satu sesi belajar." },
  { id: "hint_pack_3", label: "3x Hint Token", icon: "💡", category: "booster", price: 40, desc: "Tambahan 3 token hint gratis." },
  { id: "skip_quiz", label: "Quiz Skip", icon: "⏭️", category: "booster", price: 90, desc: "Skip satu quiz tanpa penalty." },

  // Cosmetics
  { id: "frame_gold", label: "Gold Frame", icon: "🖼️", category: "cosmetic", price: 100, desc: "Bingkai emas untuk avatar profil." },
  { id: "frame_neon", label: "Neon Frame", icon: "💎", category: "cosmetic", price: 180, desc: "Bingkai neon bercahaya untuk profil." },
];

export type ShopItem = (typeof SHOP_ITEMS)[number];

/** Query: Ambil data shop + status pembelian user */
export const getShopData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { items: SHOP_ITEMS, owned: [], coins: 0 };

    // Query TIDAK BOLEH menulis ke db — pakai findStats (baca saja).
    const stats = await findStats(ctx, userId);
    const owned = stats?.shopItems ?? [];
    const coins = stats?.coins ?? 0;
    return { items: SHOP_ITEMS, owned, coins };
  },
});

/** Mutation: Beli item dari shop */
export const buyItem = mutation({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Silakan login terlebih dahulu.");

    const item = SHOP_ITEMS.find((i) => i.id === args.itemId);
    if (!item) throw new Error("Item tidak ditemukan di shop.");

    const stats = await getStats(ctx, userId);
    if (!stats) throw new Error("Profil belum lengkap. Silakan selesaikan onboarding.");

    if ((stats.shopItems ?? []).includes(args.itemId)) {
      throw new Error("Kamu sudah memiliki item ini!");
    }
    if (stats.coins < item.price) {
      throw new Error(`Koin tidak cukup! Butuh ${item.price} koin, kamu punya ${stats.coins}.`);
    }

    await ctx.db.patch(stats._id, {
      coins: stats.coins - item.price,
      shopItems: [...(stats.shopItems ?? []), args.itemId],
    });

    return { success: true, coinsLeft: stats.coins - item.price };
  },
});

/* ======================== DAILY QUESTS ======================== */

const DAILY_QUEST_TEMPLATES = [
  { id: "dq_finish_lesson", label: "Selesaikan 1 Lesson", icon: "📚", target: 1, xpReward: 25, coinReward: 5 },
  { id: "dq_finish_2_lessons", label: "Selesaikan 2 Lessons", icon: "📖", target: 2, xpReward: 50, coinReward: 10 },
  { id: "dq_exercise_3", label: "Kerjakan 3 Latihan SQL", icon: "💻", target: 3, xpReward: 30, coinReward: 6 },
  { id: "dq_exercise_5", label: "Kerjakan 5 Latihan SQL", icon: "🚀", target: 5, xpReward: 60, coinReward: 12 },
  { id: "dq_quiz_perfect", label: "Skor 100% di Quiz", icon: "🎯", target: 1, xpReward: 40, coinReward: 8 },
  { id: "dq_bot_battle_win", label: "Menang 1 Bot Battle", icon: "🤖", target: 1, xpReward: 35, coinReward: 7 },
  { id: "dq_bot_battle_3", label: "Menang 3 Bot Battle", icon: "⚔️", target: 3, xpReward: 80, coinReward: 15 },
  { id: "dq_practice_sql", label: "Coba 2 Query di Sandbox", icon: "🧪", target: 2, xpReward: 20, coinReward: 4 },
  { id: "dq_duel_win", label: "Menang 1 Private Duel", icon: "🏟️", target: 1, xpReward: 50, coinReward: 10 },
  { id: "dq_streak_maintain", label: "Pertahankan Streak Hari Ini", icon: "🔥", target: 1, xpReward: 30, coinReward: 5 },
];

/** Generate daily quest seeds berdasarkan tanggal */
function dailyQuestSeeds(dateStr: string): number[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) % 10000;
  }
  const seeds: number[] = [];
  for (let i = 0; i < 3; i++) {
    seeds.push((hash * (i + 1) * 7 + i * 13) % DAILY_QUEST_TEMPLATES.length);
  }
  // Pastikan tidak ada duplikat
  return [...new Set(seeds)];
}

function todayStr(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Query: Ambil daily quests hari ini untuk user */
export const getDailyQuests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { quests: [], date: todayStr(), progress: {} };

    const stats = await findStats(ctx, userId);
    const today = todayStr();

    // Generate 3 daily quests based on today's date
    const seeds = dailyQuestSeeds(today);
    const quests = seeds.map((idx) => DAILY_QUEST_TEMPLATES[idx]);

    // Load progress
    const progress = stats?.dailyQuestProgress?.date === today
      ? stats.dailyQuestProgress
      : { date: today, completed: [], progress: {} };

    return { quests, date: today, progress };
  },
});

/** Mutation: Update progress harian (dipanggil otomatis dari various actions) */
export const updateDailyQuestProgress = mutation({
  args: {
    questId: v.string(),
    increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const stats = await getStats(ctx, userId);
    if (!stats) return;

    const today = todayStr();
    let dqp = stats.dailyQuestProgress;

    // Reset jika tanggal beda
    if (!dqp || dqp.date !== today) {
      dqp = { date: today, completed: [], progress: {} };
    }

    if (dqp.completed.includes(args.questId)) return; // sudah selesai

    const current = dqp.progress[args.questId] ?? 0;
    const inc = args.increment ?? 1;
    const newVal = current + inc;

    // Cari target dari quest template
    const template = DAILY_QUEST_TEMPLATES.find((t) => t.id === args.questId);
    if (!template) return;

    dqp.progress[args.questId] = newVal;

    if (newVal >= template.target && !dqp.completed.includes(args.questId)) {
      dqp.completed.push(args.questId);

      // Award rewards
      await ctx.db.patch(stats._id, {
        dailyQuestProgress: dqp,
        xp: stats.xp + template.xpReward,
        coins: stats.coins + template.coinReward,
      });
    } else {
      await ctx.db.patch(stats._id, { dailyQuestProgress: dqp });
    }
  },
});

/* ======================== STREAK REWARDS ======================== */

const STREAK_MILESTONES = [
  { days: 3, xpReward: 50, coinReward: 10, badge: "streak_3", label: "3 Hari Berturut" },
  { days: 7, xpReward: 150, coinReward: 30, badge: "streak_7", label: "7 Hari Berturut" },
  { days: 14, xpReward: 300, coinReward: 60, badge: "streak_14", label: "14 Hari Berturut" },
  { days: 30, xpReward: 500, coinReward: 100, badge: "streak_30", label: "30 Hari Berturut" },
  { days: 60, xpReward: 1000, coinReward: 200, badge: "streak_60", label: "60 Hari Berturut" },
  { days: 90, xpReward: 2000, coinReward: 500, badge: "streak_90", label: "90 Hari Legend" },
];

/** Query: Cek milestone streak yang sudah dicapai */
export const getStreakRewards = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { milestones: STREAK_MILESTONES, claimed: [], currentStreak: 0 };

    const stats = await findStats(ctx, userId);
    const streak = stats?.streak ?? 0;
    const claimed = stats?.streakRewardsClaimed ?? [];

    return { milestones: STREAK_MILESTONES, claimed, currentStreak: streak };
  },
});

/** Mutation: Klaim streak reward */
export const claimStreakReward = mutation({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Silakan login terlebih dahulu.");

    const stats = await getStats(ctx, userId);
    if (!stats) throw new Error("Profil belum lengkap.");

    const milestone = STREAK_MILESTONES.find((m) => m.days === args.days);
    if (!milestone) throw new Error("Milestone tidak valid.");

    if (stats.streak < milestone.days) {
      throw new Error(`Streak kamu masih ${stats.streak} hari, butuh ${milestone.days} hari.`);
    }

    if ((stats.streakRewardsClaimed ?? []).includes(args.days)) {
      throw new Error("Reward ini sudah diklaim!");
    }

    await ctx.db.patch(stats._id, {
      xp: stats.xp + milestone.xpReward,
      coins: stats.coins + milestone.coinReward,
      streakRewardsClaimed: [...(stats.streakRewardsClaimed ?? []), args.days],
      badges: stats.badges.includes(milestone.badge)
        ? stats.badges
        : [...stats.badges, milestone.badge],
    });

    return { success: true };
  },
});
