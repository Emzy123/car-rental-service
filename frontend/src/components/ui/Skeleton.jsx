import { cn } from '../../lib/cn.js';

export function Skeleton({ className }) {
  return <div className={cn('skeleton-shimmer rounded-lg', className)} aria-hidden />;
}
