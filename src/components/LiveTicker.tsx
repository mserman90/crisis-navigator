import { Radio } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { NewsItem } from "@/lib/types";

export function LiveTicker({ items }: { items: NewsItem[] }) {
  const { t } = useI18n();
  return (
    <div className="bg-foreground text-background border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] bg-destructive text-destructive-foreground px-2 py-1 rounded-full shrink-0">
          <Radio size={11} className="animate-pulse" />
          {t.breakingNews}
        </div>
        <div className="overflow-hidden flex-1">
          <div className="whitespace-nowrap animate-marquee text-xs font-mono">
            {items.length > 0
              ? items.map((n, i) => (
                  <span key={i} className="mr-8">
                    <span className="text-info">[{n.time}]</span> {n.text}
                  </span>
                ))
              : t.noActiveNews}
          </div>
        </div>
      </div>
    </div>
  );
}
