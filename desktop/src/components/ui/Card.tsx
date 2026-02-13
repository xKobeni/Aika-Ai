import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function Card({ title, className = '', children, ...props }: CardProps) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {title && <div className="card__title">{title}</div>}
      {children}
    </div>
  );
}
