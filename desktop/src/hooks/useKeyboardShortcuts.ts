import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onFocusComposer?: () => void;
  onShowShortcuts?: () => void;
  onNewChat?: () => void;
  onCloseModals?: () => void;
  onTogglePanel?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onFocusComposer,
    onShowShortcuts,
    onNewChat,
    onCloseModals,
    onTogglePanel,
  } = config;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus composer
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onFocusComposer?.();
        return;
      }

      // Cmd/Ctrl + /: Show shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        onShowShortcuts?.();
        return;
      }

      // Cmd/Ctrl + N: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onNewChat?.();
        return;
      }

      // Escape: Close modals/panels
      if (e.key === 'Escape') {
        onCloseModals?.();
        return;
      }

      // Cmd/Ctrl + B: Toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onTogglePanel?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFocusComposer, onShowShortcuts, onNewChat, onCloseModals, onTogglePanel]);
}
