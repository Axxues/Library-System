import { cn } from "../../lib/cn.js";

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn("bg-muted/40 border-b border-border/70 [&_tr]:border-b", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0 divide-y divide-border/50", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors duration-150 hover:bg-muted/40 data-[state=selected]:bg-muted/60",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn("px-4 py-3.5 align-middle text-sm text-foreground", className)}
      {...props}
    />
  );
}
