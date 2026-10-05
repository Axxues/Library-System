import { useEffect } from "react";
import { cn } from "../../lib/cn.js";
export function Dialog({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="overlay-backdrop fixed inset-0 animate-in fade-in duration-200" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("relative z-10 w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200 ease-out")}>{children}</div>
    </div>
  );
}
