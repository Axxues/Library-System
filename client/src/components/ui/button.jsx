import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:ring-[3px]",
  { variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-subtle hover:shadow-card hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-white shadow-subtle hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background text-foreground shadow-subtle hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        soft: "bg-primary/10 text-primary shadow-none hover:bg-primary/20 active:scale-[0.98]",
      },
      size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-lg gap-1.5 px-3 text-xs", lg: "h-10 rounded-xl px-6 text-base", icon: "size-9 rounded-xl" },
    },
    defaultVariants: { variant: "default", size: "default" } }
);
export function Button({ className, variant, size, type = "button", ...props }) {
  return <button data-slot="button" type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
