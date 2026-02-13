import type { HTMLAttributes, ReactNode } from 'react';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'green';
  children: ReactNode;
}

export function Pill({ variant = 'default', className = '', children, ...props }: PillProps) {
  const variantClass = variant === 'green' ? 'pill--green' : '';
  return (
    <span className={`pill ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
