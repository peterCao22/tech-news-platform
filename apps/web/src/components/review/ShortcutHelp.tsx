/**
 * Keyboard Shortcuts Help Component
 * Story 3.1: 内容审核工作台
 */

import React from 'react';
import { ShortcutConfig } from '@/hooks/useKeyboardShortcuts';

export interface ShortcutHelpProps {
  shortcuts: ShortcutConfig[];
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({
  shortcuts,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatKey = (shortcut: ShortcutConfig): string => {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* 帮助面板 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-hard p-6 max-w-md w-full pointer-events-auto animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">键盘快捷键</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {shortcuts
              .filter(s => !s.disabled)
              .map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                >
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
                    {formatKey(shortcut)}
                  </kbd>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              按 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">?</kbd> 显示/隐藏此帮助
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShortcutHelp;

