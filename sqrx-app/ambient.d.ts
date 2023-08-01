import type { BuildEnvironment } from '../scripts/env/definition';

declare global {
  const BUILD_ENV: BuildEnvironment;
}
