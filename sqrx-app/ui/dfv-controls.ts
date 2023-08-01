/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import {
  $id,
  BoxTypeDFV,
  EventType,
  empty_el,
  events,
  getUrlParams,
  hideElements,
  showElements,
} from '../util';
import { forceTemporaryTooltipText } from './tooltip';

const el = {
  panel: empty_el,
  toggle_controls_btn: empty_el,
  upload_btn: empty_el,
  download_btn: empty_el,
  copy_session_btn: empty_el,
  audio_toggle: empty_el,
  audio_disabled_icon: empty_el,
  audio_enabled_icon: empty_el,
  modal_overlay: empty_el,
  upload_progress: empty_el,
  minimized_session_time_left: empty_el,
  session_time_left: empty_el,
};

export function initDisposableFileViewerControls() {
  el.panel = $id('dfv-controls');
  el.upload_btn = $id('dfv-uploader-btn');
  el.download_btn = $id('dfv-downloader-btn');
  el.copy_session_btn = $id('dfv-copy-session-btn');
  el.audio_toggle = $id('dfv-audio-toggle');
  el.audio_disabled_icon = $id('dfv-audio-disabled-icon');
  el.audio_enabled_icon = $id('dfv-audio-enabled-icon');
  el.toggle_controls_btn = $id('dfv-toggle-controls-btn');
  el.upload_progress = $id('dfv-upload-progress');
  el.modal_overlay = $id('modal-overlay');
  el.session_time_left = $id('dfv-session-time-left');
  el.minimized_session_time_left = $id('dfv-minimized-session-time-left');

  hideElements(el.modal_overlay);

  events.on(EventType.BeginStartup, handleBeginStartup);
  events.on(EventType.RfbConnected, handleRfbConnected);
  events.on(EventType.RfbDisconnected, handleRfbDisconnected);
  events.on(EventType.AudioEnabled, handleAudioEnabled);
  events.on(EventType.AudioDisabled, handleAudioDisabled);
  events.on(EventType.FileUploadSuccess, handleFileUploadSuccess);
  events.on(EventType.FileUploadFailed, handleFileUploadFailed);
  events.on(EventType.FileUploadProgress, handleFileUploadProgress);
  events.on(EventType.SessionTimerUpdated, ({ formatted }) => {
    el.session_time_left.innerHTML = formatted;
    el.minimized_session_time_left.innerHTML = formatted;
  });
  events.on(EventType.Offline, handleOffline);

  el.toggle_controls_btn.addEventListener('click', togglePanel);

  el.copy_session_btn.addEventListener('click', () => {
    events.emit(EventType.UserCopiedSession, void 0);
    // This isn't great "event emitting" but the tooltip
    // thing is all a bit of a hack.
    forceTemporaryTooltipText('Copied Session Link');
  });

  el.audio_toggle.addEventListener('click', toggleAudio);
  el.modal_overlay.addEventListener('click', hidePanel);
  el.download_btn.addEventListener('click', () => {
    events.emit(EventType.UserEnabledFileDownloads, void 0);
  });

  el.upload_btn.addEventListener('click', () =>
    events.emit(EventType.UserEnabledFileUpload, void 0)
  );
}

function deinitDisposableFileViewerControls() {
  events.off(EventType.BeginStartup, handleBeginStartup);
  events.off(EventType.RfbConnected, handleRfbConnected);
  events.off(EventType.RfbDisconnected, handleRfbDisconnected);
  events.off(EventType.AudioEnabled, handleAudioEnabled);
  events.off(EventType.AudioDisabled, handleAudioDisabled);
  events.off(EventType.FileUploadSuccess, handleFileUploadSuccess);
  events.off(EventType.FileUploadFailed, handleFileUploadFailed);
  events.off(EventType.FileUploadProgress, handleFileUploadProgress);
}

function handleOffline() {
  deinitDisposableFileViewerControls();
}

function togglePanel() {
  if (el.panel.classList.contains('hidden')) {
    el.panel.classList.remove('hidden');
  } else {
    el.panel.classList.add('hidden');
  }
}

function handleBeginStartup() {
  const params = getUrlParams();
  if (params.type !== BoxTypeDFV) {
    hideElements(el.panel);
  } else {
    showElements(el.panel);
  }
}

function handleRfbConnected() {
  el.panel.classList.remove('invisible', 'hidden');
}

function handleRfbDisconnected() {
  el.panel.classList.add('invisible');
}

function handleAudioEnabled() {
  el.audio_toggle.dataset.state = 'enabled';
  hideElements(el.audio_disabled_icon);
  showElements(el.audio_enabled_icon);
}

function handleAudioDisabled() {
  el.audio_toggle.dataset.state = 'disabled';
  hideElements(el.audio_enabled_icon);
  showElements(el.audio_disabled_icon);
}

function clearUploadProgress() {
  el.upload_progress.style.width = '0%';
}

function handleFileUploadSuccess() {
  clearUploadProgress();
}

function handleFileUploadFailed() {
  clearUploadProgress();
}

function handleFileUploadProgress({ value }: { value: number }) {
  el.upload_progress.style.width = `${value}%`;
}

function toggleAudio() {
  if (el.audio_toggle.dataset.state === 'enabled') {
    events.emit(EventType.UserDisabledAudio, void 0);
  } else {
    events.emit(EventType.UserEnabledAudio, void 0);
  }
}

function showPanel() {
  el.panel.classList.remove('invisible', 'hidden');
  el.modal_overlay.classList.remove('hidden');
}

function hidePanel() {
  el.panel.classList.add('hidden');
  el.modal_overlay.classList.add('hidden');
}
