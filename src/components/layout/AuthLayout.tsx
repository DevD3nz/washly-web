import type { ReactNode } from 'react';
import { ThemeToggle } from '../ThemeToggle';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background px-4 py-8 sm:px-6">
      {/* Gradient background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-900/20" />
      </div>

      {/* Theme toggle top-right */}
      <div className="relative mb-4 flex justify-end sm:mb-6">
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground [box-shadow:0_4px_12px_rgb(13_148_136/0.40)]">
            W
          </span>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            WashLy
          </p>
        </div>

        <div className="w-full max-w-[min(100%,26rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}
