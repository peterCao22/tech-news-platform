/**
 * Keyboard Shortcuts Hook Tests
 * Story 3.1: 内容审核工作台
 */

/// <reference types="jest" />

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, type ShortcutConfig } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockAction: jest.Mock;

  beforeEach(() => {
    mockAction = jest.fn();
  });

  describe('basic shortcuts', () => {
    it('should trigger action on key press', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'a',
          description: 'Test Action',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Simulate key press
      const event = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when disabled', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'a',
          description: 'Test Action',
          action: mockAction,
          disabled: true,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const event = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should not trigger when hook is disabled', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'a',
          description: 'Test Action',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts, enabled: false }));

      const event = new KeyboardEvent('keydown', { key: 'a' });
      window.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('modifier keys', () => {
    it('should require Ctrl key when specified', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 's',
          description: 'Save',
          action: mockAction,
          ctrlKey: true,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Without Ctrl
      let event = new KeyboardEvent('keydown', { key: 's' });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();

      // With Ctrl
      event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should require Shift key when specified', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: '?',
          description: 'Help',
          action: mockAction,
          shiftKey: true,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Without Shift
      let event = new KeyboardEvent('keydown', { key: '?' });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();

      // With Shift
      event = new KeyboardEvent('keydown', { key: '?', shiftKey: true });
      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should require Alt key when specified', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'f',
          description: 'Find',
          action: mockAction,
          altKey: true,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      // Without Alt
      let event = new KeyboardEvent('keydown', { key: 'f' });
      window.dispatchEvent(event);
      expect(mockAction).not.toHaveBeenCalled();

      // With Alt
      event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      window.dispatchEvent(event);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ignoring editable elements', () => {
    it('should not trigger in input fields', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'a',
          description: 'Test',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      input.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger in textarea', () => {
      const shortcuts: ShortcutConfig[] = [
        {
          key: 'a',
          description: 'Test',
          action: mockAction,
        },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      textarea.dispatchEvent(event);

      expect(mockAction).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('multiple shortcuts', () => {
    it('should handle multiple shortcuts', () => {
      const action1 = jest.fn();
      const action2 = jest.fn();

      const shortcuts: ShortcutConfig[] = [
        { key: 'a', description: 'Action 1', action: action1 },
        { key: 'b', description: 'Action 2', action: action2 },
      ];

      renderHook(() => useKeyboardShortcuts({ shortcuts }));

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).not.toHaveBeenCalled();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const shortcuts: ShortcutConfig[] = [
        { key: 'a', description: 'Test', action: mockAction },
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts({ shortcuts }));

      unmount();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(mockAction).not.toHaveBeenCalled();
    });
  });
});

