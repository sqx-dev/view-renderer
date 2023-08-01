/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events } from '../util';

export function initTheme() {
  toggleDarkTheme(localStorage.getItem('isDarkThemeEnabled') === 'true');

  events.on(EventType.ThemeValueReceived, ({ value }) => {
    try {
      localStorage.setItem('isDarkThemeEnabled', value.toString());
    } catch (ex) {
      console.warn('Unable to set theme setting in local storage', ex);
    }

    toggleDarkTheme(value);
  });
}

function toggleDarkTheme(enabled: boolean) {
  if (enabled) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
