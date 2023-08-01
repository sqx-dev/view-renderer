/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { EventType, events, getFileExtension } from '../util';
import { getCurrentSessionID } from './session';

export function initFileUploading() {
  events.on(EventType.FileUploadSelected, uploadFileAsXmlHttpRequest);
}

async function uploadFileAsXmlHttpRequest(file: File) {
  const session_id = getCurrentSessionID();

  if (!session_id) {
    events.emit(EventType.FileUploadFailed, { reason: 'no_valid_session' });
    return;
  }

  if (
    !BUILD_ENV.file_upload_extension_whitelist.includes(getFileExtension(file))
  ) {
    events.emit(EventType.FileUploadFailed, { reason: 'unsupported_file' });
    return;
  }

  const xhr = new XMLHttpRequest();
  try {
    const success = await new Promise((rs, rj) => {
      events.emit(EventType.FileUploadStarted, void 0);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const pgs = Math.round((event.loaded / event.total) * 100);
          events.emit(EventType.FileUploadProgress, { value: pgs });
        }
      });

      xhr.addEventListener('loadend', () => {
        console.log('Uploaded succeeded');
        rs(xhr.readyState === 4 && xhr.status === 200);
      });

      xhr.addEventListener('error', (e) => {
        console.error('Error uploading file', e);
        rs(false);
      });

      xhr.open('POST', `https://${session_id}-sc/?name=${file.name}`, true);
      xhr.send(file);
    });

    if (!success) {
      events.emit(EventType.FileUploadFailed, { reason: 'upload_error' });
    } else {
      events.emit(EventType.FileUploadSuccess, void 0);
    }
  } catch (ex) {
    events.emit(EventType.FileUploadFailed, { reason: 'upload_error' });
  }
}
