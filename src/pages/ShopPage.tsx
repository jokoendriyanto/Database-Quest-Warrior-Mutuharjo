import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, ShoppingCart, Sparkles, Crown, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Category = "all" | "avatar" | "title" | "booster" | "cosmetic";

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode }> = {
  all: { label: "Semua", icon: <ShoppingCart className="size-4" /> },
  avatar: { label: "Avatar", icon: "🎭" },
  title: { label: "Judul", icon: <Crown className="size-4" /> },
  booster: { label: "Booster", icon: <Zap className="size-4" /> },
  cosmetic: { label: "Kosmetik", icon: <Sparkles className="size-4" /> },
};

export default function ShopPage() {
  const shopData = useQuery(api.shop.getShopData);
  const buyItem = useMutation(api.shop.buyItem);
  const [cat, setCat] = useState<Category>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const items = useMemo(() => {
    if (!shopData) return [];
    return cat === "all" ? shopData.items : shopData.items.filter((i) => i.category === cat);
  }, [shopData, cat]);

  const handleBuy = async (itemId: string) => {
    setBuying(itemId);
    try {
      await buyItem({ itemId });
      showToast("✅ Berhasil dibeli!");
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    }
    setBuying(null);
  };

  if (!shopData) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const coins = shopData.coins;
  const owned = new Set(shopData.owned);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-20">
      {toast && (
        <div className="fixed top-4 right-4 z-[70] rounded-lg border border-border bg-card px-4 py-3 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-right-4">
          {toast}
        </div>
      )}

      {/* Header */}
      <header>
        <p className="kicker">COIN SHOP</p>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Toko Koin</h1>
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2">
            <Coins className="size-5 text-warning" />
            <span className="text-xl font-bold tabular-nums">{coins.toLocaleString()}</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Beli avatar, judul, boost, dan kosmetik dengan koin yang kamu kumpulkan!
        </p>
      </header>

      {/* Category Tabs */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {(Object.keys(CATEGORY_META) as Category[]).map((key) => (
          <button
            key={key}
            onClick={() => setCat(key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap",
              cat === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {typeof CATEGORY_META[key].icon === "string" ? (
              <span>{CATEGORY_META[key].icon}</span>
            ) : (
              CATEGORY_META[key].icon
            )}
            {CATEGORY_META[key].label}
          </button>
        ))}
      </nav>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const isOwned = owned.has(item.id);
            const canAfford = coins >= item.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "relative rounded-xl border p-4 transition-all",
                  isOwned
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                )}
              >
                {isOwned && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">
                    DIMILIKI
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold truncate">{item.label}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.desc}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <Coins className="size-3.5 text-warning" />
                    <span className={cn(!canAfford && !isOwned && "text-destructive")}>
                      {item.price}
                    </span>
                  </div>

                  {isOwned ? (
                    <span className="text-xs font-semibold text-success">✓ Dimiliki</span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canAfford || buying === item.id}
                      onClick={() => handleBuy(item.id)}
                      className={cn(
                        "h-7 text-xs",
                        !canAfford && "opacity-50",
                      )}
                    >
                      {buying === item.id ? "..." : canAfford ? "Beli" : "Kurang"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Tidak ada item di kategori ini.
        </p>
      )}
    </div>
  );
}
