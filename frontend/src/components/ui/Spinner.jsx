import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return <Loader2 className={cn('animate-spin text-primary-500', sizes[size], className)} />;
}
