import { cn } from "../../lib/cn.js";
export function Input({ className, ...props }) {
  return <input className={cn("flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-subtle outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30", className)} {...props} />;
}
