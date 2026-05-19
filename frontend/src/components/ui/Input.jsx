import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { Label } from './Label.jsx';

export const Input = forwardRef(function Input(
  { className, label, error, helper, icon, id, ...props },
  ref
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className={cn('relative', label && 'mt-1.5')}>
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-all',
            'placeholder:text-gray-400 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/30',
            icon && 'pl-10',
            error && 'border-error focus:border-error focus:ring-error/30',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
});
