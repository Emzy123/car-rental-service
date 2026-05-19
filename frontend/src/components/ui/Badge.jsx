import { cn } from '../../lib/cn.js';

const variants = {
  default: 'bg-primary-100 text-primary-700',
  success: 'bg-green-100 text-success',
  warning: 'bg-orange-100 text-warning',
  error: 'bg-red-100 text-error',
  gold: 'bg-secondary-500/20 text-primary-700',
};

export function Badge({ className, variant = 'default', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
