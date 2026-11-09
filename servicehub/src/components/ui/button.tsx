import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-strong",
  secondary: "bg-secondary text-slate-950 hover:bg-secondary-hover",
  outline: "border border-border-strong bg-transparent text-text hover:border-primary hover:bg-primary/10",
  ghost: "bg-transparent text-text-muted hover:bg-surface-interactive hover:text-text",
  danger: "bg-error text-slate-950 hover:bg-red-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner className="size-4" /> : null}
      {loading ? "Loading" : children}
    </button>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("animate-spin rounded-full border-2 border-current border-r-transparent", className)} />;
}
