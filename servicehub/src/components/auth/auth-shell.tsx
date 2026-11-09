import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5">
          <Link className="font-display text-base font-bold tracking-tight text-text" href="/">
            Service<span className="text-blue-400">Hub</span>
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text" href="/">
            Back to marketplace
          </Link>
        </header>
        <div className="flex flex-1 items-start justify-center pb-16 pt-8 sm:pt-14 lg:pt-20">
          {children}
        </div>
      </div>
    </main>
  );
}
