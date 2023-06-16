/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { initializeFirebase } from './firebaseAuthUtils';

export function onExternalNotificationMsg(text) {
  addNotificationWithText(text);
  hideUploadModal();
}

export function addNotificationWithText(text) {
  if (!text) {
    return;
  }

  const notification = document.querySelector('.notification');

  notification.innerHTML = text;
  notification.classList.add('visible');

  window.setTimeout(() => {
    notification.classList.remove('visible');
  }, 7000);
}

export function hideUploadModal() {
  document.body.classList.remove('activate-upload', 'active');
}

export function setupTheme(isDarkThemeEnabled) {
  const isDarkThemInStorage = localStorage.getItem('isDarkThemeEnabled');

  if (isDarkThemeEnabled === true) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  if (isDarkThemInStorage !== isDarkThemeEnabled.toString()) {
    localStorage.setItem('isDarkThemeEnabled', isDarkThemeEnabled);
  }
}

export function initilizeFirebaseOnLoad(UI) {
  initializeFirebase(UI);
}
