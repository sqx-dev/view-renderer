/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import './styles/base.css';

import { initNavigationPrevention } from './functionality/navigation-prevention';
import { getUrlParams, validateParams, events, EventType } from './util';
import { initSession } from './functionality/session';
import { initDocumentTitle } from './ui/document-title';
import { initRfbConnection } from './connections/rfb';
import { initModalOverlay } from './ui/modal-overlay';
import { initAudioConnection } from './connections/audio';
import { initControlConnection } from './connections/control';
import { initAlertNotification } from './ui/alert-notification';
import { initTheme } from './ui/theme';
import { initTooltip } from './ui/tooltip';
import { initDisposableBrowserControls } from './ui/db-controls';
import { initDisposableFileViewerControls } from './ui/dfv-controls';
import { initFileUploading } from './functionality/file-uploading';
import { initCopySession } from './functionality/copy-session';
import { initFileDownloads } from './ui/file-downloads';
import { initFileInput } from './ui/file-input';
import { initFetchDownloadableFiles } from './functionality/fetch-downloadable-files';
import { initFileDropzone } from './ui/file-dropzone';
import { SystemError } from './types';
import { initSessionTimer } from './functionality/session-timer';
import { initExtensionBridge } from './functionality/extension-bridge';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI
  initTheme();
  initAlertNotification();
  initModalOverlay();
  initDocumentTitle();
  initDisposableBrowserControls();
  initDisposableFileViewerControls();
  initTooltip();
  initFileDownloads();
  initFileInput();
  initFileDropzone();

  // Initialize functionalities
  initSession();
  initSessionTimer();

  if (BUILD_ENV.prevent_navigation) {
    initNavigationPrevention();
  }

  initFileUploading();
  initCopySession();
  initFetchDownloadableFiles();
  initExtensionBridge();

  // Initialize connections
  initRfbConnection();
  initControlConnection();
  initAudioConnection();
});

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'complete') {
    getUrlParams();

    const params_are_valid = validateParams();

    if (!params_are_valid) {
      return events.emit(EventType.Error, {
        code: 'invalid_params',
        level: 'fatal',
      });
    }

    if (navigator.onLine) {
      events.emit(EventType.BeginStartup, void 0);
    } else {
      events.emit(EventType.Offline, void 0);
    }
  }
});

const reconnect_state = {
  retries: BUILD_ENV.max_rfb_reconnect_retries,
};

window.addEventListener('online', () => events.emit(EventType.Online, void 0));
window.addEventListener('offline', () =>
  events.emit(EventType.Offline, void 0)
);

events.on(EventType.RfbConnected, handleRfbConnected);
events.on(EventType.Online, handleOnline);
events.on(EventType.Offline, handleOffline);
events.on(EventType.RfbDisconnected, handleRfbDisconnected);
events.on(EventType.Error, handleError);

function handleError(error: SystemError) {
  if (error.level === 'fatal') {
    events.off(EventType.RfbConnected, handleRfbConnected);
    events.off(EventType.RfbDisconnected, handleRfbDisconnected);
    events.off(EventType.Online, handleOnline);
    events.off(EventType.Offline, handleOffline);
  }
}

function handleRfbConnected() {
  reconnect_state.retries = BUILD_ENV.max_rfb_reconnect_retries;
}

function handleRfbDisconnected() {
  if (reconnect_state.retries === 0) {
    events.emit(EventType.Error, {
      code: 'rfb_cannot_reconnect',
      level: 'fatal',
    });
    return;
  }

  if (reconnect_state.retries === BUILD_ENV.max_rfb_reconnect_retries) {
    reconnect_state.retries -= 1;
    events.emit(EventType.RfbBeginReconnect, void 0);
  } else {
    setTimeout(() => {
      reconnect_state.retries -= 1;
      events.emit(EventType.RfbBeginReconnect, void 0);
    }, BUILD_ENV.rfb_reconnect_interval);
  }
}

function handleOnline() {
  window.location.reload();
}

function handleOffline() {
  events.off(EventType.RfbConnected, handleRfbConnected);
  events.off(EventType.RfbDisconnected, handleRfbDisconnected);
  events.off(EventType.Error, handleError);
  events.off(EventType.Offline, handleOffline);
}
