/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events } from '../util';
import { getCurrentSessionID } from './session';

export function initCopySession() {
  events.on(EventType.UserCopiedSession, copySession);
}

async function copySession() {
  const url = window.location.href;
  const session_id = getCurrentSessionID();

  if (!session_id) {
    return;
  }

  const share_url = url.includes('session=')
    ? url
    : `${url}&session=${session_id}`;

  await navigator.clipboard.writeText(share_url);

  events.emit(EventType.SessionCopied, { url: share_url });
}
