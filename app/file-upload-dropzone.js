/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import UI from './ui';
import { uploader as fileUploader } from './file-upload-handler';

UI.addPropertyListener('sqxStats', updateUI);
UI.addPropertyListener('connected', updateUI);

fileUploader.onStateChange(uploadStateChange);

const el = {
  button: null,
  dropzone: null,
  progress: null,
  body: null,
};

export function initializeUploadDropzone() {
  console.log('Initializing upload dropzone');
  el.dropzone = document.querySelector('.upload-zone');
  el.progress = document.querySelector('.upload-zone-progress');
  el.button = document.querySelector('.upload-zone-button');
  el.body = document.body;

  el.button.addEventListener('click', fileUploader.activateFileModal);

  el.body.addEventListener('dragenter', fileDragHandler);
  el.body.addEventListener('dragover', fileDragHandler);
  el.body.addEventListener('dragleave', fileDragHandler);
  el.body.addEventListener('drop', fileDropHandler);
  el.body.addEventListener('dragdrop', fileDropHandler);
}

function uploadStateChange(value) {
  const { state } = value;

  if (state) {
    el.body.classList.remove('activate-upload', 'active');
  } else {
    updateUI();
  }
}

function fileDragHandler(event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.type === 'dragenter') {
    el.body.classList.add('activate-upload');
    el.body.classList.remove('active');
    el.dropzone.classList.add('active');
  } else if (event.type === 'dragleave') {
    el.body.classList.remove('activate-upload');
    el.dropzone.classList.remove('active');
  }
}

function updateUI() {
  if (UI.connected !== true) {
    el.body.classList.remove('activate-upload', 'active');
    return;
  }

  if (UI.sqxStats && UI.sqxStats.file_open === false) {
    el.body.classList.add('activate-upload', 'active');
  } else {
    el.body.classList.remove('activate-upload', 'active');
  }
}

function fileDropHandler(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!fileUploader.isAvailable()) {
    console.warn('Uploader is not available');
    return;
  }

  if (event.dataTransfer.files && event.dataTransfer.files[0]) {
    console.log('File was dropped!', event);
    console.log(event.dataTransfer.files[0]);
    fileUploader.uploadFileAsXmlHttpRequest(event.dataTransfer.files[0]);
  }
}
