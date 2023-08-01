/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { events, $id, empty_el, EventType } from '../util';

const messageMap = {
  opening_link: 'SquareX Is Opening A Link',
  opening_file: 'SquareX Is Opening A File',
  unsupported_file: 'Unsupported File Type',
  upload_failed: 'Failed to upload file',
};

const el = {
  notification: empty_el,
};

const current = {
  notificationHideTimer: null as number | null,
};

export function initAlertNotification() {
  el.notification = $id('sqrx-alert-notification');

  events.on(EventType.FileUploadFailed, ({ reason }) => {
    if (reason === 'unsupported_file') {
      handleAlertNotification('unsupported_file');
    } else {
      handleAlertNotification('upload_failed');
    }
  });

  events.on(EventType.ControlMessage, (data) => {
    if (data.code !== 'alert') {
      return;
    }

    handleAlertNotification(data.message as keyof typeof messageMap);
  });
}

function handleAlertNotification(message: keyof typeof messageMap) {
  const alert_text = messageMap[message as keyof typeof messageMap];

  if (!alert_text) {
    return;
  }

  if (current.notificationHideTimer) {
    window.clearTimeout(current.notificationHideTimer);
  }

  el.notification.innerHTML = alert_text;
  el.notification.classList.add('visible');

  current.notificationHideTimer = window.setTimeout(() => {
    el.notification.classList.remove('visible');
    current.notificationHideTimer = null;
  }, 7000);
}
