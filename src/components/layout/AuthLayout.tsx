import type { ReactNode } from 'react';
import { ThemeToggle } from '../ThemeToggle';

/** Centered auth card — all viewport sizes (see FRONTEND-STACK.md). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-8 sm:px-6">
      <div className="mb-4 flex justify-end sm:mb-6">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-[min(100%,28rem)] sm:max-w-md md:max-w-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
