import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { VariantProps } from "class-variance-authority";

type ButtonLinkProps = VariantProps<typeof buttonVariants> & {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function ButtonLink({ href, variant, size, className, children, onClick }: ButtonLinkProps) {
  return (
    <Link href={href} onClick={onClick} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
