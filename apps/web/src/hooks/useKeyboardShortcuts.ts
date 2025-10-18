/**
 * Keyboard Shortcuts Hook
 * Story 3.1: 内容审核工作台
 * 
 * 提供快捷键支持的自定义Hook
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // 忽略在输入框、文本域等元素中的快捷键
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isEditable = 
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable;

      if (isEditable) return;

      // 查找匹配的快捷键
      const matchedShortcut = shortcuts.find(shortcut => {
        if (shortcut.disabled) return false;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};
