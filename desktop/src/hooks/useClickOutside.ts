import { useEffect, useRef } from 'react';

export function useClickOutside(
  handler: () => void,
  enabled: boolean = true
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [handler, enabled]);

  return ref;
}
