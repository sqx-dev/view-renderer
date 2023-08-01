/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { $id, EventType, empty_el, events } from '../util';

const el = {
  file_input: empty_el,
};

export function initFileInput() {
  el.file_input = $id('dfv-file-input') as HTMLInputElement;
  el.file_input.setAttribute(
    'accept',
    BUILD_ENV.file_upload_extension_whitelist.join(',')
  );

  events.on(EventType.UserEnabledFileUpload, () => el.file_input.click());

  el.file_input.addEventListener('change', () => {
    const input = el.file_input as HTMLInputElement;
    if (input.files && input.files[0]) {
      events.emit(EventType.FileUploadSelected, input.files[0]);
    }
    input.value = '';
  });
}
