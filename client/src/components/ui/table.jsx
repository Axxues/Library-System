import { cn } from "../../lib/cn.js";
export function Table({ className, ...props }) { return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />; }
export function TableHeader({ className, ...props }) { return <thead className={cn("[&_tr]:border-b", className)} {...props} />; }
export function TableBody({ className, ...props }) { return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />; }
export function TableRow({ className, ...props }) { return <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />; }
export function TableHead({ className, ...props }) { return <th className={cn("h-10 px-2 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground", className)} {...props} />; }
export function TableCell({ className, ...props }) { return <td className={cn("p-2 align-middle", className)} {...props} />; }
