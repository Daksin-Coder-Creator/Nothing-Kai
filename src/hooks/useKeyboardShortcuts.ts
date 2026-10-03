import { useEffect } from 'react';

interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  key: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutOptions[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      
      for (const shortcut of shortcuts) {
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
        const shiftKey = event.shiftKey;
        const altKey = event.altKey;
        
        const matchCtrl = shortcut.ctrl === undefined || shortcut.ctrl === ctrlKey;
        const matchShift = shortcut.shift === undefined || shortcut.shift === shiftKey;
        const matchAlt = shortcut.alt === undefined || shortcut.alt === altKey;
        const matchKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchCtrl && matchShift && matchAlt && matchKey) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
