/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

export function togglePreventNavigationEvent(shouldAdd) {
  if (shouldAdd) {
    window.removeEventListener('beforeunload', _preventNavigation);
    window.addEventListener('beforeunload', _preventNavigation);

    return;
  }

  window.removeEventListener('beforeunload', _preventNavigation);
}

function _preventNavigation(event) {
  event.preventDefault();
  event.returnValue = '';
}
