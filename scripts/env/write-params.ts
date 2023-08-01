import * as fs from 'fs/promises';
import path from 'path';
import { BuildEnvironment, BuildEnvironmentInput } from './definition';
import { rootDirectory } from '../utils/root-path';
import mergeDeep from './deep-merge';
import { DEFAULT_ENVIRONMENT } from './default';

const define_output_location = path.join(
  rootDirectory,
  './.artifacts/define.json'
);

const env_output_location = path.join(rootDirectory, './.artifacts/env.json');

export async function writeParams(env: BuildEnvironmentInput) {
  const fullParams = mergeDeep<BuildEnvironment>(DEFAULT_ENVIRONMENT, env);
  console.log('Merged parameters', fullParams);
  console.log(
    `Generating built-in environment at [${define_output_location}]...`
  );

  const outputParams = deepWriteParams(fullParams);

  try {
    await fs.writeFile(
      env_output_location,
      JSON.stringify(fullParams),
      'utf-8'
    );
  } catch (exception) {
    console.error('Unable to generate environment file', exception);
  }

  try {
    await fs.writeFile(
      define_output_location,
      JSON.stringify(outputParams),
      'utf-8'
    );
  } catch (exception) {
    console.error('Unable to generate definition data file', exception);
  }
}

function deepWriteParams(
  env: unknown,
  path = 'BUILD_ENV',
  output = {} as Record<string, string>
): Record<string, string> {
  if (env === null) {
    output[path] = `null`;
    return output;
  }

  if (typeof env === 'object') {
    if (Array.isArray(env)) {
      output[path] = `${JSON.stringify(env)}`;
      return output;
    } else {
      Object.keys(env).forEach((key) => {
        const nextPath = [path, key].join('.');
        deepWriteParams((env as Record<string, string>)[key], nextPath, output);
      });
      return output;
    }
  }

  if (typeof env === 'string') {
    output[path] = `"${env}"`;
    return output;
  } else {
    output[path] = `${env}`;
    return output;
  }
}
