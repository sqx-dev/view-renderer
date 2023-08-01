import { DW as v, type ValidatorFunction } from 'dealwith';
import { BuildEnvironmentInput } from './definition';

// Just to shorten it up
const u = v.optional;

export const validatorFunction = v.object().schema<BuildEnvironmentInput>({
  prevent_navigation: u(v.boolean()),
  max_rfb_reconnect_retries: u(v.number().integer().moreThan(0)),
  rfb_reconnect_interval: u(v.number().integer().not.lessThan(0)),
  file_upload_extension_whitelist: u(
    v.array().items(v.string().matches(/^\.\w+/))
  ),
});
