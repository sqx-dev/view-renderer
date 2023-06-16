/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import './ui';
import './demo-controls';
import './LocalConnection';
import './tab-title';
import './disposed-session-countdown';

import { initializeAuth } from './initialize-auth';
import { initializeDemoControls } from './demo-controls';
import { initializeUploadDropzone } from './file-upload-dropzone';

initializeAuth();
initializeDemoControls();
initializeUploadDropzone();
