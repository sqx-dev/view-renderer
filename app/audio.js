/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

let player = null;
let streamUrl = null;
let canvasEl = null;
let isAllowed = false;
let isUnlocked = false;

export const initialize = (options) => {
  streamUrl = options.url;
  canvasEl = options.canvasEl;
  isAllowed = options.isAllowed;
};

export const enable = () => {
  try {
    console.log(
      `audio.enable() | allowed: ${isAllowed}, unlocked: ${isUnlocked}`
    );

    if (player) {
      return;
    }

    isAllowed = true;

    player = new JSMpeg.Player(streamUrl, {
      pauseWhenHidden: false,
    });

    player.audioOut.unlock(() => {
      console.log('audio.enable() -> unlocked');
      isUnlocked = true;
    });
  } catch (err) {
    console.log('>>>>>>>>>> err <<<<<<<<<<');
    console.log(err);
    console.log('----------------------------------');
  }
};

export const disable = () => {
  console.log('audio.disable()');

  if (player) {
    player.destroy();
    player = null;
  }

  isAllowed = false;
};

export const bindClickAndTouchEvent = (UI) => {
  if (UI.isTouchDevice) {
    document.addEventListener('touchstart', () => audio.enable(), {
      once: true,
    });

    return;
  }

  document.addEventListener('click', enable, { once: true });
};

export function initializeAudioAndConnectToWs(UI) {
  initialize({
    canvasEl: null,
    url: `wss://${UI.session}-audio`,
    isAllower: true,
  });

  bindClickAndTouchEvent(UI);
}
