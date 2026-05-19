import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Checkbox({ className, label, id, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <CheckboxPrimitive.Root
        id={id}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300',
          'data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 data-[state=checked]:text-white',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3.5 w-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
