import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "error";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-interactive text-text-muted",
  primary: "bg-primary/15 text-blue-300",
  success: "bg-secondary/15 text-emerald-300",
  warning: "bg-tertiary/15 text-amber-300",
  error: "bg-error/15 text-red-300",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex min-h-6 items-center rounded-pill px-2.5 text-[0.6875rem] font-semibold", tones[tone], className)} {...props} />;
}
