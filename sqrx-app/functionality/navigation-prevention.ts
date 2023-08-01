/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events } from '../util';

export function initNavigationPrevention() {
  events.on(EventType.RfbConnected, () => toggleNavigationPrevention(true));
  events.on(EventType.RfbDisconnected, () => toggleNavigationPrevention(false));
  events.on(EventType.Error, () => toggleNavigationPrevention(false));
  events.on(EventType.Offline, () => toggleNavigationPrevention(false));
}

export function toggleNavigationPrevention(on: boolean) {
  if (on) {
    window.removeEventListener('beforeunload', _preventNavigation);
    window.addEventListener('beforeunload', _preventNavigation);

    return;
  }

  window.removeEventListener('beforeunload', _preventNavigation);
}

function _preventNavigation(event: Event) {
  event.preventDefault();
  // It was here before, and it works, so I'm leaving it
  event.returnValue = '' as unknown as boolean;
}
