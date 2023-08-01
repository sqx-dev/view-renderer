/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import {
  events,
  $id,
  hideElements,
  showElements,
  getUrlParams,
  BoxTypeDB,
  BoxTypeDFV,
  empty_el,
  EventType,
} from '../util';
import { SystemError } from '../types';

const el = {
  cover: empty_el,
  error_overlay: empty_el,
  error_heading: empty_el,
  error_message_1: empty_el,
  error_message_2: empty_el,
  error_reconnect_btn: empty_el,
  loading_overlay: empty_el,
  loading_heading: empty_el,
};

export function initModalOverlay() {
  el.cover = $id('sqrx-cover-screen');
  el.error_overlay = $id('sqrx-error-content');
  el.error_heading = $id('error-heading');
  el.error_message_1 = $id('error-message-1');
  el.error_message_2 = $id('error-message-2');
  el.error_reconnect_btn = $id('error-reconnect-btn');

  el.loading_overlay = $id('sqrx-loading-content');
  el.loading_heading = $id('loading-heading');

  events.on(EventType.RfbConnected, handleConnected);
  events.on(EventType.RfbDisconnected, handleReconnecting);
  events.on(EventType.ServerHighLoad, handleHighLoad);
  events.on(EventType.Error, handleError);
  events.on(EventType.BeginStartup, handleStartup);
  events.on(EventType.RfbBeginReconnect, handleReconnecting);
  events.on(EventType.Offline, handleOffline);

  el.error_reconnect_btn.addEventListener('click', () =>
    window.location.reload()
  );
}

function deinitModalOverlay() {
  events.off(EventType.RfbConnected, handleConnected);
  events.off(EventType.RfbDisconnected, handleReconnecting);
  events.off(EventType.ServerHighLoad, handleHighLoad);
  events.off(EventType.Error, handleError);
  events.off(EventType.BeginStartup, handleStartup);
  events.off(EventType.RfbBeginReconnect, handleReconnecting);
  events.off(EventType.Offline, handleOffline);
}

function handleError(error: SystemError) {
  if (error.level === 'fatal') {
    deinitModalOverlay();

    if (error.code === 'session_disposed') {
      showDisposedError();
    } else if (error.code === 'quota_exhausted') {
      // redirect to exhausted page
      var baseURL = window.location.protocol + "//" + window.location.host ;
      window.location.replace(baseURL+"/quota-exhausted")
    } else {
      showUnknownError();
    }

    hideElements(el.loading_overlay);
    showElements(el.error_overlay, el.cover);
  }
}

function handleHighLoad() {
  showConnectingOverlay(
    `We are experiencing high usage, please wait while we prepare your session`
  );
}

function handleConnected() {
  hideElements(el.error_overlay, el.loading_overlay, el.cover);
}

function handleOffline() {
  deinitModalOverlay();
  showOfflineError();
}

function handleStartup() {
  const params = getUrlParams();
  const type_name =
    params.type === BoxTypeDB ? 'Disposable Browser' : 'Disposable File Viewer';

  showConnectingOverlay(`Loading ${type_name}...`);
}

function handleReconnecting() {
  console.log('Reconnecting!');
  const params = getUrlParams();
  const type_name =
    params.type === BoxTypeDB ? 'Disposable Browser' : 'Disposable File Viewer';

  showConnectingOverlay(`Reconnecting ${type_name}...`);
}

function showConnectingOverlay(message: string) {
  el.loading_heading.innerHTML = message;
  hideElements(el.error_overlay);
  showElements(el.loading_overlay, el.cover);
}

function showDisposedError() {
  const params = getUrlParams();
  el.error_heading.innerHTML = 'Session Disposed';
  if (params.type === BoxTypeDFV) {
    el.error_message_1.innerHTML = 'File viewer has been disposed';
    el.error_message_1.setAttribute('transform', 'translate(370, 550)');
    el.error_message_2.innerHTML = 'Please start a new disposable file viewer';
    el.error_message_2.setAttribute('transform', 'translate(290, 620)');
  } else {
    el.error_message_1.innerHTML = 'All your browsing history has been deleted';
    el.error_message_1.setAttribute('transform', 'translate(275, 550)');
    el.error_message_2.innerHTML = 'Please start a new session';
    el.error_message_2.setAttribute('transform', 'translate(400, 620)');
  }
  showElements(el.error_message_1, el.error_message_2);
  hideElements(el.error_reconnect_btn);
}

function showOfflineError() {
  el.error_heading.innerHTML =
    'You are offline. Please connect to the internet';

  hideElements(el.error_message_1, el.error_message_2, el.loading_overlay);
  showElements(el.error_reconnect_btn, el.error_overlay);
}

function showUnknownError() {
  el.error_heading.innerHTML = 'SquareX Encountered An Error';
  hideElements(el.error_reconnect_btn, el.error_message_1, el.error_message_2);
}
