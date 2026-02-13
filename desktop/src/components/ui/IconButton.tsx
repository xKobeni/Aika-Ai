import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconOnly?: boolean;
  soft?: boolean;
  children: ReactNode;
}

export function IconButton({
  iconOnly,
  soft,
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const iconOnlyClass = iconOnly ? 'iconBtn--only' : '';
  const softClass = soft ? 'iconBtn--soft' : '';
  return (
    <button
      type="button"
      className={`iconBtn ${iconOnlyClass} ${softClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
