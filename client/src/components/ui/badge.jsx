import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
        warning: "border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        destructive: "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
        info: "border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
        neutral: "border-border/60 bg-muted/60 text-muted-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const dotColors = {
  default: "bg-primary-foreground",
  secondary: "bg-secondary-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-rose-500",
  info: "bg-blue-500",
  neutral: "bg-muted-foreground",
  outline: "bg-foreground",
};

export function Badge({ className, variant = "default", statusDot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {statusDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant] || "bg-current")}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
