import { levelProgress } from "@/lib/domain/xp";
import { cn } from "@/lib/utils";

/**
 * Niveau de l'APPLICATION (XP). Ne mesure jamais la capacité réelle :
 * le niveau personnel est affiché séparément.
 */
export function XpBar({
  totalXp,
  className,
  compact = false,
}: {
  totalXp: number;
  className?: string;
  compact?: boolean;
}) {
  const progress = levelProgress(totalXp);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-display text-sm font-semibold text-foreground">
          Niveau {progress.level}
          <span className="ml-2 text-xs font-normal text-muted-foreground">dans l'application</span>
        </span>
        <span>
          {progress.nextThreshold === null
            ? `${totalXp} XP`
            : `${totalXp} / ${progress.nextThreshold} XP`}
        </span>
      </div>
      <div className={cn("mt-2 overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2.5")}>
        <div
          className="h-full rounded-full bg-xp transition-[width] duration-700 ease-out"
          style={{ width: `${Math.round(progress.ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
