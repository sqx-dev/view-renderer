import path from 'path';
import { rootDirectory } from '../utils/root-path';
import { safeReadJson } from '../utils/safe-read-json';
import { BuildEnvironmentInput } from './definition';
import { ValueValidationError, flattenError } from 'dealwith';
import { DW as v } from 'dealwith';
import { validatorFunction } from './validation';

export async function getEnvParams(env: string) {
  const params_raw = await safeReadJson(
    path.join(rootDirectory, './build-params.json')
  );

  const env_params = (params_raw as Record<string, unknown> | undefined)?.[env];

  if (!env_params) {
    console.error('Missing build params for environment', env);
    return process.exit(1);
  }

  console.log('Loaded build environment variables', env_params);

  const env_validator = v
    .object()
    .schema<Record<string, BuildEnvironmentInput>>({
      [env]: validatorFunction,
    });

  const params_result = env_validator('', {
    [env]: env_params,
  });

  if (params_result.hasError) {
    console.error('Build params error', flattenError(params_result));
    return process.exit(1);
  }

  return params_result.result[env];
}
