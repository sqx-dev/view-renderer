/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

// This is designed to be a bridge betwen the internal and external extensions

import { BoxTypeDB, EventType, events, getUrlParams } from '../util';

const POTENTIAL_EXTENSIONS = [
  'kapjaoifikajdcdehfdlmojlepfpkpoe', // Modern version
  'jeadabamgcpdnplkcjhlmbhldalpbpfk', // Old version released prior to chrome store
];

const state = {
  extension_id: '',
};

export function initExtensionBridge() {
  const params = getUrlParams();
  events.on(EventType.BeginStartup, handleBeginStartup);

  if (params.type === BoxTypeDB) {
    events.on(EventType.ControlMessage, handleControlMessage);
    return;
  }
}

// Overloads to differentiate between Promise-based and callback based
export function sendToExternalExtension<R = unknown>(
  message: unknown
): Promise<R>;
export function sendToExternalExtension<R = unknown>(
  message: unknown,
  callback: (v: R) => void | Promise<void>
): void;
export function sendToExternalExtension(
  message: unknown,
  callback?: (v: unknown) => void
): void | Promise<void> {
  if (callback) {
    chrome.runtime.sendMessage(state.extension_id, message, callback);
  } else {
    return chrome.runtime.sendMessage(state.extension_id, message);
  }
}

async function handleBeginStartup() {
  if (!window.chrome?.runtime) {
    events.emit(EventType.Error, {
      code: 'extension_comms_support_missing',
      level: 'fatal',
    });
    return;
  }

  let extension_index = 0;

  while (extension_index < POTENTIAL_EXTENSIONS.length) {
    const ext_id = POTENTIAL_EXTENSIONS[extension_index];
    const result = await attemptComms(ext_id);

    if (result) {
      state.extension_id = result;
      break;
    }

    extension_index++;
  }

  if (state.extension_id) {
    events.emitNext(EventType.ExtensionCommsInitiated, void 0);
  } else {
    events.emitNext(EventType.Error, {
      code: 'extension_comms_support_missing',
      level: 'fatal',
    });
  }
}

async function attemptComms(id: string): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    let waiting_response = true;

    // This is a bit of a hack because the external connection might
    // not return, but if it doesnt fail more or less immediately, we
    // consider it to be "connectable"
    const timer = setTimeout(() => {
      waiting_response = false;
      resolve(id);
    }, 100);

    chrome.runtime.sendMessage(id, { type: 'comms-check' }, (e) => {
      if (!waiting_response) {
        return;
      }

      clearTimeout(timer);

      if (chrome.runtime.lastError) {
        return resolve(null);
      }
      resolve(id);
    });
  });
}

export function sendBridgeResponse(message: unknown) {
  return events.emit(EventType.BridgeResponseAvailable, {
    type: 'enable_ad_blocker',
  });
}

export function handleControlMessage(message: unknown) {
  if (
    !message ||
    typeof message !== 'object' ||
    Array.isArray(message) ||
    !('code' in message) ||
    typeof message.code !== 'string'
  ) {
    return;
  }

  switch (message.code) {
    case 'ping_from_internal':
      return console.log('Got internal ping');
    case 'db_requests_dfv_start':
      return handleDbRequestsDfvStart();
    case 'dfv_file_uploaded':
      return handleDfvFileUploaded();
  }
}

export async function handleDfvFileUploaded() {
  try {
    await new Promise((resolve, reject) => {
      sendToExternalExtension(
        {
          type: 'focus-dfv',
        },
        (ev) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          }

          resolve(void 0);
        }
      );
    });
  } catch (exception) {
    console.error('Exception sending to extension', exception);
  }
}

export async function handleDbRequestsDfvStart() {
  try {
    const response = await new Promise((resolve, reject) => {
      sendToExternalExtension(
        {
          type: 'dfv-start-request',
        },
        resolve
      );
    });

    events.emit(EventType.BridgeResponseAvailable, {
      type: 'dfv_start_response',
      response,
    });
  } catch (exception) {
    console.error('Exception sending to extension', exception);
  }
}
