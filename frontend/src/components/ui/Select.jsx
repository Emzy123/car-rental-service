import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Label } from './Label.jsx';

export function Select({ children, ...props }) {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>;
}

export function SelectTrigger({ className, placeholder, label, error, id, ...props }) {
  return (
    <div className="w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-all',
          'focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/30',
          error && 'border-error',
          label && 'mt-1.5',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}

export function SelectContent({ className, children }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          className
        )}
        position="popper"
        sideOffset={4}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
        'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="h-4 w-4 text-secondary-500" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function SelectGroup({ children }) {
  return <SelectPrimitive.Group>{children}</SelectPrimitive.Group>;
}

export function SelectValue(props) {
  return <SelectPrimitive.Value {...props} />;
}
