/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { getCurrentSessionID } from '../functionality/session';
import { assertValue } from '../types';
import {
  events,
  $id,
  makeApiUrl,
  trimFileName,
  empty_el,
  EventType,
} from '../util';

const el = {
  panel: empty_el,
  item_list: empty_el,
  close_button: empty_el,
  heading: empty_el,
};

export function initFileDownloads() {
  el.panel = $id('dfv-downloads-panel');
  el.item_list = $id('dfv-downloadable-item-list');
  el.heading = $id('dfv-downloadable-heading');
  el.close_button = $id('dfv-downloads-panel-close-btn');

  events.on(EventType.UserEnabledFileDownloads, () => {
    el.panel.classList.remove('hidden');
    console.log('User enabled file downloads');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideDownloadsOnUserDisable();
    }
  });

  events.on(EventType.DownloadableFilesUpdated, updateDownloadableFiles);

  el.close_button.addEventListener('click', hideDownloadsOnUserDisable);

  el.panel.addEventListener('click', (e) => {
    if (e.target === el.panel) {
      hideDownloadsOnUserDisable();
    }
  });
}

function hideDownloadsOnUserDisable() {
  el.panel.classList.add('hidden');
  events.emit(EventType.UserDisabledFileDownloads, void 0);
}

function updateDownloadableFiles(files: string[]) {
  el.item_list.innerHTML = '';

  if (files.length === 0) {
    el.heading.innerHTML = 'No files to download';
    return;
  }

  const session_id = getCurrentSessionID();

  assertValue<string>(
    session_id,
    'missing session ID when creating file download links'
  );

  files
    .map((file) =>
      createDownloadItem(file, `${makeApiUrl(session_id, 'get')}?name=${file}`)
    )
    .forEach((link) => el.item_list.appendChild(link));

  el.heading.innerHTML = 'Download files in your device';
}

function createDownloadItem(text: string, href: string) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('download-item');

  const anchor = document.createElement('a');
  anchor.setAttribute('download', '');
  anchor.setAttribute('target', '_blank');
  anchor.setAttribute('href', href);
  anchor.innerHTML = trimFileName(text);

  wrapper.appendChild(anchor);

  return wrapper;
}
