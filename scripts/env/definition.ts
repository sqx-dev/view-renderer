export interface BuildEnvironment {
  /**
   * If enabled, the window will try to prevent navigation and refreshes
   * by showing a confirmation dialog on the beforeunload event. If disabled
   * navigation and refreshes will not be blocked.
   */
  prevent_navigation: boolean;
  /**
   * The maximum number of times that the application will try to reconnect
   * the RFB websocket before it shows the user an error and shuts down.
   */
  max_rfb_reconnect_retries: number;
  /**
   * The length of time in milliseconds between one failed reconnect and the
   * next reconnect attempt of the RFB websocket. On initial disconnection,
   * the reconnect is immediate so this field is not used, only if the initial
   * reconnection fails will this interval take effect.
   */
  rfb_reconnect_interval: number;
  /**
   * A list of allowed file extensions that can be uploaded to the disposable
   * file viewer. Extensions not on this list will be prevented from uploading.
   */
  file_upload_extension_whitelist: string[];
}

type NestedPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends { [K in PropertyKey]: unknown }
  ? NestedObjectPartial<T>
  : T;

type NestedObjectPartial<T> = {
  [P in keyof T]?: NestedPartial<T[P]>;
};

export type BuildEnvironmentInput = NestedObjectPartial<BuildEnvironment>;
