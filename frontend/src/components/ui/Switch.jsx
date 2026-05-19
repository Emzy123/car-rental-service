import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/cn.js';

export function Switch({ className, label, id, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <SwitchPrimitive.Root
        id={id}
        className={cn(
          'relative h-6 w-11 rounded-full bg-gray-300 transition-colors data-[state=checked]:bg-primary-500',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
