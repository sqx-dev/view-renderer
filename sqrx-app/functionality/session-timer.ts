import { EventType, events } from '../util';

const state = {
  timer: 0,
  expires_on: 0,
};

export function initSessionTimer() {
  events.on(EventType.ControlMessage, (message) => {
    if (message.code === 'expires_on') {
      const expiry = Number(message.timestamp);

      if (!isNaN(expiry)) {
        state.expires_on = expiry;
        updateTimer();
      }
    }
  });
}

const MILLISECONDS_PER = {
  HOUR: 60 * 60 * 1000,
  MINUTE: 60 * 1000,
  SECOND: 1000,
};

function updateTimer() {
  window.clearInterval(state.timer);

  if (!state.expires_on) {
    return;
  }

  const end_timestamp = state.expires_on;

  state.timer = window.setInterval(() => {
    const millsecondsRemaining = Math.round(
      end_timestamp * 1000 - new Date().getTime()
    );

    const MI = 60 * 1000;
    const hours = Math.floor(millsecondsRemaining / MILLISECONDS_PER.HOUR);
    const minutes = Math.floor(
      (millsecondsRemaining % MILLISECONDS_PER.HOUR) / MILLISECONDS_PER.MINUTE
    );
    const seconds = Math.floor(
      (millsecondsRemaining % MILLISECONDS_PER.MINUTE) / MILLISECONDS_PER.SECOND
    );

    const zeroformat = (v: number) => (v <= 9 ? `0${v}` : v.toString());

    const formatted = `${zeroformat(minutes)}:${zeroformat(seconds)}`;

    if (millsecondsRemaining <= 0) {
      events.emit(EventType.SessionTimerReached, void 0);
      window.clearInterval(state.timer);
    } else {
      events.emit(EventType.SessionTimerUpdated, {
        hours,
        minutes,
        seconds,
        formatted,
      });
    }
  }, 1000);
}
