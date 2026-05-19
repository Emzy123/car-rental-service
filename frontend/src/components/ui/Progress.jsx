import { cn } from '../../lib/cn.js';

export function Progress({ steps, currentStep }) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li key={step} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  done && 'bg-secondary-500 text-primary-900',
                  active && 'bg-primary-500 text-white ring-2 ring-secondary-500',
                  !done && !active && 'bg-gray-200 text-gray-500'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={cn('hidden text-xs sm:block', active && 'font-semibold text-primary-500')}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
