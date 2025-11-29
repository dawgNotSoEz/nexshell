/**
 * Command history management utilities
 * 
 * Provides type-safe history navigation and management
 */

export interface HistoryState {
  items: string[];
  currentIndex: number | null; // null = at end (new input), 0 = oldest, length-1 = newest
}

/**
 * Creates a new history state
 */
export function createHistory(): HistoryState {
  return {
    items: [],
    currentIndex: null
  };
}

/**
 * Adds a command to history
 */
export function addToHistory(history: HistoryState, command: string): HistoryState {
  if (!command.trim()) {
    return history;
  }

  // Don't add duplicates of the most recent command
  if (history.items.length > 0 && history.items[0] === command) {
    return { ...history, currentIndex: null };
  }

  return {
    items: [command, ...history.items],
    currentIndex: null
  };
}

/**
 * Navigates history up (older commands)
 */
export function navigateHistoryUp(history: HistoryState): { history: HistoryState; value: string } {
  if (history.items.length === 0) {
    return { history, value: '' };
  }

  const nextIndex = history.currentIndex === null 
    ? 0 
    : Math.min(history.currentIndex + 1, history.items.length - 1);

  return {
    history: { ...history, currentIndex: nextIndex },
    value: history.items[nextIndex] ?? ''
  };
}

/**
 * Navigates history down (newer commands)
 */
export function navigateHistoryDown(history: HistoryState): { history: HistoryState; value: string } {
  if (history.currentIndex === null) {
    return { history, value: '' };
  }

  if (history.currentIndex === 0) {
    return {
      history: { ...history, currentIndex: null },
      value: ''
    };
  }

  const nextIndex = history.currentIndex - 1;
  return {
    history: { ...history, currentIndex: nextIndex },
    value: history.items[nextIndex] ?? ''
  };
}

/**
 * Resets history navigation (returns to "new input" state)
 */
export function resetHistoryNavigation(history: HistoryState): HistoryState {
  return { ...history, currentIndex: null };
}



