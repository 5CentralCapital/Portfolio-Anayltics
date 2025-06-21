import React, { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'editing';
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutConfig[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[], enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const altMatch = !!shortcut.alt === event.altKey;
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

// Keyboard shortcuts help modal
export const KeyboardShortcutsHelp: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutConfig[];
}> = ({ isOpen, onClose, shortcuts }) => {
  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutConfig[]>);

  const formatShortcut = (shortcut: ShortcutConfig) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Keyboard className="h-6 w-6 mr-2" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                    <div className="flex space-x-1">
                      {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            {key}
                          </kbd>
                          {keyIndex < formatShortcut(shortcut).split(' + ').length - 1 && (
                            <span className="text-gray-500">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded dark:bg-gray-600">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
};

// Default shortcuts for the dashboard
export const createDashboardShortcuts = (callbacks: {
  goToDashboard: () => void;
  goToProperties: () => void;
  goToDealAnalyzer: () => void;
  goToNetWorth: () => void;
  refresh: () => void;
  search: () => void;
  save: () => void;
  newProperty: () => void;
  showHelp: () => void;
}): ShortcutConfig[] => [
  // Navigation
  { key: '1', ctrl: true, description: 'Go to Dashboard', action: callbacks.goToDashboard, category: 'navigation' },
  { key: '2', ctrl: true, description: 'Go to Asset Management', action: callbacks.goToProperties, category: 'navigation' },
  { key: '3', ctrl: true, description: 'Go to Deal Analyzer', action: callbacks.goToDealAnalyzer, category: 'navigation' },
  { key: '4', ctrl: true, description: 'Go to Net Worth', action: callbacks.goToNetWorth, category: 'navigation' },
  
  // Actions
  { key: 'r', ctrl: true, description: 'Refresh Data', action: callbacks.refresh, category: 'actions' },
  { key: 'k', ctrl: true, description: 'Search', action: callbacks.search, category: 'actions' },
  { key: 's', ctrl: true, description: 'Save Current View', action: callbacks.save, category: 'actions' },
  { key: 'n', ctrl: true, description: 'New Property', action: callbacks.newProperty, category: 'actions' },
  
  // Help
  { key: '?', description: 'Show Keyboard Shortcuts', action: callbacks.showHelp, category: 'navigation' }
];