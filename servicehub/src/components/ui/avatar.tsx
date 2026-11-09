import { cn } from "@/lib/cn";

type AvatarProps = { name: string; src?: string; size?: "sm" | "md" | "lg"; className?: string };

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={name} className={cn("rounded-full object-cover", sizes[size], className)} src={src} />
  ) : (
    <span aria-label={name} className={cn("inline-flex items-center justify-center rounded-full bg-primary/20 font-semibold text-blue-200", sizes[size], className)} role="img">
      {initials}
    </span>
  );
}
