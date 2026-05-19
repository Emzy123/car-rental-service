import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const variants = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg focus-visible:ring-secondary-500 active:bg-primary-700',
  secondary:
    'border-2 border-secondary-500 text-primary-500 hover:bg-secondary-500 hover:text-primary-900',
  outline: 'border border-gray-300 text-primary-500 hover:bg-gray-50',
  ghost: 'text-primary-500 hover:bg-primary-50',
  danger: 'bg-error text-white hover:bg-red-700',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-lg',
};

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    asChild = false,
    fullWidth,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : children}
    </Comp>
  );
});
