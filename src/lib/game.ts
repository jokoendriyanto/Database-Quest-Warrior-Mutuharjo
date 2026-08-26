/**
 * Game core untuk Database Quest Warrior: Mutuharjo
 * XP, level, rank, badge, dan bot battle — dihitung di sini dan dipakai
 * bareng oleh client (untuk display) dan server (sebagai sumber kebenaran).
 */

/* ------------------------------- Levels ------------------------------- */

/** XP tambahan yang dibutuhkan untuk naik dari level L ke L+1. */
export function xpToNextLevel(level: number): number {
  return 200 + (level - 1) * 120;
}

/** Total XP kumulatif yang dibutuhkan agar berada tepat di level L. */
export function totalXpForLevel(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += xpToNextLevel(l);
  return sum;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= totalXpForLevel(level + 1) && level < 99) level++;
  return level;
}

export function levelProgress(xp: number): { level: number; current: number; needed: number } {
  const level = levelFromXp(xp);
  const base = totalXpForLevel(level);
  return { level, current: xp - base, needed: xpToNextLevel(level) };
}

/* -------------------------------- Ranks -------------------------------- */

export interface RankDef {
  name: string;
  minLevel: number;
  emoji: string;
}

/** Semakin tinggi level, semakin tinggi rank — bukan cuma soal XP mentah. */
export const RANKS: RankDef[] = [
  { name: "Database Rookie", minLevel: 1, emoji: "🥚" },
  { name: "Data Cadet", minLevel: 2, emoji: "🐣" },
  { name: "Table Tactician", minLevel: 4, emoji: "📋" },
  { name: "Query Hunter", minLevel: 6, emoji: "🎯" },
  { name: "SQL Warrior", minLevel: 9, emoji: "⚔️" },
  { name: "Join Master", minLevel: 13, emoji: "🔗" },
  { name: "Schema Architect", minLevel: 17, emoji: "🏛️" },
  { name: "Database Guardian", minLevel: 22, emoji: "🛡️" },
  { name: "Database Grandmaster", minLevel: 28, emoji: "👑" },
];

export function rankFromLevel(level: number): RankDef {
  let current = RANKS[0];
  for (const r of RANKS) if (level >= r.minLevel) current = r;
  return current;
}

/* ------------------------------- Badges ------------------------------- */

export interface BadgeDef {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export const BADGES: BadgeDef[] = [
  // === Learning ===
  { id: "first_query", label: "First Query", icon: "🚀", desc: "Jalankan query SQL pertamamu." },
  { id: "no_hint", label: "Pure Skill", icon: "🧠", desc: "Selesaikan challenge tanpa hint sama sekali." },
  { id: "first_lesson", label: "First Step", icon: "👣", desc: "Tamatkan pelajaran pertamamu." },
  { id: "lesson_5", label: "Knowledge Seeker", icon: "📚", desc: "Tamatkan 5 pelajaran." },
  { id: "lesson_15", label: "Scholar", icon: "🎓", desc: "Tamatkan 15 pelajaran." },
  { id: "exercise_10", label: "Query Grinder", icon: "⚙️", desc: "Selesaikan 10 latihan SQL." },
  { id: "exercise_25", label: "SQL Warrior", icon: "⚔️", desc: "Selesaikan 25 latihan SQL." },
  { id: "exercise_50", label: "Query Master", icon: "👑", desc: "Selesaikan 50 latihan SQL." },
  { id: "perfect_quiz", label: "Quiz Ace", icon: "💯", desc: "Lulus kuis dengan skor sempurna (semua benar)." },
  { id: "quiz_streak_5", label: "Quiz Streak", icon: "🎯", desc: "Lulus 5 kuis berturut-turut." },
  // === World ===
  { id: "world_1_complete", label: "DB Explorer", icon: "🌍", desc: "Selesaikan semua lesson di World 1." },
  { id: "world_5_complete", label: "World Traveler", icon: "🗺️", desc: "Selesaikan semua lesson di 5 world." },
  { id: "world_all_complete", label: "World Conqueror", icon: "🏆", desc: "Selesaikan semua lesson di semua world." },
  // === Battle ===
  { id: "first_battle_win", label: "Arena Rookie", icon: "🥊", desc: "Menangkan pertarungan pertamamu." },
  { id: "bot_slayer", label: "Bot Slayer", icon: "🤖", desc: "Kalahkan bot 5 kali." },
  { id: "bot_master", label: "Bot Master", icon: "👾", desc: "Kalahkan bot Nightmare." },
  { id: "duel_first_win", label: "Duel Champion", icon: "⚡", desc: "Menangkan duel 1v1 pertamamu." },
  { id: "duel_streak_3", label: "Duel Streak", icon: "🔥", desc: "Menangkan 3 duel berturut-turut." },
  { id: "tournament_champion", label: "Cup Champion", icon: "🏅", desc: "Menangkan SQL Cup (turnamen)." },
  // === Social ===
  { id: "week_warrior", label: "7 Day Warrior", icon: "🔥", desc: "Jaga streak selama 7 hari." },
  { id: "month_warrior", label: "30 Day Legend", icon: "💎", desc: "Jaga streak selama 30 hari." },
  { id: "night_owl", label: "Night Owl", icon: "🦉", desc: "Selesaikan latihan setelah jam 10 malam." },
  { id: "early_bird", label: "Early Bird", icon: "🐦", desc: "Selesaikan latihan sebelum jam 7 pagi." },
  { id: "comeback_king", label: "Comeback King", icon: "👑", desc: "Menangkan battle setelah kalah 3 kali." },
  { id: "first_assignment", label: "Task Taker", icon: "📝", desc: "Selesaikan tugas pertama dari guru." },
  { id: "social_butterfly", label: "Social Butterfly", icon: "🦋", desc: "Ikut 5 duel dengan teman berbeda." },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/* -------------------------------- Bots -------------------------------- */

export interface BotDef {
  key: string;
  name: string;
  difficulty: "Beginner" | "Easy" | "Normal" | "Hard" | "Expert" | "Nightmare";
  /** Rentang waktu penyelesaian bot dalam detik. */
  timeRange: [number, number];
  /** Probabilitas bot menjawab benar. */
  accuracy: [number, number];
  emoji: string;
  taunt: string;
  color: string;
}

export const BOTS: BotDef[] = [
  {
    key: "bytebot",
    name: "ByteBot",
    difficulty: "Beginner",
    timeRange: [45, 90],
    accuracy: [0.6, 0.75],
    emoji: "🧦",
    taunt: "Masih suka salah syntax, tapi jangan diremehin juga ya.",
    color: "#a5b4fc",
  },
  {
    key: "databot",
    name: "DataBot",
    difficulty: "Easy",
    timeRange: [35, 70],
    accuracy: [0.68, 0.82],
    emoji: "📦",
    taunt: "Data-ku rapi, query-ku lumayan.",
    color: "#86efac",
  },
  {
    key: "querybot",
    name: "QueryBot",
    difficulty: "Normal",
    timeRange: [25, 55],
    accuracy: [0.78, 0.9],
    emoji: "🔍",
    taunt: "SELECT * FROM kemenangan;",
    color: "#fcd34d",
  },
  {
    key: "joinbot",
    name: "JoinBot",
    difficulty: "Hard",
    timeRange: [20, 45],
    accuracy: [0.85, 0.94],
    emoji: "🔗",
    taunt: "Aku gabungkan semua tabel... termasuk tabel kekalahanmu.",
    color: "#fda4af",
  },
  {
    key: "schemabot",
    name: "SchemaBot",
    difficulty: "Expert",
    timeRange: [15, 35],
    accuracy: [0.9, 0.98],
    emoji: "🏛️",
    taunt: "Skema-ku normalisasi, serangan-ku juga.",
    color: "#c4b5fd",
  },
  {
    key: "grandmasterbot",
    name: "Grandmaster Bot",
    difficulty: "Nightmare",
    timeRange: [12, 30],
    accuracy: [0.95, 0.99],
    emoji: "💀",
    taunt: "Aku sudah membaca semua query yang akan kamu tulis.",
    color: "#f0abfc",
  },
];

export function botByKey(key: string): BotDef | undefined {
  return BOTS.find((b) => b.key === key);
}

/* ---------------------------- Battle tiers ---------------------------- */

export interface BattleTierDef {
  name: string;
  minWins: number;
  /** warna aksen kecil — semantik progresi, bukan dekorasi */
  color: string;
}

export const BATTLE_TIERS: BattleTierDef[] = [
  { name: "Bronze", minWins: 0, color: "#b07d4f" },
  { name: "Silver", minWins: 2, color: "#9aa3ad" },
  { name: "Gold", minWins: 5, color: "#c9971f" },
  { name: "Platinum", minWins: 10, color: "#5fa8a0" },
  { name: "Diamond", minWins: 18, color: "#6b8fd8" },
  { name: "Master", minWins: 28, color: "#a86bd8" },
  { name: "Grandmaster", minWins: 40, color: "#d8536b" },
];

export function tierFromWins(wins: number): BattleTierDef {
  let t = BATTLE_TIERS[0];
  for (const tier of BATTLE_TIERS) if (wins >= tier.minWins) t = tier;
  return t;
}

/** Skill label per world — dipakai di Skill Progress & Skill Matrix. */
export const WORLD_SKILL: Record<number, string> = {
  1: "FONDASI",
  2: "SCHEMA",
  3: "SELECT",
  4: "FILTER",
  5: "SORT",
  6: "CRUD",
  7: "RELASI",
  8: "JOIN",
  9: "AGREGASI",
};

/* ------------------------------ Avatars ------------------------------ */

export const AVATAR_OPTIONS = [
  "🦉","🐙","🦊","🐸","🐼","🦁","🐯","🐨","🦄","🐢","🐬","🦅","🐲","👾","🤖","🧑‍💻","👩‍💻","🧙","🥷","🛸",
];

export function randomBotTime(bot: BotDef): number {
  const [lo, hi] = bot.timeRange;
  return Math.round(lo + Math.random() * (hi - lo));
}

export function randomBotSuccess(bot: BotDef): boolean {
  const [lo, hi] = bot.accuracy;
  const p = lo + Math.random() * (hi - lo);
  return Math.random() < p;
}
