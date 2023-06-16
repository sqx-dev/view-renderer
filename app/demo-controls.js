/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { logoutUserFromSquareX, terminateSession } from './api';
import { uploader as FileUploader } from './file-upload-handler';
import { loginWithGoogle, logoutUserFromFirebase } from './firebaseAuthUtils';
import { togglePreventNavigationEvent } from './prevent-navigation';
import UI from './ui';

UI.addPropertyListener('connected', updateContainer);
UI.addPropertyListener('isLoggedIn', updateButtons);
UI.addPropertyListener('finalSessionTimestamp', updateTimer);
UI.addPropertyListener('authInitialized', updateButtons);
UI.addPropertyListener('terminationToken', updateButtons);

FileUploader.onStateChange(uploadStateChange);

const el = {
  noauth_area: null,
  google_button: null,
  logout_button: null,
  terminate_button: null,
  terminate_loader: null,
  upload_button: null,
  upload_area: null,
  upload_progress: null,
  upload_progress_text: null,
  auth_loader: null,
  container: null,
};

export function initializeDemoControls() {
  el.noauth_area = document.getElementById('demo-ctl-no-auth-area');
  el.google_button = document.querySelector('#google-sso');
  el.logout_button = document.querySelector('#logout-button');
  el.terminate_button = document.querySelector('#terminate-session');
  el.terminate_loader = document.querySelector('#termination-loader');
  el.auth_loader = document.querySelector('#auth-loader');
  el.container = document.getElementById('session-info-box');
  el.upload_button = document.getElementById('demo-ctl-upload-files');
  el.upload_area = document.getElementById('demo-ctl-upload-progress-area');
  el.upload_progress = document.getElementById('demo-ctl-upload-progress-bar');
  el.upload_progress_text = document.getElementById(
    'demo-ctl-upload-progress-text'
  );

  el.google_button?.addEventListener('click', async () => {
    el.google_button.setAttribute('disabled', 'disabled');
    await loginWithGoogle();
  });

  el.terminate_button?.addEventListener('click', async () => {
    el.terminate_button.classList.add('hidden');
    el.terminate_loader.classList.remove('hidden');
    el.terminate_loader.innerHTML = 'Terminating...';
    const result = await terminateSession(UI);
    if (!result.success) {
      el.terminate_button.classList.remove('hidden');
      el.terminate_loader.classList.add('hidden');
    }
  });

  el.upload_button?.addEventListener('click', FileUploader.activateFileModal);

  el.logout_button?.addEventListener('click', async () => {
    el.logout_button.setAttribute('disabled', 'disabled');
    try {
      await Promise.allSettled([
        terminateSession(UI),
        logoutUserFromFirebase(),
        logoutUserFromSquareX(),
      ]);
      togglePreventNavigationEvent(false);
      window.location.href = process.env.DEMO_ORIGIN ?? 'https://malware.rip';
    } catch (exception) {
      console.error('Unable to log user out', exception);
    }
  });

  updateButtons();
  updateContainer();
  updateTimer();
}

function uploadStateChange(value) {
  const { state, progress_value } = value;
  if (['uploading', 'progress'].includes(state)) {
    el.upload_button.classList.add('_util-hidden');
    el.upload_area.classList.remove('_util-hidden');

    if (state === 'progress' && progress_value !== undefined) {
      el.upload_progress_text.innerHTML = `Uploading: ${progress_value}%`;
      el.upload_progress.setAttribute('value', progress_value);
    } else {
      el.upload_progress_text.innerHTML = 'Uploading...';
      el.upload_progress.removeAttribute('value');
    }
  } else {
    el.upload_button.classList.remove('_util-hidden');
    el.upload_area.classList.add('_util-hidden');
  }
}

function updateButtons() {
  if (UI.terminationToken) {
    el.terminate_loader?.classList.add('hidden');
    el.terminate_button?.classList.remove('hidden');
  } else {
    el.terminate_loader?.classList.remove('hidden');
    el.terminate_button?.classList.add('hidden');
  }

  if (!UI.authInitialized) {
    el.noauth_area?.classList.add('_util-hidden');
    el.logout_button?.classList.add('hidden');
    el.auth_loader?.classList.remove('hidden');
    return;
  } else {
    el.auth_loader?.classList.add('hidden');
  }

  if (UI.isLoggedIn) {
    el.noauth_area?.classList.add('_util-hidden');
    el.logout_button?.classList.remove('hidden');
  } else {
    el.noauth_area?.classList.remove('_util-hidden');
    el.logout_button?.classList.add('hidden');
  }
}

function updateContainer() {
  if (UI.connected) {
    el.container?.classList.remove('hidden');
  } else {
    el.container?.classList.add('hidden');
  }
}

function updateTimer() {
  window.clearInterval(UI.timeRef);

  if (!UI.finalSessionTimestamp) {
    return;
  }

  const end_timestamp = UI.finalSessionTimestamp;

  UI.timeRef = window.setInterval(() => {
    const millsecondsRemaining = Math.round(
      end_timestamp * 1000 - new Date().getTime()
    );

    const devisor = 60 * 1000;
    const minutesLeft = Math.floor(millsecondsRemaining / devisor);
    const secondsLeft = Math.floor(
      Math.ceil(millsecondsRemaining % devisor) / 1000
    );
    const minutesInDiv = minutesLeft <= 9 ? `0${minutesLeft}` : minutesLeft;
    const secondsInDiv = secondsLeft <= 9 ? `0${secondsLeft}` : secondsLeft;
    const time_left = document.querySelector('#time-left');

    if (millsecondsRemaining <= 0) {
      window.clearInterval(UI.timeRef);
      time_left.innerHTML = `--:--`;
      UI.sessionDisposed = true;
      UI.finalSessionTimestamp = null;
      UI.session = null;
      UI.disconnect();
    } else {
      time_left.innerHTML = ` ${minutesInDiv}:${secondsInDiv}`;
      if (millsecondsRemaining <= 30000) {
        // Make the background red when there's less than 30 seconds remaining
        time_left.classList.add('urgent');
      }
    }
  }, 1000);
}
