/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { isTouchDevice } from '../../core/util/browser';
import { EventType, events } from '../util';
import { getCurrentSessionID } from '../functionality/session';

// let player = null;
// let canvasEl = null;
// let isAllowed = false;
// let isUnlocked = false;
// let isTouched = false;

const state = {
  player: null as any,
  is_connected: false,
  is_allowed: false,
  is_unlocked: false,
  is_touched: false,
};

export function initAudioConnection() {
  events.on(EventType.RfbConnected, handleRfbConnected);
  events.on(EventType.RfbDisconnected, handleRfbDisconnected);
  events.on(EventType.UserEnabledAudio, startAudio);
  events.on(EventType.UserDisabledAudio, stopAudio);

  function initialTouch(e: TouchEvent | MouseEvent) {
    state.is_touched = true;
    if (e.target && (e.target as any).dataset?.audioToggle) {
      // Audio toggles are going to trigger these events anyway,
      // so dont run them here.
      return;
    }

    if (state.is_connected) {
      startAudio();
    }
  }

  if (isTouchDevice) {
    document.addEventListener('touchstart', initialTouch, {
      once: true,
    });
  }

  window.addEventListener('click', initialTouch, { once: true, capture: true });
}

function startAudio() {
  const session_id = getCurrentSessionID();

  if (!session_id || !state.is_touched) {
    return;
  }

  const url = `wss://${session_id}-audio`;
  try {
    console.log(
      `audio.enable() | allowed: ${state.is_allowed}, unlocked: ${state.is_unlocked}`
    );

    if (state.player) {
      return;
    }

    state.is_allowed = true;

    state.player = new (window as any).JSMpeg.Player(url, {
      pauseWhenHidden: true,
    });

    state.player.audioOut.unlock(() => {
      console.log('audio.enable() -> unlocked');
      state.is_unlocked = true;
    });

    events.emit(EventType.AudioEnabled, void 0);
  } catch (err) {
    console.log('>>>>>>>>>> err <<<<<<<<<<');
    console.log(err);
    console.log('----------------------------------');
  }
}

export function handleRfbDisconnected() {
  state.is_connected = false;
  stopAudio();
}

export function handleRfbConnected() {
  state.is_connected = true;
  startAudio();
}

export function stopAudio() {
  console.log('audio.disable()');

  if (state.player) {
    state.player.destroy();
    state.player = null;
  }

  state.is_allowed = false;

  events.emit(EventType.AudioDisabled, void 0);
}
