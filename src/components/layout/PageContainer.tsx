import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Standard page width — mobile → desktop (see docs/FRONTEND-STACK.md § Responsive).
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-lg space-y-6',
        'sm:max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
