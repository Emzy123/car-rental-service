import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { Label } from './Label.jsx';

export const Textarea = forwardRef(function Textarea(
  { className, label, error, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-all',
          'focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30',
          error && 'border-error',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
});
