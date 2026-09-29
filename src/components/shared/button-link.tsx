import Link from "next/link";
import { cn } from "cn";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

type ButtonLinkProps = VariantProps<typeof buttonVariants> & {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function ButtonLink({ href, variant, size, className, children, onClick }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size }), "btn-arc", className)}
    >
      {children}
    </Link>
  );
}
