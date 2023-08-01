/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { ControlStatsMessage } from '../types';
import {
  $id,
  BoxTypeDB,
  EventType,
  empty_el,
  events,
  getUrlParams,
  hideElements,
  showElements,
} from '../util';

const fullScreenONText = 'Exit Full Screen';
const fullScreenOFFText = 'Full Screen Mode';

const el = {
  panel: empty_el,
  stat_internet: empty_el,
  stat_location: empty_el,
  stat_ads: empty_el,
  stat_mode: empty_el,
  audio_toggle: empty_el as HTMLImageElement,
  copy_session_btn: empty_el,
  full_screen_btn: empty_el,
  close_controls_btn: empty_el,
  open_controls_btn: empty_el,
  modal_overlay: empty_el,
  session_time_left: empty_el,
};

const current = {
  is_initial_stats: true,
  is_adblocker_enabled: true,
  copy_session_reset_timer: null as number | null,
};

export function initDisposableBrowserControls() {
  el.stat_internet = $id('db-stats-internet');
  el.stat_location = $id('db-stats-location');
  el.stat_ads = $id('db-stats-ads');
  el.stat_mode = $id('db-stats-mode');
  el.panel = $id('db-controls');
  el.audio_toggle = $id<HTMLImageElement>('db-audio-toggle');
  el.copy_session_btn = $id('db-copy-session-btn');
  el.full_screen_btn = $id('db-full-screen-btn');
  el.close_controls_btn = $id('db-close-controls-btn');
  el.open_controls_btn = $id('db-open-controls-btn');
  el.modal_overlay = $id('modal-overlay');
  el.session_time_left = $id('db-session-time-left');

  if (document.fullscreenElement) {
    el.full_screen_btn.innerHTML = fullScreenONText;
  } else {
    el.full_screen_btn.innerHTML = fullScreenOFFText;
  }

  events.on(EventType.BeginStartup, () => {
    const params = getUrlParams();
    if (params.type !== BoxTypeDB) {
      hideElements(el.panel);
    } else {
      showElements(el.panel);
    }
  });

  events.on(EventType.ControlMessage, (data) => {
    if (data.code === 'adblocker_disabled') {
      el.stat_ads.innerHTML = 'Allowed';
      current.is_adblocker_enabled = false;
      events.emitNext(EventType.AdblockerDisabled, void 0);
    } else if (data.code === 'adblocker_enabled') {
      el.stat_ads.innerHTML = 'Blocked';
      current.is_adblocker_enabled = true;
      events.emitNext(EventType.AdblockerEnabled, void 0);
    }

    if (data.code !== 'stats' || data.status !== 'success') {
      return;
    }

    updateStatistics(data);

    // If the control socket drops but the RFB stays up, we don't
    // want to flash this control panel every time.
    if (current.is_initial_stats) {
      el.panel.classList.remove('invisible', 'hidden');
      current.is_initial_stats = false;

      // Probably should cancel this if the users is touching the panle
      setTimeout(hidePanel, 2500);
    }
  });

  events.on(EventType.SessionTimerUpdated, ({ formatted }) => {
    el.session_time_left.innerHTML = formatted;
  });

  events.on(EventType.RfbDisconnected, () => {
    el.panel.classList.add('invisible');
    current.is_initial_stats = true;
  });

  events.on(EventType.AudioEnabled, () => {
    el.audio_toggle.dataset.state = 'enabled';
    el.audio_toggle.src = 'images/icons/unmute.png';
  });

  events.on(EventType.AudioDisabled, () => {
    el.audio_toggle.dataset.state = 'disabled';
    el.audio_toggle.src = 'images/icons/mute.png';
  });

  events.on(EventType.SessionCopied, onCopySession);

  el.audio_toggle.addEventListener('click', toggleAudio);

  el.copy_session_btn.addEventListener('click', () =>
    events.emit(EventType.UserCopiedSession, void 0)
  );

  el.full_screen_btn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      el.full_screen_btn.innerHTML = fullScreenOFFText;
    } else {
      document.body.requestFullscreen();
      el.full_screen_btn.innerHTML = fullScreenONText;
    }
    hidePanel();
  });

  el.close_controls_btn.addEventListener('click', hidePanel);

  el.stat_ads.addEventListener('click', () => {
    if (current.is_adblocker_enabled) {
      events.emit(EventType.UserDisabledAdblocker, void 0);
    } else {
      events.emit(EventType.UserEnabledAdblocker, void 0);
    }
  });

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePanel();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    // just update text
    if (document.fullscreenElement) {
      el.full_screen_btn.innerHTML = fullScreenONText;
    } else {
      el.full_screen_btn.innerHTML = fullScreenOFFText;
    }
  });

  el.open_controls_btn.addEventListener('click', showPanel);
  el.modal_overlay.addEventListener('click', hidePanel);
}

function toggleAudio() {
  if (el.audio_toggle.dataset.state === 'enabled') {
    events.emit(EventType.UserDisabledAudio, void 0);
  } else {
    events.emit(EventType.UserEnabledAudio, void 0);
  }
}

function updateStatistics(stats: ControlStatsMessage) {
  current.is_adblocker_enabled = stats.ads.toLowerCase() === 'blocked';

  el.stat_internet.innerHTML = stats.internet;
  el.stat_location.innerHTML = stats.location;
  el.stat_ads.innerHTML = stats.ads;
  el.stat_mode.innerHTML = stats.mode;
}

function onCopySession() {
  el.copy_session_btn.innerHTML = 'Copied share link';

  if (current.copy_session_reset_timer) {
    clearTimeout(current.copy_session_reset_timer);
  }

  current.copy_session_reset_timer = window.setTimeout(() => {
    el.copy_session_btn.innerHTML = 'Share Disposable Browser';
  }, 1000);
}

function showPanel() {
  el.panel.classList.remove('invisible', 'hidden');
  el.modal_overlay.classList.remove('hidden');
}

function hidePanel() {
  el.panel.classList.add('hidden');
  el.modal_overlay.classList.add('hidden');
}
