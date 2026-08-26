# Database Quest: Mutuharjo

> **Learn Database. Solve Problems. Beat the Challenge.**

Gamified database learning platform for SMK students — turning SQL fundamentals into an adventure with worlds, battles, duels, tournaments, and a real-time leaderboard.

![Stack](https://img.shields.io/badge/React_19-blue?style=flat-square)
![Stack](https://img.shields.io/badge/TypeScript_5.9-blue?style=flat-square)
![Stack](https://img.shields.io/badge/Tailwind_v4-38bdf8?style=flat-square)
![Stack](https://img.shields.io/badge/Convex-9333ea?style=flat-square)
![Stack](https://img.shields.io/badge/Vite_7-646cff?style=flat-square)

---

## Table of Contents

- [Product Vision](#product-vision)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Setup & Development](#setup--development)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Curriculum](#curriculum)
- [Testing Report](#testing-report)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Product Vision

Database Quest: Mutuharjo is **not** a typical LMS. It's an educational programming game where students:

```
DISCOVER → LEARN → UNDERSTAND → TRY → MAKE MISTAKES
→ GET FEEDBACK → SOLVE → EARN XP → LEVEL UP
→ BATTLE → RANK UP → MASTER
```

Built for **SMK Muhammadiyah 1 Sukoharjo** students (PPLG/RPL/Software Engineering), ages 14–17.

Part of the **Database Quest** ecosystem, continuing from [Keyboard Warrior: Mutuharjo](https://keyboard.smkmuh1-skh.sch.id/).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Backend | Convex (serverless) |
| Auth | Convex Auth (Password + Anonymous) |
| Database | Convex Database (real-time) |
| Package Manager | Bun |

---

## Features

### 🌍 Learning System (Worlds & Lessons)

- **13 Worlds** covering the full SQL curriculum (Database Basics → Security)
- **25+ interactive lessons** with rich content blocks: headings, text, code, callouts, analogies, inline quizzes
- **30+ hands-on exercises** with SQL sandbox execution, instant feedback, hint system (4-level)
- **Progressive world unlocking** — complete all lessons in a world to unlock the next
- **XP system** with level progression, rank titles (Database Rookie → Grandmaster), and badge collection (25+ unique badges)

### 🧪 SQL Engine

- **Custom in-memory SQL engine** (~1000 lines) supporting:
  - SELECT (DISTINCT), FROM, WHERE, JOIN (INNER/LEFT), GROUP BY, ORDER BY, LIMIT
  - INSERT, UPDATE, DELETE
  - Aggregate functions: COUNT, SUM, AVG, MIN, MAX
  - Operators: =, !=, <>, >, <, >=, <=, AND, OR, NOT, LIKE, IN, BETWEEN, IS NULL
  - Subqueries (scalar, IN, EXISTS)
  - Column aliases with AS
- **Runs identically on client and server** — instant preview + authoritative validation
- **Dataset-aware**: exercises use either a school database or a canteen database

### 📝 CEK PEMAHAMAN (Quiz System)

- **Anti-cheat quiz** at the end of each lesson
- **3–5 randomized questions** per session from a question bank (60+ questions across all worlds)
- **Server-side validation**: answers never sent to client, option order shuffled per session
- **Violation tracking**: copy-paste, tab switching, right-click monitored; 3 violations = session void
- **20-minute time limit** per session

### ⚔️ Battle Arena (VS Bot)

- **6 difficulty tiers**: ByteBot (Beginner) → Grandmaster Bot (Nightmare)
- **Real-time timed SQL challenge** against AI bots
- **Countdown timer**, live SQL preview, instant result validation
- **Anti-farming**: reduced XP for rematching the same bot
- **Battle tier progression**: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster

### ⚡ Private Duel (1v1 PvP)

- **Real-time player vs player** SQL duels
- **4-character room code** system for quick matchmaking
- **Server-side winner determination**: both players submit, faster correct answer wins
- **ELO rating system** (K=32) for PvP ranking
- **Anti-farming XP**: diminishing returns for repeated duels with the same opponent in a day
- **Duel history** with W/L record on profile

### 🏆 Tournament (SQL Cup)

- **Bracket-style tournament** (4/8/16 players)
- **Teacher-created**: any teacher/admin can create and host tournaments
- **Automatic bracket seeding** with BYE handling
- **Round progression**: Round 1 → Semifinal → Final
- **Champion XP bonus** + badge unlock
- **Full bracket visualization** with match details

### 🐉 Weekly Boss Challenge

- **Weekly rotating boss** created by teachers
- **Difficulty levels**: Easy, Medium, Hard
- **Speed bonus**: extra XP for fast completion
- **Leaderboard** for weekly top scorers
- **Once-per-week** completion per student

### 📊 Assignment System

- **Teacher-created assignments** targeting specific classes or all students
- **Three types**: Exercise, Lesson, Challenge (teacher-made case studies)
- **Server-verified completion**: students must show real proof of work
- **Submission tracking** for teachers with per-student status

### 🎓 Teacher Dashboard

- **Class overview** with student progress, accuracy, and at-risk flags
- **Skill matrix**: per-student per-world accuracy heatmap
- **Hardest exercises**: top 5 exercises with highest failure rates
- **Class management**: create/delete classes
- **Challenge creation**: teacher-made SQL case studies
- **Password reset** for students
- **Weekly boss creation**
- **Assignment management**

### 👤 Student Profile

- **Avatar upload** (JPG/PNG/WebP/GIF, max 2MB) with Convex storage
- **20 emoji avatar options** as fallback
- **Full stats dashboard**: XP, level, rank, streak, badges, accuracy
- **Activity heatmap** (7-day view)
- **Skill progress** per world
- **Duel history** with opponent details
- **Battle tier** and W/L/D record

### 🌙 Dark Mode Toggle

- **System preference detection** with manual toggle
- **Persisted preference** in localStorage
- **Smooth transitions** via CSS class switching

### 🔊 Sound Effects

- **Web Audio API synthesized sounds** (no external files):
  - Correct answer ding, wrong answer buzz
  - Level up fanfare, XP gain pop
  - Battle win/lose jingles
  - Quiz passed celebration
  - Badge earned chime
  - Duel challenge alert
  - Button click taps

### 🎨 Landing Page

- **Animated hero section** with Framer Motion
- **Feature showcase**: Learn, Playground, Arena, Teacher sections
- **World preview** grid
- **Social proof** and call-to-action
- **Responsive design** with mobile-first approach

### 🔐 Authentication

- **Password-based registration** (no email OTP required)
- **Login via username OR email** (flexible identifier)
- **Class selection from database** (managed by teachers/admins)
- **Role-based access**: Student, Teacher, Admin
- **Onboarding flow** for new students: avatar selection + SQL tutorial

### 📱 Responsive App Shell

- **Collapsible sidebar** (hidden by default, toggle via menu button)
- **Quick-access tabs** in topbar for fast navigation
- **Streak indicator** in topbar
- **Theme toggle** in both sidebar and topbar
- **Footer** with branding on all pages

---

## Architecture

```
Frontend (React + Vite)
├── Pages (13 routes)
├── Components (AppShell, SqlPlayground, DuelArena, TournamentArena, etc.)
├── Curriculum (Worlds, Lessons, Exercises)
├── SQL Engine (runs on both client and server)
└── Sound Effects (Web Audio API)

Backend (Convex)
├── Auth (Password + Anonymous)
├── Game Logic (XP, levels, ranks, badges, streaks)
├── Battle System (Bot matches, duels, tournaments)
├── Quiz System (Anti-cheat, server-side validation)
├── Assignments (Teacher-student task management)
├── Challenges (Teacher-made SQL case studies)
├── Weekly Boss (Rotating challenges)
├── Profile & Avatar Management
├── Class Management
└── Leaderboard (XP, Ranked, per-class, per-semester)
```

---

## Setup & Development

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Convex](https://convex.dev/) account (backend)

### Installation

```bash
bun install
```

### Development

```bash
# Start Convex dev server
bun convex dev

# Start Vite dev server (in a separate terminal)
bun dev
```

### Build

```bash
bun run build
```

### Type Checking

```bash
# Frontend type check
bun tsc -b --noEmit

# Full check with Convex codegen
bun convex dev --once && bun tsc -b --noEmit
```

---

## Environment Variables

### Client-side (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Convex deployment URL |
| `VITE_CONVEX_SITE_URL` | Convex site URL for auth |

### Server-side (Convex)

| Variable | Description |
|----------|-------------|
| `JWKS` | JSON Web Key Set for auth |
| `JWT_PRIVATE_KEY` | JWT signing key |
| `SITE_URL` | Application URL for auth callbacks |

> **Note**: Do not edit `.env` files directly. Manage secrets through the Keys/API keys UI.

---

## Project Structure

```
src/
├── components/
│   ├── AppFooter.tsx          # Public page footer
│   ├── AppShell.tsx           # Authenticated app shell (sidebar + topbar)
│   ├── AvatarUpload.tsx       # Avatar upload with Convex storage
│   ├── DuelArena.tsx          # 1v1 duel UI
│   ├── LogoDropdown.tsx       # Logo with dropdown
│   ├── RequireAuth.tsx        # Auth guard wrapper
│   ├── SqlPlayground.tsx      # SQL editor + preview
│   ├── TournamentArena.tsx    # Tournament bracket UI
│   ├── WeeklyBossArena.tsx    # Weekly boss challenge UI
│   ├── teacher/
│   │   ├── AssignmentsPanel.tsx
│   │   ├── ChallengesPanel.tsx
│   │   ├── ClassesPanel.tsx
│   │   ├── PasswordResetPanel.tsx
│   │   └── WeeklyBossPanel.tsx
│   └── ui/                    # shadcn/ui components (30+)
├── convex/
│   ├── admin.ts               # Admin functions (password reset, setup)
│   ├── assignments.ts         # Assignment CRUD + verification
│   ├── auth.ts                # Auth configuration (DO NOT MODIFY)
│   ├── auth.config.ts         # Auth config (DO NOT MODIFY)
│   ├── battle.ts              # Duel + Tournament logic
│   ├── challenges.ts          # Teacher-made case studies
│   ├── classes.ts             # Class management
│   ├── game.ts                # Exercise submission, leaderboard, dashboard
│   ├── gameState.ts           # XP, stats, streak management
│   ├── http.ts                # HTTP endpoints
│   ├── profile.ts             # Profile, avatar, username management
│   ├── quiz.ts                # Quiz session + anti-cheat
│   ├── schema.ts              # Database schema
│   ├── setup.ts               # Initial setup
│   ├── users.ts               # User queries
│   └── weeklyBoss.ts          # Weekly boss challenge
├── hooks/
│   ├── use-auth.ts            # Auth hook
│   ├── use-mobile.ts          # Mobile detection
│   └── use-theme.ts           # Dark mode toggle
├── lib/
│   ├── curriculum.ts          # Worlds, lessons, exercises
│   ├── data/datasets.ts       # School & canteen databases
│   ├── game.ts                # Levels, ranks, badges, bots, tiers
│   ├── quizBank.ts            # Quiz question bank (SERVER ONLY)
│   ├── sounds.ts              # Web Audio sound effects
│   ├── sql/engine.ts          # Custom SQL engine (~1000 lines)
│   ├── utils.ts               # Utility functions
│   └── vly-integrations.ts    # Platform integrations
├── pages/
│   ├── AdminPage.tsx          # Admin console
│   ├── AssignmentsPage.tsx    # Student assignments
│   ├── Auth.tsx               # Login / Register
│   ├── BattlePage.tsx         # Bot battles + arenas
│   ├── Dashboard.tsx          # Main dashboard
│   ├── Landing.tsx            # Public landing page
│   ├── Leaderboard.tsx        # Rankings (XP, class, ranked)
│   ├── Learn.tsx              # World map
│   ├── LessonPage.tsx         # Lesson content + exercises + quizzes
│   ├── NotFound.tsx           # 404 page
│   ├── Onboarding.tsx         # First-time user onboarding
│   ├── ProfilePage.tsx        # Student profile
│   └── TeacherPage.tsx        # Teacher dashboard
├── index.css                  # Design tokens + Tailwind config
├── main.tsx                   # App entrypoint + routing
└── vite-env.d.ts              # Vite type declarations
```

---

## Curriculum

### Worlds Overview

| # | World | Title | Topics | Status |
|---|-------|-------|--------|--------|
| 1 | 🌍 Database Basics | Database Is Everywhere | Data, DBMS, MySQL intro | ✅ Complete |
| 2 | 🧱 Table Builder | CREATE DATABASE & TABLE | DDL, data types | ✅ Complete |
| 3 | 🚀 SELECT Adventure | Query Pertama | SELECT *, column selection | ✅ Complete |
| 4 | 🕵️ Data Detective | WHERE & Friends | WHERE, LIKE, IN, BETWEEN | ✅ Complete |
| 5 | 📊 Sort Master | ORDER BY & LIMIT | Sorting, DISTINCT, LIMIT | ✅ Complete |
| 6 | ✏️ CRUD Workshop | INSERT, UPDATE, DELETE | DML operations | ✅ Complete |
| 7 | 🔗 Relationship | Foreign Keys | Entity relationships | ✅ Complete |
| 8 | 🔗 JOIN Arena | INNER & LEFT JOIN | Table joins | ✅ Complete |
| 9 | 📈 Aggregation | GROUP BY & HAVING | Aggregate functions | ✅ Complete |
| 10 | 🏰 Subquery Dungeon | Scalar & IN subqueries | Advanced queries | ✅ Complete |
| 11 | 🏛️ Database Architect | Schema Design | Design patterns | ✅ Complete |
| 12 | 🔬 Normalization Lab | 1NF, 2NF, 3NF | Normalization | ✅ Complete |
| 13 | ⚡ Performance Lab | Index & Optimization | Query performance | ✅ Complete |
| 14 | 💰 Transaction | ACID & Transactions | Data integrity | ✅ Complete |
| 15 | 🔒 Security | SQL Injection & Access | Database security | ✅ Complete |
| 16+ | 🚀 Coming Soon | Advanced Topics | Stored procedures, views, etc. | 🔜 Planned |

### Exercise Stats

- **30+ hands-on exercises** across 13 worlds
- **60+ quiz questions** in the question bank
- **2 datasets**: School database (students, classes, teachers, scores) and Canteen database (products, transactions, categories)
- **4 difficulty levels**: Easy, Normal, Hard, Boss
- **Progressive XP**: 50–200 XP per exercise based on difficulty

---

## Testing Report

### Automated Checks

| Check | Status |
|-------|--------|
| TypeScript Compilation (`tsc -b --noEmit`) | ✅ Pass |
| Convex Codegen (`convex dev --once`) | ✅ Pass |
| All 121 source files | ✅ No type errors |

### Feature Verification

| Feature | Status | Notes |
|---------|--------|-------|
| **Landing Page** | ✅ | Animated hero, features, world preview, CTA |
| **Authentication** | ✅ | Password login (username/email), registration, no OTP |
| **Class Selection** | ✅ | Dynamic from database, managed by teachers |
| **Onboarding** | ✅ | Avatar selection, SQL tutorial, 4-step flow |
| **World Map** | ✅ | 13 worlds, progressive unlocking, status indicators |
| **Lesson Content** | ✅ | Rich content blocks, code, callouts, analogies |
| **SQL Playground** | ✅ | Live editor, instant preview, submit for validation |
| **Hint System** | ✅ | 4-level progressive hints with XP penalty |
| **CEK PEMAHAMAN Quiz** | ✅ | Anti-cheat, randomized 3-5 questions, server validation |
| **Exercise Submission** | ✅ | Server-side SQL validation, XP/badge rewards |
| **Lesson Completion** | ✅ | Requires quiz pass, world progress tracking |
| **Bot Battle** | ✅ | 6 bots, countdown, timed challenge, XP rewards |
| **Private Duel 1v1** | ✅ | Room code, real-time, ELO rating, anti-farm |
| **Tournament** | ✅ | Bracket (4/8/16), BYE handling, champion badge |
| **Weekly Boss** | ✅ | Teacher-created, difficulty levels, speed bonus |
| **Assignments** | ✅ | Teacher creates, server-verified completion |
| **Challenges** | ✅ | Teacher-made SQL case studies |
| **Leaderboard** | ✅ | Global XP, per-class, ranked (ELO), semester filter |
| **Student Profile** | ✅ | Avatar upload, stats, badges, duel history |
| **Dark Mode** | ✅ | Toggle with persistence, system preference detection |
| **Sound Effects** | ✅ | 9 synthesized sounds via Web Audio API |
| **Dashboard** | ✅ | Greeting, quick actions, stats, skill matrix, activity |
| **Teacher Dashboard** | ✅ | Student overview, risk flags, skill matrix, insights |
| **Admin Console** | ✅ | Class seed, student management, password reset |
| **App Shell** | ✅ | Collapsible sidebar, quick tabs, streak, theme toggle |
| **Footer** | ✅ | "Made With Love By MrStepen" branding on all pages |
| **Responsive Design** | ✅ | Mobile-first, all pages responsive |
| **Lazy Loading** | ✅ | All route components lazy-loaded |
| **Error Boundary** | ✅ | Root error boundary prevents blank pages |

### Security Checks

| Check | Status | Notes |
|-------|--------|-------|
| Quiz answers server-only | ✅ | `quizBank.ts` only imported by convex functions |
| SQL validation server-side | ✅ | All submissions validated in Convex mutations |
| Anti-cheat quiz system | ✅ | Violation tracking, 3-strike void |
| Anti-farming XP | ✅ | Diminishing returns for repeated bot/duel farming |
| Role-based access | ✅ | Teacher/Admin-only functions protected |
| Username uniqueness | ✅ | Server-side check during registration |
| Class selection from DB | ✅ | No hardcoded classes in auth |

### Convex Backend

| Table | Records | Indexes | Status |
|-------|---------|---------|--------|
| `users` | — | email, username | ✅ |
| `classes` | — | by_name | ✅ |
| `studentStats` | — | by_user, by_xp | ✅ |
| `lessonProgress` | — | by_user_lesson, by_user | ✅ |
| `exerciseAttempts` | — | by_user_exercise, by_user | ✅ |
| `battleLogs` | — | by_user | ✅ |
| `duels` | — | by_code, by_status, by_host, by_guest | ✅ |
| `tournaments` | — | — | ✅ |
| `assignments` | — | by_class, by_teacher | ✅ |
| `assignmentSubmissions` | — | by_assignment, by_assignment_user | ✅ |
| `customChallenges` | — | by_teacher | ✅ |
| `challengeSubmissions` | — | by_challenge_user, by_user | ✅ |
| `quizSessions` | — | by_user, by_user_lesson | ✅ |
| `weeklyBoss` | — | by_week | ✅ |
| `weeklyBossSubmissions` | — | by_week_user, by_user | ✅ |

---

## Known Limitations

1. **Subquery Support**: The SQL engine supports uncorrelated subqueries only (scalar, IN, EXISTS). Correlated subqueries are not yet supported.
2. **No Stored Procedures/Views**: The in-memory SQL engine doesn't support MySQL-specific features like stored procedures, views, or triggers.
3. **Single-player First**: Real-time multiplayer (duels) works via Convex reactive queries, but tournament matches are sequential (players take turns submitting).
4. **No Mobile App**: Web-only, but fully responsive.
5. **Limited Curriculum Data**: Worlds 7, 14, 15 have lessons but fewer exercises. Worlds 16+ are marked as "coming soon".

---

## Credits

**Made With ♥ By MrStepen ( Joko Endriyanto )**

© 2026 Database Quest: Mutuharjo

---

## License

This project is built for **SMK Muhammadiyah 1 Sukoharjo** educational use.
