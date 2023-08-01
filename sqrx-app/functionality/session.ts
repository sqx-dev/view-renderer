/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { SystemSession } from '../types';
import {
  CountryCode,
  EventType,
  events,
  getUrlParams,
  type InstanceType,
} from '../util';
import { sendToExternalExtension } from './extension-bridge';

const MAX_ERRORS = 5;

const current_session = {
  id: null as string | null,
  last_known_status: 0,
  source: 'url',
};

export function initSession() {
  events.on(EventType.ExtensionCommsInitiated, initializeSessionID);
  events.on(EventType.RfbBeginReconnect, initializeSessionID);
}

interface ExtensionSessionResponse {
  isDarkThemeEnabled?: boolean;
  success?: boolean;
  error?: unknown;
  session?: {
    session: string;
    last_known_status: number;
  };
}

function handleExtensionSessionResponse(
  resolver: (v: number | PromiseLike<number>) => void
) {
  return async function handleSessionResponse(
    response: ExtensionSessionResponse
  ) {
    if (chrome.runtime.lastError || !response) {
      events.emit(EventType.Error, {
        code: 'session_request_error',
        level: 'error',
        error: chrome.runtime.lastError,
      });
      return resolver(500);
    }

    if (typeof response.isDarkThemeEnabled === 'boolean') {
      events.emit(EventType.ThemeValueReceived, {
        value: response.isDarkThemeEnabled,
      });
    }

    if (!response.success) {
      if (response.error === 'no_session_available') {
        return resolver(410);
      }

      events.emit(EventType.Error, {
        code: 'session_request_error',
        level: 'error',
        error: response.error,
      });

      return resolver(500);
    } else if (!response.session?.session) {
      events.emit(EventType.Error, {
        code: 'unexpected_session_response',
        level: 'error',
        error: response,
      });

      return resolver(500);
    }

    current_session.id = response.session.session;
    current_session.last_known_status = response.session.last_known_status;
    current_session.source = 'extension';

    return resolver(current_session.last_known_status);
  };
}

function assertSession(
  session: typeof current_session
): asserts session is SystemSession {
  // This is a big lie, we're not actually asserting, I just no confidence
  // during this JS to TS transition that we wont see errors that blow
  // up the whole view renderer if we throw here.
  if (!session.id) {
    events.emit(EventType.AssertionError, {
      reason: 'expected session to have an id',
      data: session,
    });
  }
}

async function askExtensionForSession(
  country: CountryCode,
  type: InstanceType
) {
  let last_known_status = 0;
  let errors_received = 0;

  while (![200, 410].includes(last_known_status)) {
    last_known_status = await new Promise((resolve) => {
      sendToExternalExtension(
        {
          type: 'session-request',
          request: {
            country: country,
            type: type,
          },
        },
        handleExtensionSessionResponse(resolve)
      );
    });

    if (last_known_status === 425) {
      events.emit(EventType.ServerHighLoad, void 0);
    }

    if (last_known_status === 500) {
      errors_received += 1;
    }

    if (errors_received >= MAX_ERRORS) {
      break;
    }

    if (![200, 410].includes(last_known_status)) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (last_known_status === 200) {
    assertSession(current_session);
    if(current_session.id.endsWith("/exhausted")) {
      // if session id ends with exhausted emit error
      events.emit(EventType.Error, { code: 'quota_exhausted', level: 'fatal' });
    } else {
      events.emit(EventType.SessionIdInitialized, {
        current_session,
      });
    }
  }

  if (last_known_status === 410) {
    events.emit(EventType.Error, { code: 'session_disposed', level: 'fatal' });
  }

  if (last_known_status === 500) {
    events.emit(EventType.Error, { code: 'extension_error', level: 'fatal' });
  }
}

export async function initializeSessionID() {
  const params = getUrlParams();

  if (params.session) {
    current_session.id = params.session;
    current_session.source = 'url_paramter';
    assertSession(current_session);
    events.emit(EventType.SessionIdInitialized, { current_session });
    return;
  }

  await askExtensionForSession(
    params.country as CountryCode,
    params.type as InstanceType
  );
}

export function getCurrentSessionID() {
  return current_session.id;
}
