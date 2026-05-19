import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Sheet({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function SheetTrigger({ children, ...props }) {
  return <DialogPrimitive.Trigger {...props}>{children}</DialogPrimitive.Trigger>;
}

export function SheetContent({ side = 'left', className, children, title }) {
  const sides = {
    left: 'left-0 top-0 h-full w-80 max-w-[90vw] translate-x-0 data-[state=closed]:-translate-x-full',
    right: 'right-0 top-0 h-full w-80 max-w-[90vw] translate-x-0 data-[state=closed]:translate-x-full',
    bottom: 'bottom-0 left-0 w-full max-h-[90vh] translate-y-0 data-[state=closed]:translate-y-full rounded-t-2xl',
  };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 bg-white shadow-xl transition-transform duration-300',
          sides[side],
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          {title && (
            <DialogPrimitive.Title className="font-semibold text-primary-500">
              {title}
            </DialogPrimitive.Title>
          )}
          <DialogPrimitive.Close className="ml-auto rounded-lg p-1 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
