import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StreakFireAnimation, LottieAnimation } from "@/components/ui/lottie-animation";

export default function DailyQuests() {
  const data = useQuery(api.shop.getDailyQuests);

  if (!data || data.quests.length === 0) return null;

  const progress = data.progress && "completed" in data.progress ? data.progress : { date: data.date, completed: [], progress: {} };
  const completedCount = progress.completed.length;
  const total = data.quests.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LottieAnimation animation="fire-streak" size="xs" loop />
          <h3 className="text-xs font-bold uppercase tracking-wider">Quest Harian</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {completedCount}/{total}
        </span>
      </div>

      <div className="space-y-2">
        {data.quests.map((quest: any, idx: any) => {
          const isCompleted = progress.completed.includes(quest.id);
          const _progress = progress.progress[quest.id] ?? 0;

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isCompleted ? "bg-success/5" : "bg-muted/50",
              )}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle className="size-4 text-success" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-medium", isCompleted && "text-success line-through")}>
                  {quest.icon} {quest.label}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Coins className="size-3 text-warning" />
                <span className="text-[10px] font-bold text-warning">+{quest.coinReward}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {completedCount === total && total > 0 && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-bold text-success">
          <LottieAnimation animation="check-mark" size="xs" loop={false} />
          Semua quest selesai hari ini! Besok lagi ya!
        </motion.div>
      )}
    </div>
  );
}
