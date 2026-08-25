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
  },
  {
    schemaValidation: false,
  },
);

export default schema;
