import type RFB from '../core/rfb';
import { EventType, events } from './util';

export interface ControlStatsMessage {
  status: string;
  code: 'stats';
  audio: boolean;
  location: string;
  ads: string;
  internet: string;
  mode: string;
  type: string;
  file_open: boolean;
}

export interface ControlExpiryMessage {
  code: 'expires_on';
  timestamp: string;
}

export interface ControlPingMessage {
  code: 'ping';
}

export interface ControlAlertMessage {
  code: 'alert';
  message: string;
}

export interface ControlAdblockerEnabled {
  code: 'adblocker_enabled';
}

export interface ControlAdblockerDisabled {
  code: 'adblocker_disabled';
}

export type ControlMessage =
  | ControlStatsMessage
  | ControlExpiryMessage
  | ControlPingMessage
  | ControlAlertMessage
  | ControlAdblockerDisabled
  | ControlAdblockerEnabled;

export type MoreCorrectRFB = RFB & {
  idleDisconnect: number;
  clipboardUp: boolean;
  clipboardDown: boolean;
  clipboardSeamless: boolean;
  preferLocalCursor: boolean;
  translateShortcuts: boolean;
};

export type RfbState = {
  connected: boolean;
  connection: MoreCorrectRFB | null;
  socket_url: string | null;
  startup_time: number;
  imitation_start_timer: number | null;
};

export interface SystemNonFatalError {
  level: 'error';
  code: 'session_request_error' | 'unexpected_session_response';
}

export interface SystemFatalError {
  level: 'fatal';
  code:
    | 'invalid_params'
    | 'rfb_cannot_reconnect'
    | 'extension_comms_support_missing'
    | 'session_disposed'
    | 'quota_exhausted'
    | 'extension_error';
}

export type SystemError = (SystemFatalError | SystemNonFatalError) & {
  error?: unknown;
};

export interface SystemSession {
  id: string;
  last_known_status: number;
  source: string;
}

export interface ConnectionState {
  online: boolean;
  connecting: boolean;
  connected: boolean;
  initialized: boolean;
  fatal_error: SystemFatalError['code'] | null;
}

// This is not an actual assertion, but it will report to the console
// when something goes wrong. It allows us to keep typescript happy and
// at the same time trace back through assertion error events to see
// what was going on. Should ultimately be replaced by more thorough error
// handling and strong types.
export function assertValue<T>(
  session: unknown,
  message: string
): asserts session is T {
  if (!session) {
    events.emit(EventType.AssertionError, {
      reason: message,
      data: session,
    });
  }
}
