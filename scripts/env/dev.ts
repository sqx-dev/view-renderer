import { flattenError } from 'dealwith';
import { getPathFromRoot } from '../utils/root-path';
import { safeReadJson } from '../utils/safe-read-json';
import { validatorFunction } from './validation';

export async function getDevParams() {
  const params_raw = await safeReadJson(
    getPathFromRoot('./build-params.dev.json')
  );

  if (!params_raw) {
    return process.exit(1);
  }

  console.log('Loaded build environment variables', params_raw);

  const params_result = validatorFunction('', params_raw);

  if (params_result.hasError) {
    console.error('Build params error', flattenError(params_result));
    return process.exit(1);
  }

  return params_result.result;
}
