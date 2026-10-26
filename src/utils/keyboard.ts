export type KeyboardAction =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'RESET' }
  | { type: 'SET_LEVEL'; levelIndex: number }
  | null;

/**
 * Pure function to map keyboard events to breathing app actions.
 * Prevents unintentional triggers while focusing text inputs or when modals are open.
 */
export function resolveKeyboardShortcut(
  key: string,
  isInputElement: boolean,
  isModalOpen: boolean
): KeyboardAction {
  if (isInputElement || isModalOpen) {
    return null;
  }

  if (key === ' ' || key === 'Spacebar') {
    return { type: 'TOGGLE_PLAY' };
  }

  if (key === 'r' || key === 'R') {
    return { type: 'RESET' };
  }

  if (key === '1') return { type: 'SET_LEVEL', levelIndex: 0 };
  if (key === '2') return { type: 'SET_LEVEL', levelIndex: 1 };
  if (key === '3') return { type: 'SET_LEVEL', levelIndex: 2 };
  if (key === '4') return { type: 'SET_LEVEL', levelIndex: 3 };
  if (key === '5') return { type: 'SET_LEVEL', levelIndex: 4 };
  if (key === '6') return { type: 'SET_LEVEL', levelIndex: 5 };
  if (key === '7') return { type: 'SET_LEVEL', levelIndex: 6 };
  if (key === '8') return { type: 'SET_LEVEL', levelIndex: 7 };

  return null;
}
