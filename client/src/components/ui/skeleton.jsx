import { cn } from '../../lib/cn.js';

/**
 * Base Skeleton primitive featuring a sleek CSS shimmer wave animation.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-xl bg-muted/70 dark:bg-muted/40',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton placeholder matching the exact 2:3 aspect ratio of the Cover component.
 */
export function SkeletonCover({ size = 'md', className, ...props }) {
  const sizeClasses = {
    sm: 'h-11 w-8 rounded-lg',
    md: 'h-20 w-14 rounded-xl',
    lg: 'h-32 w-24 rounded-2xl',
  };

  return (
    <Skeleton
      className={cn('shrink-0 shadow-xs', sizeClasses[size] || sizeClasses.md, className)}
      {...props}
    />
  );
}

/**
 * Circular Skeleton placeholder for avatars, icons, and status badges.
 */
export function SkeletonCircle({ size = 'md', className, ...props }) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  return (
    <Skeleton
      className={cn('rounded-full shrink-0', sizeClasses[size] || sizeClasses.md, className)}
      {...props}
    />
  );
}

/**
 * Multi-line or single-line text skeleton with natural line length variations.
 */
export function SkeletonText({ lines = 2, className, ...props }) {
  if (lines <= 1) {
    return <Skeleton className={cn('h-4 w-full rounded-md', className)} {...props} />;
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 rounded-md',
            i === lines - 1 ? 'w-3/5' : i === 0 ? 'w-full' : 'w-4/5'
          )}
        />
      ))}
    </div>
  );
}
