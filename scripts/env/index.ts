import { DEFAULT_ENVIRONMENT } from './default';
import { getDevParams } from './dev';
import { getEnvParams } from './env';
import { writeParams } from './write-params';

const env =
  process.argv.find((a) => /--env=(.+)(\s|$)/.test(a))?.split('--env=')[1] ??
  'default';

const dev = process.argv.find((a) => /--dev(\s|$)/.test(a));

(async () => {
  const params = await (dev
    ? getDevParams()
    : env === 'default'
    ? DEFAULT_ENVIRONMENT
    : getEnvParams(env));

  await writeParams(params);
})();
