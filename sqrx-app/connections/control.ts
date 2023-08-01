/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events } from '../util';
import { getCurrentSessionID } from '../functionality/session';
import { ControlMessage } from '../types';

const RECONNECT_TIMEOUT = 1000;
const MAXIMUM_RETRIES = 1000;

const current = {
  connection: null as WebSocket | null,
  socketUrl: null as string | null,
  forceDisconnected: false,
  retries: MAXIMUM_RETRIES,
  reconnectTimer: null as number | null,
};

export function initControlConnection() {
  events.on(EventType.RfbConnected, openControlConnection);
  events.on(EventType.RfbDisconnected, forceDisconnect);
  events.on(EventType.BridgeResponseAvailable, handleResponseForBridge);
  events.on(EventType.UserDisabledAdblocker, handleUserDisabledAdblocker);
  events.on(EventType.UserEnabledAdblocker, handleUserEnabledAdblocker);
}

export function handleUserDisabledAdblocker() {
  handleResponseForBridge({
    type: 'disable_ad_blocker',
  });
}

export function handleUserEnabledAdblocker() {
  handleResponseForBridge({
    type: 'enable_ad_blocker',
  });
}

function log(message: string, data: unknown) {
  console.log(`>>>>>>>>>> ${message} <<<<<<<<<<`);
  console.log(data);
  console.log('----------------------------------');
}

function handleResponseForBridge(response: unknown) {
  if (!current.connection) {
    console.warn('Unable to send bridge response');
    return;
  }

  current.connection.send(
    JSON.stringify({
      code: 'notify_internal',
      body: response,
    })
  );
}

function openControlConnection() {
  const session = getCurrentSessionID();

  if (!session) {
    return;
  }

  current.socketUrl = `wss://${session}-sc/ws`;

  const open_url = current.socketUrl;

  try {
    current.connection = new WebSocket(current.socketUrl);

    current.connection.onopen = (event) => {
      current.retries = 1000;
      log('Socket Connection Was Created', event);

      // this is done only for demo purposes.
      // window.sockRef = sockRef;

      events.emit(EventType.ControlConnected, open_url);
    };

    current.connection.onmessage = (event: MessageEvent<string>) => {
      const { data } = event;
      const parsedData = JSON.parse(data) as ControlMessage;

      if (parsedData.code === 'ping') {
        const payload = {
          ...parsedData,
          code: 'pong',
        };

        if (current.connection) {
          current.connection.send(JSON.stringify(payload));
        }
      } else {
        events.emit(EventType.ControlMessage, parsedData);
      }
    };

    current.connection.onclose = (event) => {
      log('Socket Connection Closed', event);

      current.connection = null;

      if (current.forceDisconnected) {
        return;
      }

      events.emit(EventType.ControlDisconnected, event);

      current.retries -= 1;

      if (current.retries >= 0) {
        current.reconnectTimer = window.setTimeout(
          () => openControlConnection(),
          RECONNECT_TIMEOUT * (MAXIMUM_RETRIES - current.retries)
        );
      } else {
        console.log(
          `Tried ${MAXIMUM_RETRIES} times to reconnect to websocket, stopping retries now.`
        );
      }
    };
  } catch (error) {
    log('Error in Socket Connection', error);
    events.emit(EventType.ControlError, error);
  }
}

function forceDisconnect() {
  current.forceDisconnected = true;

  if (current.reconnectTimer) {
    // If this socket disconnects before the RFB, a reconnect will be
    // issued. Once forceDisconnect is called by RFB failure, we should
    // prevent any further reconnect attempts
    clearTimeout(current.reconnectTimer);
    current.reconnectTimer = null;
  }

  if (!current.connection) {
    return;
  }

  current.connection.close();
}
