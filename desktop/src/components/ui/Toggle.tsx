import type { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Toggle({ id, label, checked, onChange, ...props }: ToggleProps) {
  return (
    <label className="toggle" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} {...props} />
      <span className="toggle__ui" />
      <span className="toggle__text">{label}</span>
    </label>
  );
}
