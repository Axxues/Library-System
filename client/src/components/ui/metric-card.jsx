import { cn } from "../../lib/cn.js";

const iconBgVariants = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 ring-1 ring-blue-500/20",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 ring-1 ring-amber-500/20",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 ring-1 ring-rose-500/20",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 ring-1 ring-purple-500/20",
  primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground ring-1 ring-primary/20",
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "primary",
  subtitle,
  progress = null,
  trend = null,
  className,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-lifted hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium",
                  trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.text}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              iconBgVariants[iconColor] || iconBgVariants.primary
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(subtitle || progress !== null) && (
        <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-2">
          {subtitle && <p className="leading-relaxed truncate">{subtitle}</p>}
          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>{progress.label || "Capacity"}</span>
                <span>{Math.round(progress.percent || 0)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progress.colorClass || "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress.percent || 0))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
