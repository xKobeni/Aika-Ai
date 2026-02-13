import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({ active, children, className = '', ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'is-active' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
