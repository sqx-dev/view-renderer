/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { ControlMessage, SystemError } from '../types';
import {
  events,
  $id,
  hideElements,
  showElements,
  BoxTypeDFV,
  getUrlParams,
  EventType,
  empty_el,
} from '../util';

const el = {
  dropzone: empty_el,
  upload_btn: empty_el,
};

export function initFileDropzone() {
  el.dropzone = $id('dfv-upload-zone');
  // el.upload_btn = $id('dfv-upload-zone-btn');

  events.on(EventType.ControlMessage, handleControlMessage);
  events.on(EventType.FileUploadStarted, handleFileUploadStarted);
  events.on(EventType.Offline, handleOffline);
  events.on(EventType.Error, handleError);
  events.on(EventType.RfbDisconnected, handleRfbDisconnected);

  el.dropzone.addEventListener('click', () => {
    events.emit(EventType.UserEnabledFileUpload, void 0);
  });

  // el.upload_btn.addEventListener('click', () => {
  //   events.emit(EventType.UserEnabledFileUpload, void 0);
  // });

  const body = document.body;

  body.addEventListener('dragenter', fileDragHandler);
  body.addEventListener('dragover', fileDragHandler);
  body.addEventListener('dragleave', fileDragHandler);
  body.addEventListener('drop', fileDropHanlder);
  body.addEventListener('dragdrop', (e) => fileDropHanlder(e as DragEvent));
}

function deinitFileDropzone() {
  events.off(EventType.ControlMessage, handleControlMessage);
  events.off(EventType.FileUploadStarted, handleFileUploadStarted);
  events.off(EventType.Offline, handleOffline);
  events.off(EventType.Error, handleError);
  events.off(EventType.RfbDisconnected, handleRfbDisconnected);
}

function handleRfbDisconnected() {
  hideElements(el.dropzone);
}

function handleError(error: SystemError) {
  if (error.level === 'fatal') {
    deinitFileDropzone();
    hideElements(el.dropzone);
  }
}

function handleOffline() {
  deinitFileDropzone();
  hideElements(el.dropzone);
}

function handleFileUploadStarted() {
  hideElements(el.dropzone);
}

function handleControlMessage(data: ControlMessage) {
  if (data.code === 'alert' && data.message === 'opening_file') {
    hideElements(el.dropzone);
  }

  if (data.code !== 'stats' || data.status !== 'success') {
    return;
  }

  const url_params = getUrlParams();

  if (url_params.type !== BoxTypeDFV) {
    return hideElements(el.dropzone);
  }

  if (!data.file_open) {
    showElements(el.dropzone);
  } else {
    hideElements(el.dropzone);
  }
}

function fileDragHandler(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  if (event.type === 'dragenter') {
    el.dropzone.classList.add('active');
  } else if (event.type === 'dragleave') {
    el.dropzone.classList.remove('active');
  }
}

function fileDropHanlder(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  const singleFile = event.dataTransfer?.files[0];
  const fileExtension = singleFile?.name.split('.').slice(-1)[0];

  if (singleFile && fileExtension) {
    if (
      BUILD_ENV.file_upload_extension_whitelist.includes(`.${fileExtension}`)
    ) {
      events.emit(EventType.FileUploadSelected, singleFile);
    } else {
      events.emit(EventType.FileUploadFailed, { reason: 'unsupported_file' });
    }
  }
}
