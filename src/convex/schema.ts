import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  STUDENT: "student",
  TEACHER: "teacher",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.TEACHER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // Database Quest Warrior profile
      username: v.optional(v.string()), // normalized lowercase, unique
      className: v.optional(v.string()),
      avatarEmoji: v.optional(v.string()),
      onboarded: v.optional(v.boolean()),
    })
      .index("email", ["email"]) // index for the email. do not remove or modify
      .index("username", ["username"]),

    /* --------------- Kelas resmi — dikelola admin/guru ------------------- */
    classes: defineTable({
      name: v.string(),
      createdAt: v.number(),
    }).index("by_name", ["name"]),

    // Per-student gamification state. Server-side only — clients never write
    // XP/score/rating directly.
    studentStats: defineTable({
      userId: v.id("users"),
      xp: v.number(),
      coins: v.number(),
      streak: v.number(),
      longestStreak: v.number(),
      lastActiveDate: v.optional(v.string()), // YYYY-MM-DD
      lessonsCompleted: v.number(),
      exercisesDone: v.number(),
      exercisesCorrect: v.number(),
      queriesRun: v.number(),
      botWins: v.number(),
      botLosses: v.number(),
      todayDate: v.optional(v.string()),
      todayExercises: v.number(),
      todayCorrect: v.number(),
      badges: v.array(v.string()),
      // PvP rating (ELO-lite) — hasil duel & turnamen
      duelRating: v.optional(v.number()), // default 1000
      duelWins: v.optional(v.number()),
      duelLosses: v.optional(v.number()),
      duelDraws: v.optional(v.number()),
      // Shop & economy
      shopItems: v.optional(v.array(v.string())),
      // Daily quests
      dailyQuestProgress: v.optional(v.object({
        date: v.string(),
        completed: v.array(v.string()),
        progress: v.record(v.string(), v.number()),
      })),
      // Streak rewards
      streakRewardsClaimed: v.optional(v.array(v.number())),
    })
      .index("by_user", ["userId"])
      .index("by_xp", ["xp"]),

    lessonProgress: defineTable({
      userId: v.id("users"),
      lessonId: v.string(),
      status: v.string(), // "completed"
      completedAt: v.number(),
    })
      .index("by_user_lesson", ["userId", "lessonId"])
      .index("by_user", ["userId"]),

    exerciseAttempts: defineTable({
      userId: v.id("users"),
      exerciseId: v.string(),
      queryText: v.string(),
      isCorrect: v.boolean(),
      hintsUsed: v.number(),
      xpEarned: v.number(),
      at: v.number(),
    })
      .index("by_user_exercise", ["userId", "exerciseId"])
      .index("by_user", ["userId"]),

    battleLogs: defineTable({
      userId: v.id("users"),
      botKey: v.string(),
      won: v.boolean(),
      xpEarned: v.number(),
      elapsedSeconds: v.number(),
      at: v.number(),
    }).index("by_user", ["userId"]),

    /* ------------------------- Private Duel (1v1) ------------------------ */
    duels: defineTable({
      code: v.string(), // kode 4 karakter untuk join
      hostId: v.id("users"),
      guestId: v.optional(v.id("users")),
      exerciseId: v.string(), // dipilih server saat duel dibuat
      status: v.union(
        v.literal("waiting"),
        v.literal("fighting"),
        v.literal("finished"),
      ),
      hostSubmitted: v.optional(
        v.object({ correct: v.boolean(), seconds: v.number() }),
      ),
      guestSubmitted: v.optional(
        v.object({ correct: v.boolean(), seconds: v.number() }),
      ),
      winnerId: v.optional(v.id("users")),
      isDraw: v.optional(v.boolean()),
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_code", ["code"])
      .index("by_status", ["status"])
      .index("by_host", ["hostId"])
      .index("by_guest", ["guestId"]),

    /* ------------------- Tugas dari guru --------------------------------- */
    assignments: defineTable({
      teacherId: v.id("users"),
      title: v.string(),
      description: v.optional(v.string()),
      // "exercise" → refId exerciseId kurikulum; "lesson" → refId lessonId;
      // "challenge" → refId customChallenges buatan guru
      kind: v.union(
        v.literal("exercise"),
        v.literal("lesson"),
        v.literal("challenge"),
      ),
      refId: v.string(),
      className: v.string(), // "" = semua kelas
      dueAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_class", ["className"])
      .index("by_teacher", ["teacherId"]),

    assignmentSubmissions: defineTable({
      assignmentId: v.id("assignments"),
      userId: v.id("users"),
      completedAt: v.number(),
    })
      .index("by_assignment", ["assignmentId"])
      .index("by_assignment_user", ["assignmentId", "userId"]),

    /* --------------- Studi kasus / challenge buatan guru ------------------ */
    customChallenges: defineTable({
      teacherId: v.id("users"),
      title: v.string(),
      prompt: v.string(), // instruksi kasus untuk siswa
      datasetKey: v.string(), // "school" | "kantin" (divalidasi runtime)
      solutionSql: v.string(), // tidak pernah dikirim ke siswa
      xp: v.number(),
      createdAt: v.number(),
    }).index("by_teacher", ["teacherId"]),

    challengeSubmissions: defineTable({
      challengeId: v.id("customChallenges"),
      userId: v.id("users"),
      sqlText: v.string(),
      correct: v.boolean(),
      at: v.number(),
    })
      .index("by_challenge_user", ["challengeId", "userId"])
      .index("by_user", ["userId"]),

    /* --------------------------- Tournament ------------------------------ */
    tournaments: defineTable({
      name: v.string(),
      status: v.union(
        v.literal("open"),
        v.literal("running"),
        v.literal("finished"),
      ),
      hostId: v.id("users"),
      maxSize: v.number(), // 4 / 8 / 16
      players: v.array(v.id("users")),
      // bracket flat: round 1 = babak pertama, slot 0..n
      bracket: v.array(
        v.object({
          round: v.number(),
          slot: v.number(),
          playerA: v.optional(v.id("users")),
          playerB: v.optional(v.id("users")),
          exerciseId: v.optional(v.string()),
          subA: v.optional(
            v.object({ correct: v.boolean(), seconds: v.number() }),
          ),
          subB: v.optional(
            v.object({ correct: v.boolean(), seconds: v.number() }),
          ),
          winner: v.optional(v.id("users")),
        }),
      ),
      rounds: v.number(), // total babak
      champion: v.optional(v.id("users")),
      createdAt: v.number(),
    }),

    /* ------- Sesi kuis CEK PEMAHAMAN — soal acak, divalidasi server ------- */
    quizSessions: defineTable({
      userId: v.id("users"),
      lessonId: v.string(),
      questionIds: v.array(v.string()), // id soal dari quizBank (server-only)
      optionOrders: v.array(v.array(v.number())), // permutasi opsi per soal
      answers: v.array(v.number()), // index opsi TAMPILAN yang benar (tidak pernah ke client)
      status: v.union(
        v.literal("active"),
        v.literal("passed"),
        v.literal("failed"),
        v.literal("void"),
      ),
      violations: v.number(),
      createdAt: v.number(),
      expiresAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_lesson", ["userId", "lessonId"]),

    /* --------------- Weekly Boss Challenge ------------------ */
    weeklyBoss: defineTable({
      weekKey: v.string(), // "2026-W35"
      title: v.string(),
      description: v.string(),
      datasetKey: v.string(), // "school" | "kantin"
      solutionSql: v.string(), // jawaban server
      xp: v.number(),
      difficulty: v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard"),
      ),
      createdAt: v.number(),
    })
      .index("by_week", ["weekKey"]),

    weeklyBossSubmissions: defineTable({
      weekKey: v.string(),
      userId: v.id("users"),
      sqlText: v.string(),
      correct: v.boolean(),
      elapsedMs: v.number(),
      xpEarned: v.number(),
      at: v.number(),
    })
      .index("by_week_user", ["weekKey", "userId"])
      .index("by_user", ["userId"]),

    /* --------------- Classroom Mode ------------------ */
    classroomSessions: defineTable({
      teacherId: v.id("users"),
      className: v.string(),
      code: v.string(), // kode join 4 huruf
      exerciseId: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("active"),
        v.literal("finished"),
      ),
      participants: v.array(v.id("users")),
      results: v.array(
        v.object({
          userId: v.id("users"),
          correct: v.boolean(),
          elapsedMs: v.number(),
          xpEarned: v.number(),
        }),
      ),
      createdAt: v.number(),
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
    })
      .index("by_code", ["code"])
      .index("by_teacher", ["teacherId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
