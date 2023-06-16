/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import UI from './ui';

UI.addPropertyListener('isOnline', setTabTitle);
UI.addPropertyListener('connected', setTabTitle);

export function setTabTitle() {
  if (UI.isOnline && !UI.connected) {
    document.title = 'SquareX: Session Expired';
  } else {
    document.title = `SquareX: Disposable File Viewer`;
  }
}
