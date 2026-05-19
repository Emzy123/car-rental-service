import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({ children, ...props }) {
  return <DialogPrimitive.Trigger {...props}>{children}</DialogPrimitive.Trigger>;
}

export function DialogContent({ className, children, title, description, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    fullscreen: 'max-w-[100vw] h-[100vh] max-h-[100vh] rounded-none',
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl',
          sizes[size],
          className
        )}
      >
        {title && (
          <DialogPrimitive.Title className="text-lg font-semibold text-primary-500">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description className="mt-1 text-sm text-gray-600">
            {description}
          </DialogPrimitive.Description>
        )}
        <div className={title || description ? 'mt-4' : ''}>{children}</div>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
