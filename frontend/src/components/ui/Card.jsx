import { cn } from '../../lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-gray-100 px-6 py-4', className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
