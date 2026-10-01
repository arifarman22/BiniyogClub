import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  image?: string;
  quote?: string;
  quoteAuthor?: string;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  image = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
  quote = "Invest in verified projects across Bangladesh and earn competitive returns with full transparency.",
  quoteAuthor = "Biniyog Club",
}: AuthCardProps) {
  return (
    <>
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-brand-900">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover object-center"
          sizes="50vw"
          priority
        />
        <div className="absolute inset-0 bg-black/55" />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/Biniyog Club Logo Icon PNG.png"
              alt="Biniyog Club"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="text-xl font-bold text-white">
              Biniyog<span className="text-primary ml-1">Club</span>
            </span>
          </Link>
        </div>

        {/* Quote */}
        <div className="relative z-10 p-10">
          <blockquote className="space-y-3">
            <p className="text-lg font-light leading-relaxed text-white/90">
              &ldquo;{quote}&rdquo;
            </p>
            <footer className="text-sm font-medium text-white/60">&mdash; {quoteAuthor}</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-muted/40 px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-foreground">
              <Image
                src="/Biniyog Club Logo Icon PNG.png"
                alt="Biniyog Club"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
              />
              Biniyog<span className="text-primary ml-1">Club</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>

          {footer && (
            <div className="text-center text-sm text-muted-foreground">{footer}</div>
          )}
        </div>
      </div>
    </>
  );
}
