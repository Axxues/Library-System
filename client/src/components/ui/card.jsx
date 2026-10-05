import { cn } from "../../lib/cn.js";
export function Card({ className, ...props }) {
  return <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-card p-6", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h4 className={cn("leading-none font-semibold text-card-foreground", className)} {...props} />;
}
export function CardDescription({ className, ...props }) {
  return <p className={cn("text-muted-foreground text-sm", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("", className)} {...props} />;
}
