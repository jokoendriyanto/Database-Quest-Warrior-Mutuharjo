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
- [Quick Start (Local Development)](#quick-start-local-development)
- [Deployment Guide](#deployment-guide)
  - [Step 1: Setup Convex Project](#step-1-setup-convex-project)
  - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
  - [Step 3: Deploy to Vercel](#step-3-deploy-to-vercel)
  - [Step 4: Deploy to Netlify](#step-4-deploy-to-netlify)
  - [Step 5: Custom Domain Setup](#step-5-custom-domain-setup)
  - [Step 6: Post-Deployment Checklist](#step-6-post-deployment-checklist)
- [Environment Variables Reference](#environment-variables-reference)
- [Project Structure](#project-structure)
- [Curriculum](#curriculum)
- [Lottie Animations](#lottie-animations)
- [Testing Report](#testing-report)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [Credits](#credits)
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
| Animations | Framer Motion, Lottie (lottie-react) |
| Backend | Convex (serverless) |
| Auth | Convex Auth (Password + Anonymous) |
| Database | Convex Database (real-time) |
| Package Manager | Bun |

---

## Features

### 🌍 Learning System (Worlds & Lessons)

- **15 Worlds** covering the full SQL curriculum (Database Basics → Security)
- **38+ interactive lessons** with rich content blocks: headings, text, code, callouts, analogies, inline quizzes
- **30+ hands-on exercises** with SQL sandbox execution, instant feedback, hint system (4-level)
- **Progressive world unlocking** — complete all lessons in a world to unlock the next
- **XP system** with level progression, rank titles (Database Rookie → Grandmaster), and badge collection (25+ unique badges)

### 🧪 SQL Engine

- **Custom in-memory SQL engine** (~1200 lines) supporting:
  - SELECT (DISTINCT), FROM, WHERE, JOIN (INNER/LEFT/RIGHT), GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET
  - UNION / UNION ALL
  - INSERT, UPDATE, DELETE
  - Aggregate functions: COUNT, SUM, AVG, MIN, MAX
  - Operators: =, !=, <>, >, <, >=, <=, AND, OR, NOT, LIKE, IN, BETWEEN, IS NULL
  - Subqueries (scalar, IN, EXISTS)
  - Column aliases with AS
- **Runs identically on client and server** — instant preview + authoritative validation
- **Dataset-aware**: exercises use either a school database or a canteen database

### 📝 CEK PEMAHAMAN (Quiz System)

- **Anti-cheat quiz** at the end of each lesson
- **3–5 randomized questions** per session from a 227-question bank
- **4–6 options** per question (expanded from previous 4)
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

### 🏆 Tournament (SQL Cup)

- **Bracket-style tournament** (4/8/16 players)
- **Teacher-created**: any teacher/admin can create and host tournaments
- **Automatic bracket seeding** with BYE handling
- **Champion XP bonus** + badge unlock

### 🐉 Weekly Boss Challenge

- **Weekly rotating boss** created by teachers
- **Difficulty levels**: Easy, Medium, Hard
- **Speed bonus**: extra XP for fast completion

### 📊 Assignment System

- **Teacher-created assignments** targeting specific classes or all students
- **Three types**: Exercise, Lesson, Challenge (teacher-made case studies)
- **Server-verified completion**: students must show real proof of work

### 🎓 Teacher Dashboard

- **Class overview** with student progress, accuracy, and at-risk flags
- **Skill matrix**: per-student per-world accuracy heatmap
- **Student editing**: edit individual or mass-edit student data including class assignment
- **CSV export** for student data
- **Password reset** for students
- **Weekly boss creation** and assignment management

### 🎮 Gamification Economy

- **Coin Shop** (`/shop`): 15 items including avatar packs, titles, boosters, cosmetics
- **Daily Quests**: 3 random quests per day from 10 templates
- **Streak Rewards**: 6 milestone rewards (3, 7, 14, 30, 60, 90 days)

### 🎨 Micro-Animations (Lottie)

- **25+ unique Lottie animations** across the entire platform
- **Framer Motion entrance/exit** animations on all interactive elements
- Animations in: Hero, Quiz, Battle, Profile, Shop, Auth, Loading states, Navigation

### 🌙 Dark Mode + Sound Effects

- System preference detection with manual toggle
- 9 synthesized sounds via Web Audio API (no external files)

### 📱 Mobile Responsive

- Collapsible sidebar with bottom navigation bar on mobile
- Touch-friendly 44px tap targets
- All pages fully responsive

---

## Architecture

```
Frontend (React + Vite)
├── Pages (14 routes)
├── Components (AppShell, SqlPlayground, DuelArena, TournamentArena, etc.)
├── Curriculum (15 Worlds, 38+ Lessons, 30+ Exercises)
├── SQL Engine (runs on both client and server)
├── Lottie Animations (25+ JSON assets)
└── Sound Effects (Web Audio API)

Backend (Convex)
├── Auth (Password + Anonymous)
├── Game Logic (XP, levels, ranks, badges, streaks, coins)
├── Battle System (Bot matches, duels, tournaments)
├── Quiz System (Anti-cheat, server-side validation, 227-question bank)
├── Assignments (Teacher-student task management)
├── Challenges (Teacher-made SQL case studies)
├── Weekly Boss (Rotating challenges)
├── Coin Shop & Daily Quests
├── Profile & Avatar Management
├── Class Management
└── Leaderboard (XP, Ranked, per-class, per-semester)
```

---

## Quick Start (Local Development)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Bun](https://bun.sh/) | ≥ 1.0 | `curl -fsSL https://bun.sh/install \| bash` |
| [Node.js](https://nodejs.org/) | ≥ 18 | [Download](https://nodejs.org/) |
| [Convex Account](https://convex.dev/) | Free tier works | [Sign up](https://convex.dev/) |

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/database-quest-mutuharjo.git
cd database-quest-mutuharjo

# Install dependencies
bun install
```

### 2. Setup Convex Backend

```bash
# Login to Convex (opens browser for authentication)
bun convex login

# Initialize Convex project (if starting fresh)
bun convex init

# Push schema and deploy functions
bun convex dev
```

This will:
- Create a Convex project linked to your account
- Deploy all backend functions from `src/convex/`
- Generate TypeScript types in `src/convex/_generated/`
- Create a `.env.local` file if needed (frontend no longer requires it)

> **Note:** Keep `bun convex dev` running — it watches for changes and auto-deploys.

### 3. Start Development

In a **second terminal**:

```bash
# Start Vite dev server
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Verify Everything Works

```bash
# Type check (should pass with 0 errors)
bun tsc -b --noEmit

# Full check with Convex codegen
bun convex dev --once && bun tsc -b --noEmit
```

---

## Deployment Guide

### Overview

This project deploys as **two separate services**:

| Service | What | Where |
|---------|------|-------|
| **Frontend** | React SPA (Vite build) | Vercel, Netlify, Cloudflare Pages, or any static host |
| **Backend** | Convex functions + database | Convex Cloud (managed automatically) |

The frontend connects to Convex via a **pinned URL constant** in `src/lib/convex-url.ts`. **There is no separate backend server to deploy** — Convex handles everything.

> ⚠️ **Penting:** Aplikasi ini TIDAK membaca `VITE_CONVEX_URL` lagi. URL deployment Convex di-pin langsung di `src/lib/convex-url.ts`. Untuk ganti deployment (misalnya mulai tahun ajaran baru), cukup ubah konstanta `CONVEX_URL` di file itu, lalu build ulang.

---

### Step 1: Setup Convex Project

#### 1.1 Create Convex Account

1. Go to [https://convex.dev](https://convex.dev)
2. Sign up with GitHub, Google, or email
3. Free tier includes:
   - 10,000 database reads/day
   - 1,000 database writes/day
   - 1,000 function calls/day
   - 1GB storage
   - Perfect for development and small-scale production

#### 1.2 Initialize Convex

```bash
# Login (opens browser)
bun convex login

# Initialize project
bun convex init

# This creates a new Convex project and links it to your account
# Copy the deployment URL into src/lib/convex-url.ts afterwards
```

#### 1.3 Deploy Schema & Functions

```bash
# Deploy all Convex functions
bun convex dev

# Or deploy once (for CI/CD)
bun convex dev --once
```

This deploys:
- **19 backend modules** from `src/convex/`
- **Database schema** with 15+ tables
- **Auth configuration** (Password + Anonymous)
- **HTTP endpoints** for auth callbacks

#### 1.4 Configure Convex Environment Variables

Go to your [Convex Dashboard](https://dashboard.convex.dev) → **Settings** → **Environment Variables**.

Set these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SITE_URL` | `https://your-app.vercel.app` | Your production URL (needed for auth redirects) |
| `JWKS` | *(auto-generated)* | JWT verification keys (set during `convex init`) |
| `JWT_PRIVATE_KEY` | *(auto-generated)* | JWT signing key (set during `convex init`) |

> **Important:** Update `SITE_URL` after you get your production URL from Vercel/Netlify.

#### 1.5 Configure Auth Redirects

In the Convex Dashboard → **Authentication** → **Settings**:

1. Add your production URL to **Allowed redirect URLs**:
   - `https://your-app.vercel.app/auth`
   - `https://your-app.vercel.app/dashboard`
2. For development, add:
   - `http://localhost:5173/auth`
   - `http://localhost:5173/dashboard`

---

### Step 2: Configure Environment Variables

#### 2.1 Pin Your Convex URL

Setelah deployment Convex kamu aktif, buka `src/lib/convex-url.ts` dan isi URL deployment-mu:

```ts
export const CONVEX_URL = "https://your-project-id.convex.cloud";
```

URL ini di-bake ke bundle saat build — tidak perlu set env var di hosting.

#### 2.2 Environment Variables for Hosting

Tidak ada env var frontend yang wajib — URL Convex sudah di-pin di kode.

> Server-side (deployment Convex): pastikan `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`, dan `VLY_CONVEX_AUTH_ISSUER` ter-set via `npx convex env set` (lihat Step 1).

> **Note:** Vite environment variables must be prefixed with `VITE_` to be accessible in the client bundle.

---

### Step 3: Deploy to Vercel (Recommended)

Vercel is the easiest option for Vite + React projects.

#### 3.1 Install Vercel CLI

```bash
# Install Vercel CLI globally
bun add -g vercel

# Or use npx
npx vercel
```

#### 3.2 Deploy

```bash
# From project root
vercel

# Follow the prompts:
# ? Set up and deploy "~/database-quest-mutuharjo"? → Y
# ? Which scope? → Select your account
# ? Link to existing project? → N
# ? What's your project's name? → database-quest-mutuharjo
# ? In which directory is your code located? → ./
# ? Want to override settings? → Y
# ? Build Command? → bun run build
# ? Output Directory? → dist
# ? Install Command? → bun install
```

#### 3.3 Set Environment Variables on Vercel

```bash
# Add environment variables
vercel --prod
# Paste: https://your-project-id.convex.cloud

vercel env add VITE_CONVEX_SITE_URL production
# Paste: https://your-project-id.convex.site
```

Or via **Vercel Dashboard**:
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add each variable with environment: **Production**, **Preview**, **Development**

#### 3.4 Deploy to Production

```bash
# Deploy to production
vercel --prod

# Your app will be live at:
# https://database-quest-mutuharjo.vercel.app
```

#### 3.5 Automatic Deployments

After the initial deploy, Vercel automatically:
- Deploys every `git push` to `main` → Production
- Deploys every pull request → Preview URL
- Runs `bun run build` (which runs `tsc -b && vite build`)
- Serves the `dist/` folder as a static SPA

#### 3.6 Vercel Configuration (vercel.json)

If you need custom configuration, create `vercel.json`:

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/lottie/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

> **Note:** The `rewrites` rule ensures React Router handles all client-side routes. The `headers` rule caches Lottie animation files for better performance.

---

### Step 4: Deploy to Netlify (Alternative)

#### 4.1 Install Netlify CLI

```bash
# Install Netlify CLI
bun add -g netlify-cli

# Or use npx
npx netlify-cli
```

#### 4.2 Deploy

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

#### 4.3 Set Environment Variables on Netlify

Via **Netlify Dashboard**:
1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site → **Site settings** → **Environment variables**
3. Add:

| Key | Value |
|-----|-------|
| `CONVEX_URL` (pinned) | `https://your-project-id.convex.cloud` | `src/lib/convex-url.ts` |
| `VITE_CONVEX_SITE_URL` | `https://your-project-id.convex.site` |

#### 4.4 Netlify Configuration (netlify.toml)

Create `netlify.toml` in project root:

```toml
[build]
  command = "bun run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/lottie/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

### Step 5: Custom Domain Setup

#### 5.1 Vercel Custom Domain

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Enter your domain: `database.smkmuh1-skh.sch.id`
3. Add DNS records at your registrar:

**Option A: Use Vercel DNS (recommended)**
- Change nameservers to Vercel's

**Option B: Use external DNS**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Wait for DNS propagation (up to 48 hours)
5. Vercel auto-provisions SSL certificate

#### 5.2 Netlify Custom Domain

1. Go to Netlify Dashboard → Your Site → **Domain management**
2. Click **Add custom domain**
3. Enter: `database.smkmuh1-skh.sch.id`
4. Add DNS records:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site.netlify.app
```

5. Enable HTTPS (auto-provisioned via Let's Encrypt)

#### 5.3 Update Convex After Custom Domain

**Critical:** After your custom domain is live:

1. Go to Convex Dashboard → **Settings** → **Environment Variables**
2. Update `SITE_URL`:
   ```
   SITE_URL=https://database.smkmuh1-skh.sch.id
   ```
3. Go to **Authentication** → **Settings**
4. Add your custom domain to **Allowed redirect URLs**:
   ```
   https://database.smkmuh1-skh.sch.id/auth
   https://database.smkmuh1-skh.sch.id/dashboard
   ```

---

### Step 6: Post-Deployment Checklist

After deploying, verify everything works:

#### 6.1 Frontend Verification

| Check | How to Verify |
|-------|---------------|
| Landing page loads | Visit your URL → see animated hero section |
| Auth works | Click "Masuk" / "Daftar" → login/register flow |
| Dashboard loads | After login → see stats, quick actions |
| Lessons accessible | Click "Learn" → see 15 worlds |
| SQL sandbox works | Open a lesson → run a query |
| Battle works | Go to Battle → start a bot match |
| Mobile responsive | Open on phone → bottom nav appears |

#### 6.2 Backend Verification

| Check | How to Verify |
|-------|---------------|
| Convex functions deployed | [Convex Dashboard](https://dashboard.convex.dev) → Functions tab |
| Auth configured | Test login/register on production URL |
| Database has data | Register a test account → check Users table |
| Real-time works | Open 2 tabs → changes sync instantly |

#### 6.3 Performance Check

| Check | Expected |
|-------|----------|
| Lighthouse score | ≥ 90 (Performance, Accessibility) |
| First Contentful Paint | < 2s |
| Total bundle size | < 500KB gzipped |
| Lottie assets | 25 JSON files, cached after first load |

#### 6.4 Update Convex SITE_URL

**Don't forget this step!** After confirming your production URL works:

1. Update `SITE_URL` in Convex environment variables
2. Update allowed redirect URLs in Convex Auth settings
3. Test the full auth flow again

---

## Environment Variables Reference

### Client-side (Vite — Frontend)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CONVEX_URL` (pinned) | Convex deployment URL, di-set di `src/lib/convex-url.ts` | `https://abc123.convex.cloud` | ❌ No (baked in code) |
| `VITE_CONVEX_SITE_URL` | Convex site URL for auth | `https://abc123.convex.site` | ✅ Yes |

### Server-side (Convex — Backend)

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `JWKS` | JSON Web Key Set for auth | Convex Dashboard → Settings |
| `JWT_PRIVATE_KEY` | JWT signing key | Convex Dashboard → Settings |
| `SITE_URL` | Application URL for auth callbacks | Convex Dashboard → Settings |

> **⚠️ Important:**
> - Never commit `.env.local` to git (it's in `.gitignore`)
> - Never edit `.env.local` manually in the repo — use hosting platform dashboards
> - Convex env vars are set via the Convex Dashboard, not local files

---

## Project Structure

```
src/
├── components/
│   ├── AppFooter.tsx          # Public page footer
│   ├── AppShell.tsx           # Authenticated app shell (sidebar + topbar)
│   ├── AvatarUpload.tsx       # Avatar upload with Convex storage
│   ├── ClassroomMode.tsx      # Real-time classroom session
│   ├── DailyQuests.tsx        # Daily quest tracker
│   ├── DuelArena.tsx          # 1v1 duel UI
│   ├── LogoDropdown.tsx       # Logo with dropdown
│   ├── MobileBottomNav.tsx    # Mobile bottom navigation bar
│   ├── RequireAuth.tsx        # Auth guard wrapper
│   ├── SqlSandboxInline.tsx   # Inline SQL sandbox for lessons
│   ├── StreakRewards.tsx      # Streak milestone rewards
│   ├── TournamentArena.tsx    # Tournament bracket UI
│   ├── WeeklyBossArena.tsx    # Weekly boss challenge UI
│   ├── teacher/
│   │   ├── AssignmentsPanel.tsx
│   │   ├── ChallengesPanel.tsx
│   │   ├── ClassesPanel.tsx
│   │   ├── PasswordResetPanel.tsx
│   │   └── WeeklyBossPanel.tsx
│   └── ui/                    # shadcn/ui components (30+)
│       └── lottie-animation.tsx  # Lottie wrapper component
├── convex/
│   ├── admin.ts               # Admin functions (password reset, setup)
│   ├── assignments.ts         # Assignment CRUD + verification
│   ├── auth.ts                # Auth configuration (DO NOT MODIFY)
│   ├── auth.config.ts         # Auth config (DO NOT MODIFY)
│   ├── battle.ts              # Duel + Tournament logic
│   ├── challenges.ts          # Teacher-made case studies
│   ├── classes.ts             # Class management
│   ├── classroom.ts           # Real-time classroom session
│   ├── game.ts                # Exercise submission, leaderboard, dashboard
│   ├── gameState.ts           # XP, stats, streak, coins management
│   ├── http.ts                # HTTP endpoints
│   ├── profile.ts             # Profile, avatar, username management
│   ├── quiz.ts                # Quiz session + anti-cheat
│   ├── schema.ts              # Database schema
│   ├── setup.ts               # Initial setup
│   ├── shop.ts                # Coin shop, daily quests, streak rewards
│   ├── users.ts               # User queries
│   └── weeklyBoss.ts          # Weekly boss challenge
├── hooks/
│   ├── use-auth.ts            # Auth hook
│   ├── use-mobile.ts          # Mobile detection
│   └── use-theme.ts           # Dark mode toggle
├── lib/
│   ├── curriculum.ts          # 15 Worlds, lessons, exercises
│   ├── data/datasets.ts       # School & canteen databases
│   ├── game.ts                # Levels, ranks, badges, bots, tiers
│   ├── quizBank.ts            # 227-question quiz bank (SERVER ONLY)
│   ├── sounds.ts              # Web Audio sound effects
│   ├── sql/engine.ts          # Custom SQL engine (~1200 lines)
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
│   ├── ShopPage.tsx           # Coin shop
│   └── TeacherPage.tsx        # Teacher dashboard
├── index.css                  # Design tokens + Tailwind config
├── main.tsx                   # App entrypoint + routing
└── vite-env.d.ts              # Vite type declarations

public/
├── lottie/                    # 25 Lottie animation JSON files
│   ├── database-loading.json
│   ├── sql-quest.json
│   ├── quiz-correct.json
│   ├── battle-victory.json
│   └── ... (25 total)
└── index.html

convex/
└── _generated/                # Auto-generated Convex types (DO NOT EDIT)
    ├── api.ts
    ├── dataModel.ts
    └── server.ts
```

---

## Curriculum

### Worlds Overview

| # | World | Title | Topics | Lessons |
|---|-------|-------|--------|---------|
| 1 | 🌍 Database Basics | Database Is Everywhere | Data, DBMS, MySQL intro | 3 |
| 2 | 🧱 Table Builder | CREATE DATABASE & TABLE | DDL, data types | 3 |
| 3 | 🚀 SELECT Adventure | Query Pertama | SELECT *, column selection | 3 |
| 4 | 🕵️ Data Detective | WHERE & Friends | WHERE, LIKE, IN, BETWEEN | 3 |
| 5 | 📊 Sort Master | ORDER BY & LIMIT | Sorting, DISTINCT, LIMIT | 3 |
| 6 | ✏️ CRUD Workshop | INSERT, UPDATE, DELETE | DML operations | 3 |
| 7 | 🔗 Relationship | Foreign Keys | Entity relationships | 2 |
| 8 | 🔗 JOIN Arena | INNER & LEFT JOIN | Table joins | 3 |
| 9 | 📈 Aggregation | GROUP BY & HAVING | Aggregate functions | 3 |
| 10 | 🏰 Subquery Dungeon | Scalar & IN subqueries | Advanced queries | 2 |
| 11 | 🏛️ Database Architect | Schema Design | Design patterns | 2 |
| 12 | 🔬 Normalization Lab | 1NF, 2NF, 3NF | Normalization | 2 |
| 13 | ⚡ Performance Lab | Index & Optimization | Query performance | 2 |
| 14 | 💰 Transaction | ACID & Transactions | Data integrity | 2 |
| 15 | 🔒 Security | SQL Injection & Access | Database security | 2 |

### Exercise Stats

- **30+ hands-on exercises** across 15 worlds
- **227 quiz questions** in the question bank
- **2 datasets**: School database and Canteen database
- **4 difficulty levels**: Easy, Normal, Hard, Boss
- **Progressive XP**: 50–200 XP per exercise

---

## Lottie Animations

### Animation Registry (25 animations)

| Key | Purpose | Used In |
|-----|---------|---------|
| `database-loading` | Page loading spinner | Dashboard, Admin, Teacher, Auth |
| `sql-quest` | SQL theme decoration | Landing, Auth, Footer |
| `globe-spin` | World loading | Learn page |
| `level-up` | Level up celebration | Dashboard |
| `xp-gain` | XP reward indicator | Lessons, Battle, Duel |
| `progress-fill` | Progress bar fill | Progress components |
| `quiz-correct` | Correct answer flash | LessonPage quiz |
| `quiz-wrong` | Wrong answer shake | LessonPage quiz |
| `quiz-complete` | Quiz finished | LessonPage quiz |
| `battle-victory` | Battle won | BattlePage, Duel, Boss |
| `battle-defeat` | Battle lost | BattlePage, Duel |
| `sword-clash` | Combat/pvp theme | Battle, Duel, Landing |
| `badge-unlock` | Badge earned | Profile, Achievement |
| `trophy-shine` | Winner/champion | Leaderboard, Tournament, Boss |
| `star-burst` | Achievement sparkle | Leaderboard, Landing |
| `code-running` | Query executing | SqlSandbox, Classroom |
| `query-success` | Query completed | SqlSandbox |
| `fire-streak` | Active streak | Dashboard, Profile, Streaks |
| `gift-reveal` | Gift/shop item | ShopPage |
| `coin-stack` | Coin balance | Dashboard, Shop |
| `empty-box` | Empty state | Profile, no-data states |
| `search-not-found` | Not found | Search, 404 |
| `sparkle` | Subtle accent | 15+ locations |
| `check-mark` | Success indicator | Profile, Assignments, Classroom |
| `error-oops` | Error state | NotFound, Assignments |

### Adding New Animations

1. Get a Lottie JSON file from [LottieFiles](https://lottiefiles.com/) or create custom
2. Place it in `public/lottie/your-animation.json`
3. Register in `src/components/ui/lottie-animation.tsx`:

```typescript
// Add to AnimationKey type
export type AnimationKey = ... | "your-animation";

// Add to ANIMATION_MAP
const ANIMATION_MAP: Record<AnimationKey, string> = {
  ...,
  "your-animation": "/lottie/your-animation.json",
};
```

4. Use anywhere:
```tsx
import { LottieAnimation } from "@/components/ui/lottie-animation";

<LottieAnimation animation="your-animation" size="md" loop />
```

---

## Testing Report

### Automated Checks

| Check | Status |
|-------|--------|
| TypeScript Compilation (`tsc -b --noEmit`) | ✅ Pass (0 errors) |
| Convex Codegen (`convex dev --once`) | ✅ Pass (19 modules) |
| All 125+ source files | ✅ No type errors |
| Production Build (`vite build`) | ✅ Pass |

### Feature Verification

| Feature | Status |
|---------|--------|
| Landing Page (with Lottie) | ✅ |
| Authentication (Password) | ✅ |
| Onboarding (5-step) | ✅ |
| World Map (15 worlds) | ✅ |
| Lesson Content (38+ lessons) | ✅ |
| SQL Sandbox (with Lottie) | ✅ |
| Quiz System (227 questions, anti-cheat) | ✅ |
| Exercise Submission | ✅ |
| Bot Battle (6 tiers) | ✅ |
| Private Duel 1v1 | ✅ |
| Tournament (bracket) | ✅ |
| Weekly Boss | ✅ |
| Assignments & Challenges | ✅ |
| Leaderboard (3 modes) | ✅ |
| Student Profile (with Lottie) | ✅ |
| Coin Shop (15 items) | ✅ |
| Daily Quests (3/day) | ✅ |
| Streak Rewards (6 milestones) | ✅ |
| Teacher Dashboard | ✅ |
| Admin Console | ✅ |
| Dark Mode | ✅ |
| Sound Effects (9 sounds) | ✅ |
| Mobile Responsive + Bottom Nav | ✅ |
| Lottie Animations (25 animations) | ✅ |

### Security Checks

| Check | Status |
|-------|--------|
| Quiz answers server-only | ✅ |
| SQL validation server-side | ✅ |
| Anti-cheat quiz system | ✅ |
| Anti-farming XP | ✅ |
| Role-based access | ✅ |
| Username uniqueness | ✅ |
| Class selection from DB | ✅ |

---

## Troubleshooting

### Common Issues

#### 1. Build Fails: "PathAlreadyExists" or "FileNotFound" (Bun Cache)

```bash
# Clear Bun cache and reinstall
rm -rf node_modules/.cache
bun install --force
```

#### 2. Convex Functions Not Deploying

```bash
# Check you're logged in
bun convex whoami

# If not logged in
bun convex login

# Force deploy
bun convex dev --once
```

#### 3. "Failed to connect / CONVEX Q(...) Server Error"

- Buka `src/lib/convex-url.ts` — pastikan `CONVEX_URL` menunjuk deployment kamu yang sehat
- Cek kesehatan backend: `npx convex run classes:list` (harus balas `[]`, bukan error)
- Pastikan env auth ter-set di deployment: `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`

#### 4. Blank Page After Deploy

- Check Vercel/Netlify build logs for errors
- Hard refresh (`Ctrl+Shift+R`) — bundle lama bisa tersangkut di cache browser
- Check browser console for errors
- Verify Convex functions are deployed (Convex Dashboard)

#### 5. Auth Not Working on Production

- Update `SITE_URL` in Convex Dashboard → Settings → Environment Variables
- Add production URL to Convex Auth → Settings → Allowed redirect URLs
- Ensure `VITE_CONVEX_SITE_URL` is set in hosting dashboard

#### 6. 404 on Page Refresh (Client-Side Routing)

Ensure your hosting platform redirects all routes to `index.html`:

**Vercel:** Add `vercel.json` (see Step 3.6)
**Netlify:** Add `netlify.toml` (see Step 4.4)
**Cloudflare Pages:** Set "Single Page Application" rewrite rule

#### 7. TypeScript Errors After Clone

```bash
# Install dependencies first
bun install

# Generate Convex types
bun convex dev --once

# Then type check
bun tsc -b --noEmit
```

#### 8. Lottie Animations Not Showing

- Check `public/lottie/` folder has all 25 JSON files
- Verify network tab shows successful fetches for `/lottie/*.json`
- Ensure build output `dist/lottie/` contains the files

### Getting Help

1. **Convex Documentation:** [docs.convex.dev](https://docs.convex.dev)
2. **Vite Documentation:** [vitejs.dev](https://vitejs.dev)
3. **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com)
4. **Lottie Files:** [lottiefiles.com](https://lottiefiles.com)

---

## Known Limitations

1. **Subquery Support**: The SQL engine supports uncorrelated subqueries only (scalar, IN, EXISTS). Correlated subqueries are not yet supported.
2. **No Stored Procedures/Views**: The in-memory SQL engine doesn't support MySQL-specific features like stored procedures, views, or triggers.
3. **Single-player First**: Real-time multiplayer (duels) works via Convex reactive queries, but tournament matches are sequential.
4. **No Mobile App**: Web-only, but fully responsive with bottom navigation.
5. **Limited Curriculum Data**: Worlds 14, 15 have fewer exercises. Worlds 16+ are planned.

---

## Credits

**Made With ♥ By MrStepen ( Joko Endriyanto )**

SMK Muhammadiyah 1 Sukoharjo · PPLG

© 2026 Database Quest: Mutuharjo

---

## License

This project is proprietary software for educational use at SMK Muhammadiyah 1 Sukoharjo.

For other inquiries, contact the creator.
