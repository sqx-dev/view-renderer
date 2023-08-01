/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events, getSetting } from '../util';
import RFB from '../../core/rfb.js';
import { supportsBinaryClipboard } from '../../core/util/browser.js';
import { MouseButtonMapper, XVNC_BUTTONS } from '../../core/mousebuttonmapper';
import { RfbState, MoreCorrectRFB, SystemSession } from '../types';

// We're actually faking some load time because it loads so quick...
const ACCEPTABLE_LOAD_TIME = 1000;

const current_rfb: RfbState = {
  connected: false,
  connection: null,
  socket_url: null,
  startup_time: 0,
  imitation_start_timer: null,
};

export function initRfbConnection() {
  current_rfb.startup_time = new Date().getTime();
  events.on(EventType.SessionIdInitialized, onSessionInitialized);
  events.on(EventType.Offline, handleOffline);
}

function handleOffline() {
  if (current_rfb.connected && current_rfb.connection) {
    current_rfb.connection.disconnect();
  }
}

function initMouseButtonMapper() {
  const mouseButtonMapper = new MouseButtonMapper();

  mouseButtonMapper.set(0, XVNC_BUTTONS.LEFT_BUTTON);
  mouseButtonMapper.set(1, XVNC_BUTTONS.MIDDLE_BUTTON);
  mouseButtonMapper.set(2, XVNC_BUTTONS.RIGHT_BUTTON);
  mouseButtonMapper.set(3, XVNC_BUTTONS.BACK_BUTTON);
  mouseButtonMapper.set(4, XVNC_BUTTONS.FORWARD_BUTTON);

  return mouseButtonMapper;
}

function onSessionInitialized({
  current_session,
}: {
  current_session: SystemSession;
}) {
  current_rfb.socket_url = `wss://${current_session.id}`;

  current_rfb.connection = new RFB(
    document.getElementById('noVNC_container'),
    document.getElementById('noVNC_keyboardinput'),
    current_rfb.socket_url,
    {
      shared: getSetting('shared'),
      repeaterID: getSetting('repeaterID'),
      credentials: { password: undefined },
    }
  ) as MoreCorrectRFB;

  current_rfb.connection.addEventListener('connect', () => {
    current_rfb.connected = true;

    const init_time = new Date().getTime();
    const imitation_start_time =
      current_rfb.startup_time + ACCEPTABLE_LOAD_TIME;
    const remaining_time = imitation_start_time - init_time;

    /* FAKING A LONGER LOAD TIME */
    if (remaining_time > 0) {
      current_rfb.imitation_start_timer = window.setTimeout(() => {
        current_rfb.imitation_start_timer = null;
        events.emit(EventType.RfbConnected, void 0);
        // Do this last because it can only be used on rendered elements
        window.setTimeout(() => current_rfb.connection?.focus(), 10);
      }, remaining_time);
      return;
    }

    if (current_rfb.imitation_start_timer) {
      window.clearTimeout(current_rfb.imitation_start_timer);
      current_rfb.imitation_start_timer = null;
    }
    /* END FAKING A LONGER LOAD TIME */

    events.emit(EventType.RfbConnected, void 0);
    // Do this last because it can only be used on rendered elements
    window.setTimeout(() => current_rfb.connection?.focus(), 10);
  });

  current_rfb.connection.addEventListener('disconnect', () => {
    current_rfb.connected = false;
    current_rfb.connection = null;

    if (current_rfb.imitation_start_timer) {
      clearTimeout(current_rfb.imitation_start_timer);
    }

    events.emit(EventType.RfbDisconnected, void 0);
  });

  current_rfb.connection.translateShortcuts = getSetting('translate_shortcuts');
  current_rfb.connection.clipViewport = getSetting('view_clip');
  current_rfb.connection.scaleViewport = getSetting('resize') === 'scale';
  current_rfb.connection.resizeSession = getSetting('resize') === 'remote';
  current_rfb.connection.qualityLevel = getSetting('quality');
  current_rfb.connection.dynamicQualityMin = getSetting('dynamic_quality_min');
  current_rfb.connection.dynamicQualityMax = getSetting('dynamic_quality_max');
  current_rfb.connection.jpegVideoQuality = getSetting('jpeg_video_quality');
  current_rfb.connection.webpVideoQuality = getSetting('webp_video_quality');
  current_rfb.connection.videoArea = getSetting('video_area');
  current_rfb.connection.videoTime = getSetting('video_time');
  current_rfb.connection.videoOutTime = getSetting('video_out_time');
  current_rfb.connection.videoScaling = getSetting('video_scaling');
  current_rfb.connection.treatLossless = getSetting('treat_lossless');
  current_rfb.connection.maxVideoResolutionX = getSetting(
    'max_video_resolution_x'
  );
  current_rfb.connection.maxVideoResolutionY = getSetting(
    'max_video_resolution_y'
  );
  current_rfb.connection.frameRate = getSetting('framerate');
  current_rfb.connection.compressionLevel = getSetting('compression');
  current_rfb.connection.showDotCursor = getSetting('show_dot');
  current_rfb.connection.idleDisconnect = getSetting('idle_disconnect');
  current_rfb.connection.pointerRelative = getSetting('pointer_relative');
  current_rfb.connection.videoQuality = getSetting('video_quality');
  current_rfb.connection.antiAliasing = getSetting('anti_aliasing');
  current_rfb.connection.clipboardUp = getSetting('clipboard_up');
  current_rfb.connection.clipboardDown = getSetting('clipboard_down');
  current_rfb.connection.clipboardSeamless = getSetting('clipboard_seamless');
  current_rfb.connection.keyboard.enableIME = getSetting('enable_ime');
  current_rfb.connection.clipboardBinary =
    supportsBinaryClipboard() && current_rfb.connection.clipboardSeamless;
  current_rfb.connection.enableWebRTC = getSetting('enable_webrtc');
  current_rfb.connection.enableHiDpi = getSetting('enable_hidpi');
  current_rfb.connection.mouseButtonMapper = initMouseButtonMapper();

  if (current_rfb.connection.videoQuality === 5) {
    current_rfb.connection.enableQOI = true;
  }

  //Only explicitly request permission to clipboard on browsers that support binary clipboard access
  if (supportsBinaryClipboard()) {
    // explicitly request permission to the clipboard
    navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
  }

  // KASM-960 workaround, disable seamless on Safari
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    current_rfb.connection.clipboardSeamless = false;
  }

  current_rfb.connection.preferLocalCursor = true;
  current_rfb.connection.enableWebP = getSetting('enable_webp');
}
