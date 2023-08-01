/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events, makeApiUrl } from '../util';
import { getCurrentSessionID } from './session';

export function initFetchDownloadableFiles() {
  events.on(EventType.UserEnabledFileDownloads, fetchDownloadableFiles);
}

async function fetchDownloadableFiles() {
  const session_id = getCurrentSessionID();

  if (!session_id) {
    return events.emit(EventType.FetchDownloadableFilesFailed, {
      reason: 'missing_session_id',
    });
  }

  const api_url = makeApiUrl(session_id, 'list');

  try {
    const body = await fetch(api_url);
    const response = await body.json();

    if (!response || !Array.isArray(response.files)) {
      throw new Error('Failed To fetch files list');
    }

    const { files } = response;

    if (!Array.isArray(files)) {
      throw new Error('Invalid file list from server');
    }

    events.emit(EventType.DownloadableFilesUpdated, files);
  } catch (error) {
    console.error(error);

    const outbound_error =
      error instanceof Error ? error : new Error(JSON.stringify(error));

    events.emit(EventType.FetchDownloadableFilesFailed, {
      reason: outbound_error,
    });
  }
}
