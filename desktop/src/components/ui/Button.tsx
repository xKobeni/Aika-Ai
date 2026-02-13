import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn--primary' : variant === 'ghost' ? 'btn--ghost' : '';
  const fullClass = fullWidth ? 'btn--full' : '';
  return (
    <button
      type="button"
      className={`btn ${variantClass} ${fullClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
