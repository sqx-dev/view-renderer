/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import {
  ConnectionState,
  ControlMessage,
  SystemError,
  SystemSession,
} from './types';

export const empty_el = document.createElement('div') as HTMLElement;

export enum EventType {
  Error = 'error',
  AssertionError = 'assertion_error',
  BeginStartup = 'begin_startup',
  RfbBeginReconnect = 'rfb_begin_reconnect',
  ValidatedParams = 'validated_params',
  AudioEnabled = 'audio_enabled',
  AudioDisabled = 'audio_disabled',
  ControlConnected = 'control_connected',
  ControlMessage = 'control_message',
  ControlDisconnected = 'control_disconnected',
  ControlError = 'control_error',
  RfbConnected = 'rfb_connected',
  RfbDisconnected = 'rfb_disconnected',
  SessionCopied = 'session_copied',
  FetchDownloadableFilesFailed = 'fetch_downloadable_files_failed',
  DownloadableFilesUpdated = 'downloadable_files_updated',
  FileUploadStarted = 'file_upload_started',
  FileUploadProgress = 'file_upload_progress',
  FileUploadFailed = 'file_upload_failed',
  FileUploadSuccess = 'file_upload_success',
  Online = 'online',
  Offline = 'offline',
  ThemeValueReceived = 'theme_value_received',
  ServerHighLoad = 'server_high_load',
  SessionIdInitialized = 'session_id_initialized',
  UserCopiedSession = 'user_copied_session',
  UserDisabledAudio = 'user_disabled_audio',
  UserEnabledAudio = 'user_enabled_audio',
  UserEnabledFileDownloads = 'user_enabled_file_downloads',
  UserEnabledFileUpload = 'user_enabled_file_upload',
  UserDisabledFileDownloads = 'user_disabled_file_downloads',
  FileUploadSelected = 'file_upload_selected',
  ConnectionStateChange = 'connection_state_change',
  SessionTimerUpdated = 'session_timer_updated',
  SessionTimerReached = 'session_timer_reached',
  BridgeResponseAvailable = 'bridge_response_available',
  UserDisabledAdblocker = 'user_disabled_adblocker',
  UserEnabledAdblocker = 'user_enabled_adblocker',
  AdblockerEnabled = 'adblocker_enabled',
  AdblockerDisabled = 'adblocker_disabled',
  ExtensionCommsInitiated = 'extension_comms_initiated',
}

export type EventDataType = {
  [EventType.Error]: SystemError;
  [EventType.AssertionError]: { reason: string; data?: unknown };
  [EventType.BeginStartup]: void;
  [EventType.RfbBeginReconnect]: void;
  [EventType.ValidatedParams]: { params: UrlParams };
  [EventType.AudioEnabled]: void;
  [EventType.AudioDisabled]: void;
  [EventType.ControlConnected]: string;
  [EventType.ControlMessage]: ControlMessage;
  [EventType.ControlDisconnected]: CloseEvent;
  [EventType.ControlError]: unknown;
  [EventType.RfbConnected]: void;
  [EventType.RfbDisconnected]: void;
  [EventType.SessionCopied]: { url: string };
  [EventType.FetchDownloadableFilesFailed]: { reason: string | Error };
  [EventType.DownloadableFilesUpdated]: string[];
  [EventType.FileUploadStarted]: void;
  [EventType.FileUploadProgress]: { value: number };
  [EventType.FileUploadFailed]: { reason: string | Error };
  [EventType.FileUploadSuccess]: void;
  [EventType.Online]: void;
  [EventType.Offline]: void;
  [EventType.ThemeValueReceived]: { value: boolean };
  [EventType.ServerHighLoad]: void;
  [EventType.SessionIdInitialized]: { current_session: SystemSession };
  [EventType.UserCopiedSession]: void;
  [EventType.UserDisabledAudio]: void;
  [EventType.UserEnabledAudio]: void;
  [EventType.UserEnabledFileDownloads]: void;
  [EventType.UserEnabledFileUpload]: void;
  [EventType.UserDisabledFileDownloads]: void;
  [EventType.FileUploadSelected]: File;
  [EventType.ConnectionStateChange]: ConnectionState;
  [EventType.SessionTimerUpdated]: {
    minutes: number;
    seconds: number;
    hours: number;
    formatted: string;
  };
  [EventType.SessionTimerReached]: void;
  [EventType.BridgeResponseAvailable]: unknown;
  [EventType.UserDisabledAdblocker]: void;
  [EventType.UserEnabledAdblocker]: void;
  [EventType.AdblockerDisabled]: void;
  [EventType.AdblockerEnabled]: void;
  [EventType.ExtensionCommsInitiated]: void;
};

export type EventEmitterListener<K, V = unknown> = (
  data: V,
  eventType: K
) => void;

class EventEmitter<ET extends { [K: string]: unknown } = EventDataType> {
  private _listeners: Partial<{
    [K in keyof ET]: EventEmitterListener<K, ET[K]>[];
  }> = {};

  constructor() {
    this._listeners = {};
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);
    return;
  }

  on<K extends keyof ET>(event: K, handler: EventEmitterListener<K, ET[K]>) {
    const current_listeners = this._listeners[event] ?? [];
    const current_index = current_listeners.indexOf(handler);

    if (current_index !== -1) {
      return;
    }

    current_listeners.push(handler);
    this._listeners[event] = current_listeners;
  }

  off<K extends keyof ET>(event: K, handler: EventEmitterListener<K, ET[K]>) {
    window.queueMicrotask(() => {
      const current_listeners = this._listeners[event] ?? [];
      const current_index = current_listeners.indexOf(handler);

      if (current_index === -1) {
        return;
      }

      current_listeners.splice(current_index, 1);
      this._listeners[event] = current_listeners;
    });
  }

  emit<K extends keyof ET>(event: K, data: ET[K]) {
    if (event !== EventType.SessionTimerUpdated) {
      console.log('EMITTING EVENT', event, data, this._listeners[event]);
    }

    (this._listeners[event] ?? []).forEach((l) => l(data, event));
  }

  emitNext<K extends keyof ET>(event: K, data: ET[K]) {
    window.queueMicrotask(() => {
      if (event !== EventType.SessionTimerUpdated) {
        console.log('EMITTING EVENT', event, data, this._listeners[event]);
      }

      (this._listeners[event] ?? []).forEach((l) => l(data, event));
    });
  }
}

export const events = new EventEmitter();

/**
 * Shorthand for `document.getElementById`
 * @param {string} id The ID of the element to select
 * @returns The HTML element with the matching ID, or null
 */
export function $id<T extends HTMLElement = HTMLElement>(id: string) {
  // Sorry typescript :(
  return document.getElementById(id) as T;
}
/**
 * Shorthand for `document.getElementsByTagName`
 * @param {string} id The tag name of an element
 * @returns An HTMLCollection of the elements with a matching tag name
 */
export function $tagName(tagName: string) {
  return document.getElementsByTagName(tagName);
}
/**
 * Shorthand for `document.getElementsByClassName`
 * @param {string} id The class of an element
 * @returns An HTMLCollection of the elements with a matching class
 */
export function $className(className: string) {
  return document.getElementsByClassName(className);
}
/**
 * Shorthand for `document.querySelector`
 * @param {string} id A standard query selector
 * @returns The first HTML element that matches the selector, or null
 */
export function $query(query: string) {
  return document.querySelector(query);
}
/**
 * Shorthand for `document.querySelectorAll`
 * @param {string} id A standard query selector
 * @returns A NodeList of elements that match the selector
 */
export function $queryAll(query: string) {
  return document.querySelectorAll(query);
}

export function showElements(...el: Element[]) {
  el.forEach((e) => e && e.classList.remove('_hidden'));
}

export function hideElements(...el: Element[]) {
  el.forEach((e) => e && e.classList.add('_hidden'));
}

export const defaultSettings = {
  view_clip: false,
  quality: 6,
  dynamic_quality_min: 4,
  dynamic_quality_max: 9,
  translate_shortcuts: true,
  treat_lossless: 7,
  jpeg_video_quality: 7,
  webp_video_quality: 7,
  video_quality: 2,
  anti_aliasing: 0,
  video_area: 65,
  video_time: 5,
  video_out_time: 3,
  video_scaling: 0,
  max_video_resolution_x: 960,
  max_video_resolution_y: 540,
  framerate: 24,
  compression: 2,
  shared: true,
  view_only: false,
  show_dot: false,
  path: 'websockify',
  repeaterID: '',
  reconnect: false,
  reconnect_delay: 5000,
  idle_disconnect: 20,
  prefer_local_cursor: true,
  toggle_control_panel: false,
  enable_perf_stats: false,
  virtual_keyboard_visible: false,
  enable_ime: false,
  enable_webrtc: false,
  enable_hidpi: false,
  clipboard_up: true,
  clipboard_down: true,
  clipboard_seamless: true,
  enable_webp: true,
  resize: 'remote',
  pointer_relative: false,
};

const currentSettings = { ...defaultSettings };

export function getSetting<K extends keyof typeof defaultSettings>(
  name: K
): (typeof defaultSettings)[K] {
  return currentSettings[name];
}

export const codeCountryMap = {
  SG: 'Singapore',
  US1: 'US West',
  US2: 'US East',
  IN: 'India',
  DE: 'Germany',
  GB: 'UK',
  CA: 'Canada',
  AU: 'Australia',
  US: "USA", // present for backward compatibility
  JP: 'Japan',
  FR: 'France',
  ID: 'Indonesia',
};

export type CountryCode = keyof typeof codeCountryMap;

export const countryCodeList = Object.keys(codeCountryMap);

export const countryCodeMap = (
  Object.entries(codeCountryMap) as [CountryCode, string][]
).reduce((acc, [key, val]) => {
  acc[val] = key;
  return acc;
}, {} as { [K: string]: CountryCode });

export function getCountryNameByCode(code: string): string | undefined {
  return codeCountryMap[code as CountryCode];
}

export function getCountryCodeByName(name: string) {
  return countryCodeMap[name];
}

type UrlParams = {
  boxSession: string | null;
  independent: string | null;
  country: string | null;
  type: string | null;
  session: string | null;
};

let url_params: UrlParams | null = null;

export function getUrlParams() {
  if (url_params) {
    return url_params;
  }

  const params = new URLSearchParams(window.location.search);

  url_params = {
    boxSession: params.get('boxSession'),
    independent: params.get('independent'),
    country: params.get('country'),
    type: params.get('type'),
    session: params.get('session'),
  };

  return url_params;
}

export const BoxTypeDB = 'browser';
export const BoxTypeDFV = 'file_viewer';

const _allowedTypes = [BoxTypeDB, BoxTypeDFV] as const;
const allowedTypes = _allowedTypes as readonly string[];

export type InstanceType = (typeof _allowedTypes)[number];

export function validateParams() {
  if (!url_params) {
    return false;
  }

  if (!url_params.type || !allowedTypes.includes(url_params.type)) {
    return false;
  }

  if (
    url_params.type === BoxTypeDB &&
    (!url_params.country || !getCountryNameByCode(url_params.country))
  ) {
    return false;
  }

  events.emit(EventType.ValidatedParams, { params: url_params });

  return true;
}

export function makeApiUrl(session: string, path = '') {
  return `https://${session}-sc/${path}`;
}

export function getFileExtension(file: File) {
  return `.${file.name.split('.').slice(-1)[0]}`;
}

export function trimFileName(fileName: string) {
  if (fileName.length > 72) {
    const fileParts = fileName.split('.');
    const truncLength = Math.min(fileParts[0].length, 68);
    const truncStr = fileName.substring(0, truncLength - 1);
    if (fileParts.length > 1) {
      // get extension
      const fileExt = fileParts.pop();
      return truncStr + '...' + fileExt;
    }
    // no extension case
    return truncStr + '...';
  }
  return fileName;
}
