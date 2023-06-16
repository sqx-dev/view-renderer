/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import { onExternalNotificationMsg } from './dom-helpers';
import UI from './ui';

const MAX_TRIES = 1000;
const TIMEOUT = 1000;

let retries = MAX_TRIES;

UI.addPropertyListener('connected', () => {
  if (UI.connected && UI.session) {
    connectExtWs();
  }
});

export const connectExtWs = () => {
  try {
    if (!UI.shouldRetryConnection) {
      return;
    }

    const sockRef = new WebSocket(`wss://${UI.session}-sc/ws`);

    sockRef.onopen = (event) => {
      retries = MAX_TRIES;

      console.log('>>>>>>>>>> Socket Connection Was Created <<<<<<<<<<');
      console.log(event);
      console.log('----------------------------------');

      // this is done only for demo purposes.
      window.sockRef = sockRef;
    };

    sockRef.onmessage = (event) => {
      const { data } = event;
      const parsedData = JSON.parse(data);

      if (parsedData.code === 'ping') {
        const payload = {
          ...parsedData,
          code: 'pong',
        };

        sockRef.send(JSON.stringify(payload));
      } else if (parsedData.code === 'expires_on') {
        const ts = Number(parsedData.timestamp);

        if (isNaN(ts)) {
          console.error('Bad timestamp from server!');
          return;
        }

        UI.finalSessionTimestamp = ts;
        // setTime(UI);
      } else if (parsedData.code === 'alert') {
        if (parsedData.message) {
          const textMap = {
            opening_link: 'SquareX Is Opening A Link',
            opening_file: 'SquareX Is Opening A File',
            unsupported_file: 'Unsupported File Type',
          };

          onExternalNotificationMsg(textMap[parsedData.message.toLowerCase()]);
        }
      } else if (parsedData.status === 'success') {
        UI.sqxStats = parsedData;
      }
    };
    sockRef.onclose = (event) => {
      console.log('>>>>>>>>>> Socket Connection Closed <<<<<<<<<<');
      console.log(event);
      console.log('----------------------------------');

      if (UI.sessionDisposed) {
        console.log('Session is disposed connection will not be retried');
        return;
      }

      retries -= 1;
      if (retries >= 0) {
        setTimeout(() => connectExtWs(), TIMEOUT * (MAX_TRIES - retries));
      } else {
        console.log(
          `Tried ${MAX_TRIES} times to reconnect to websocket, stopping retries now.`
        );
      }
    };
  } catch (error) {
    console.log('>>>>>>>>>> Error in Socket Connection <<<<<<<<<<');
    console.log(error);
    console.log('----------------------------------');
  }
};
