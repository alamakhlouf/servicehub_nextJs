import { cn } from "@/lib/cn";

export function Loading({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div aria-label={label} className={cn("flex items-center justify-center gap-2 text-sm text-text-muted", className)} role="status">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-surface-interactive", className)} />;
}
