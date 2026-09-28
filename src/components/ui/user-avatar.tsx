import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: { wrapper: "size-6 text-[10px]", img: 24 },
  sm: { wrapper: "size-8 text-xs",     img: 32 },
  md: { wrapper: "size-10 text-sm",    img: 40 },
  lg: { wrapper: "size-12 text-base",  img: 48 },
  xl: { wrapper: "size-16 text-lg",    img: 64 },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Deterministic color from name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-brand-100 text-brand-700",
    "bg-finance-100 text-finance-700",
    "bg-harvest-100 text-harvest-600",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const s = sizes[size];
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        s.wrapper,
        !src && colorClass,
        className,
      )}
      aria-label={name}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={s.img}
          height={s.img}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
}
