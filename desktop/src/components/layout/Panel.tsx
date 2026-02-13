import { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '../ui';
import { useClickOutside } from '../../hooks/useClickOutside';
import * as React from 'react';

const TABS = [
  { id: 'agent', label: 'Agent' },
  { id: 'tools', label: 'Tools' },
  { id: 'memory', label: 'Memory' },
  { id: 'files', label: 'Files' },
];

interface PanelProps {
  panelOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  children: ReactNode;
}

export function Panel({
  panelOpen,
  activeTab,
  onTabChange,
  onClose,
  children,
}: PanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 1100px)').matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1100px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useClickOutside(
    () => {
      if (isMobile && panelOpen) {
        onClose();
      }
    },
    isMobile && panelOpen
  );

  return (
    <aside
      ref={panelRef}
      className={`panel ${panelOpen ? 'is-open' : ''}`}
      aria-label="Context panel"
    >
      <div className="panel__header">
        <div className="panel__title">Context</div>
        <IconButton
          iconOnly
          onClick={onClose}
          aria-label="Close panel"
          className="closePanelBtn"
        >
          ✕
        </IconButton>
      </div>

      <div className="panel__tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab ${activeTab === id ? 'is-active' : ''}`}
            data-tab={id}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel__body">{children}</div>
    </aside>
  );
}
