import { useEffect, useRef, useState, lazy, Suspense, useMemo } from "react";
import type { LottieHandle } from "lottie-react";
import { cn } from "@/lib/utils";

// Lazy-load lottie-react to keep initial bundle small
const Lottie = lazy(() => import("lottie-react").then((m) => ({ default: m.Lottie })));

/* ------------------------------------------------------------------ */
/*  Available Lottie animation keys                                   */
/* ------------------------------------------------------------------ */
export type AnimationKey =
  // Dashboard & Loading
  | "database-loading"
  | "sql-quest"
  | "globe-spin"
  // Level & Progress
  | "level-up"
  | "xp-gain"
  | "progress-fill"
  // Quiz
  | "quiz-correct"
  | "quiz-wrong"
  | "quiz-complete"
  // Battle
  | "battle-victory"
  | "battle-defeat"
  | "sword-clash"
  // Achievement & Badges
  | "badge-unlock"
  | "trophy-shine"
  | "star-burst"
  // SQL Sandbox
  | "code-running"
  | "query-success"
  // Streak & Rewards
  | "fire-streak"
  | "gift-reveal"
  | "coin-stack"
  // Empty States
  | "empty-box"
  | "search-not-found"
  // Navigation & UI
  | "sparkle"
  | "check-mark"
  | "error-oops";

/* ------------------------------------------------------------------ */
/*  Animation data registry (lazy-loaded JSON files)                  */
/* ------------------------------------------------------------------ */
const ANIMATION_MAP: Record<AnimationKey, string> = {
  "database-loading": "/lottie/database-loading.json",
  "sql-quest": "/lottie/sql-quest.json",
  "globe-spin": "/lottie/globe-spin.json",
  "level-up": "/lottie/level-up.json",
  "xp-gain": "/lottie/xp-gain.json",
  "progress-fill": "/lottie/progress-fill.json",
  "quiz-correct": "/lottie/quiz-correct.json",
  "quiz-wrong": "/lottie/quiz-wrong.json",
  "quiz-complete": "/lottie/quiz-complete.json",
  "battle-victory": "/lottie/battle-victory.json",
  "battle-defeat": "/lottie/battle-defeat.json",
  "sword-clash": "/lottie/sword-clash.json",
  "badge-unlock": "/lottie/badge-unlock.json",
  "trophy-shine": "/lottie/trophy-shine.json",
  "star-burst": "/lottie/star-burst.json",
  "code-running": "/lottie/code-running.json",
  "query-success": "/lottie/query-success.json",
  "fire-streak": "/lottie/fire-streak.json",
  "gift-reveal": "/lottie/gift-reveal.json",
  "coin-stack": "/lottie/coin-stack.json",
  "empty-box": "/lottie/empty-box.json",
  "search-not-found": "/lottie/search-not-found.json",
  "sparkle": "/lottie/sparkle.json",
  "check-mark": "/lottie/check-mark.json",
  "error-oops": "/lottie/error-oops.json",
};

/* ------------------------------------------------------------------ */
/*  Size presets                                                       */
/* ------------------------------------------------------------------ */
const SIZE_PRESETS = {
  xs: { width: 24, height: 24 },
  sm: { width: 40, height: 40 },
  md: { width: 64, height: 64 },
  lg: { width: 120, height: 120 },
  xl: { width: 200, height: 200 },
  "2xl": { width: 300, height: 300 },
  full: { width: "100%", height: "auto" },
} as const;

export type SizePreset = keyof typeof SIZE_PRESETS;

/* ------------------------------------------------------------------ */
/*  Fallback skeleton while animation loads                           */
/* ------------------------------------------------------------------ */
function LottieFallback({ size }: { size: SizePreset }) {
  const dims = SIZE_PRESETS[size];
  const w = typeof dims.width === "number" ? dims.width : 64;
  const h = typeof dims.height === "number" ? dims.height : 64;
  return (
    <div
      className="animate-pulse rounded-full bg-primary/10"
      style={{ width: w, height: h }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export interface LottieProps {
  /** Animation key from the registry */
  animation: AnimationKey;
  /** Size preset or custom dimensions */
  size?: SizePreset | { width: number; height: number };
  /** Whether animation plays on mount */
  autoplay?: boolean;
  /** Loop the animation */
  loop?: boolean;
  /** Playback speed (1 = normal) */
  speed?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when animation segment completes */
  onComplete?: () => void;
  /** Custom fallback while loading */
  fallback?: React.ReactNode;
}

export function LottieAnimation({
  animation,
  size = "md",
  autoplay = true,
  loop = true,
  speed = 1,
  className,
  onComplete,
  fallback,
}: LottieProps) {
  const lottieRef = useRef<LottieHandle | null>(null);
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Determine dimensions
  const dimensions = useMemo(() => {
    if (typeof size === "string") return SIZE_PRESETS[size];
    return { width: size.width, height: size.height };
  }, [size]);

  // Load animation JSON
  useEffect(() => {
    const url = ANIMATION_MAP[animation];
    if (!url) {
      setLoadError(true);
      return;
    }

    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [animation]);

  // Fallback
  if (loadError || !animationData) {
    return fallback ?? <LottieFallback size={size as SizePreset} />;
  }

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <Suspense fallback={fallback ?? <LottieFallback size={size as SizePreset} />}>
        <Lottie
          lottieRef={lottieRef}
          src={animationData}
          autoplay={autoplay}
          loop={loop}
          speed={speed}
          className="w-full h-full"
          subscriptions={onComplete ? { complete: () => onComplete() } : undefined}
        />
      </Suspense>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick-use presets for common patterns                              */
/* ------------------------------------------------------------------ */

/** Level up celebration overlay */
export function LevelUpAnimation({ level, onComplete }: { level: number; onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LottieAnimation animation="level-up" size="2xl" loop={false} onComplete={onComplete} />
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-400">LEVEL UP!</h2>
          <p className="mt-1 text-lg text-muted-foreground">Level {level} 🎉</p>
        </div>
      </div>
    </div>
  );
}

/** Correct answer flash */
export function QuizCorrectFlash() {
  return (
    <LottieAnimation animation="quiz-correct" size="lg" loop={false} />
  );
}

/** Wrong answer shake */
export function QuizWrongFlash() {
  return (
    <LottieAnimation animation="quiz-wrong" size="lg" loop={false} />
  );
}

/** Battle result overlay */
export function BattleResultAnimation({ result, onComplete }: { result: "victory" | "defeat"; onComplete?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LottieAnimation
          animation={result === "victory" ? "battle-victory" : "battle-defeat"}
          size="2xl"
          loop={false}
          onComplete={onComplete}
        />
        <h2 className={cn(
          "text-4xl font-black uppercase",
          result === "victory" ? "text-yellow-400" : "text-red-400"
        )}>
          {result === "victory" ? "KAMU MENANG!" : "KALAH!"}
        </h2>
      </div>
    </div>
  );
}

/** Badge unlock toast-style */
export function BadgeUnlockAnimation({ badgeName, onComplete }: { badgeName: string; onComplete?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 shadow-lg shadow-yellow-500/20">
      <LottieAnimation animation="badge-unlock" size="md" loop={false} onComplete={onComplete} />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-yellow-500">Badge Unlocked!</p>
        <p className="font-semibold text-foreground">{badgeName}</p>
      </div>
    </div>
  );
}

/** XP gain animation (inline) */
export function XpGainAnimation({ amount }: { amount: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
      <LottieAnimation animation="xp-gain" size="xs" loop={false} />
      <span>+{amount} XP</span>
    </div>
  );
}

/** Streak fire indicator */
export function StreakFireAnimation({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <LottieAnimation animation="fire-streak" size="sm" />
      <span className="font-bold text-orange-500">{days} hari</span>
    </div>
  );
}

/** SQL query running indicator */
export function QueryRunningAnimation() {
  return <LottieAnimation animation="code-running" size="sm" loop />;
}

/** Query success indicator */
export function QuerySuccessAnimation() {
  return <LottieAnimation animation="query-success" size="sm" loop={false} />;
}

/** Loading spinner for pages */
export function DatabaseLoadingAnimation({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <LottieAnimation animation="database-loading" size="xl" />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}

/** Empty state illustration */
export function EmptyStateAnimation({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LottieAnimation animation="empty-box" size="lg" />
      <div className="text-center">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

/** Coin stack animation for shop/coins */
export function CoinAnimation({ size }: { size?: SizePreset }) {
  return <LottieAnimation animation="coin-stack" size={size ?? "md"} />;
}

/** Gift reveal animation */
export function GiftRevealAnimation({ onComplete }: { onComplete?: () => void }) {
  return <LottieAnimation animation="gift-reveal" size="lg" loop={false} onComplete={onComplete} />;
}

/** Sparkle accent */
export function SparkleAnimation({ className }: { className?: string }) {
  return <LottieAnimation animation="sparkle" size="xs" loop className={className} />;
}
