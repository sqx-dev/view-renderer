/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import UI from './ui';
class FileUploader {
  constructor() {
    this.stateListeners = [];
    this.uploader = document.getElementById('uploader');
    this.onStateChange = this.onStateChange.bind(this);
    this.setState = this.setState.bind(this);
    this.activateFileModal = this.activateFileModal.bind(this);

    this.uploader.addEventListener('change', (event) =>
      this.uploadInputChange(event)
    );
  }

  isAvailable() {
    return (
      this.uploader instanceof HTMLInputElement &&
      document.body.contains(this.uploader) &&
      UI.session
    );
  }

  onStateChange(listener) {
    this.stateListeners.push(listener);
  }

  setState(value) {
    this.stateListeners.forEach((v) => v(value));
  }

  activateFileModal() {
    this.uploader.click();
  }

  uploadInputChange() {
    if (this.uploader.files && this.uploader.files[0]) {
      this.uploadFileAsXmlHttpRequest(this.uploader.files[0]);
    }
  }

  uploadFileAsXmlHttpRequest(file) {
    const xhr = new XMLHttpRequest();
    return new Promise((rs, rj) => {
      this.setState({ state: 'uploading' });
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const pgs = Math.round((event.loaded / event.total) * 100);
          this.setState({ state: 'progress', progress_value: pgs });
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

      xhr.open('POST', `https://${UI.session}-sc/?name=${file.name}`, true);
      xhr.send(file);
    })
      .then(() => {
        this.setState({ state: 'last_succeeded' });
      })
      .catch(() => {
        this.setState({ state: 'last_failed' });
      });
  }
}

export const uploader = new FileUploader();
