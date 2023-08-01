/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { SystemError } from '../types';
import { getCountryNameByCode, events, getUrlParams, EventType } from '../util';

export function initDocumentTitle() {
  events.on(EventType.Error, handleError);
  events.on(EventType.RfbConnected, handleConnected);
  events.on(EventType.RfbBeginReconnect, handleReconnecting);
  events.on(EventType.Offline, handleOffline);
  events.on(EventType.RfbDisconnected, handleDisconnected);
  events.on(EventType.ValidatedParams, handleValidatedParams);
}

export function deinitDocumentTitle() {
  events.off(EventType.Error, handleError);
  events.off(EventType.RfbConnected, handleConnected);
  events.off(EventType.RfbBeginReconnect, handleReconnecting);
  events.off(EventType.Offline, handleOffline);
  events.off(EventType.RfbDisconnected, handleDisconnected);
  events.off(EventType.ValidatedParams, handleValidatedParams);
}

function handleError(error: SystemError) {
  if (error.level === 'fatal') {
    deinitDocumentTitle();
    if (error.code === 'session_disposed') {
      document.title = 'SquareX: Session Disposed';
    } else {
      document.title = 'SquareX: Error';
    }
  }
}

function handleReconnecting() {
  document.title = 'SquareX: Reconnecting...';
}

function handleDisconnected() {
  handleReconnecting();
}

function handleOffline() {
  deinitDocumentTitle();
  document.title = 'SquareX: Offline';
}

function handleConnected() {
  setTitleByParams();
}

function handleValidatedParams() {
  setTitleByParams();
}

export function setTitleByParams() {
  const params = getUrlParams();

  if (params.type === 'browser') {
    (
      Array.from(
        document.querySelectorAll('link[rel="icon"]')
      ) as HTMLLinkElement[]
    ).forEach((icon) => (icon.href = `images/icons/${params.country}.png`));
    document.title = `${getCountryNameByCode(
      params.country as string
    )} | SquareX`;
  } else {
    document.title = `SquareX: Disposable File Viewer`;
  }
}
