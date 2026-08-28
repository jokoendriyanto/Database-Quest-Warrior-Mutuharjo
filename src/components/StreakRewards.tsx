import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Flame, Gift, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { StreakFireAnimation, LottieAnimation, GiftRevealAnimation } from "@/components/ui/lottie-animation";

export default function StreakRewards() {
  const data = useQuery(api.shop.getStreakRewards);
  const claimReward = useMutation(api.shop.claimStreakReward);

  if (!data) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Flame className="size-4 text-battle" />
        <h3 className="text-xs font-bold uppercase tracking-wider">Streak Rewards</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.milestones.map((m, idx) => {
          const reached = data.currentStreak >= m.days;
          const claimed = data.claimed.includes(m.days);

          return (
            <motion.div
              key={m.days}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "relative rounded-lg border p-3 text-center transition-all",
                claimed
                  ? "border-success/30 bg-success/5"
                  : reached
                    ? "border-warning/50 bg-warning/5"
                    : "border-border bg-muted/30",
              )}
            >
              <div className="text-lg font-bold">{m.days}</div>
              <div className="text-[10px] text-muted-foreground">hari</div>

              <div className="mt-2 space-y-0.5">
                <div className="text-[10px] text-primary">+{m.xpReward} XP</div>
                <div className="text-[10px] text-warning">+{m.coinReward} 🪙</div>
              </div>

              <div className="mt-2">
                {claimed ? (
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-success">
                    <Check className="size-3" /> Klaimed
                  </div>
                ) : reached ? (
                  <Button
                    size="sm"
                    className="h-6 w-full text-[10px]"
                    onClick={() => claimReward({ days: m.days })}
                  >
                    <Gift className="size-3 mr-1" /> Klaim
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="size-3" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
