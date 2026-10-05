import { Button } from "./button.jsx";
import { cn } from "../../lib/cn.js";

export function EmptyState({
  icon: Icon,
  title = "No items found",
  description = "There are no records to display at this time.",
  actionText,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 px-6 py-12 text-center transition-colors",
        className
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50 mb-4 shadow-subtle">
          <Icon className="h-7 w-7 stroke-[1.75]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm" variant="outline" className="shadow-subtle">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
