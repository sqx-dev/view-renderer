import { execSync } from 'child_process';
import esbuild, { BuildOptions } from 'esbuild';
import path from 'path';
import fs from 'fs/promises';
import { postBuildPlugin } from './post-build-plugin';
import { getPathFromRoot } from '../utils/root-path';
import { BuildEnvironment } from '../env/definition';

const build_dir = getPathFromRoot('./build');
const watch_mode = process.argv.find((a) => a === '--watch');

(async () => {
  const define = JSON.parse(
    await fs.readFile(getPathFromRoot('./.artifacts/define.json'), 'utf-8')
  );

  const env = JSON.parse(
    await fs.readFile(getPathFromRoot('./.artifacts/env.json'), 'utf-8')
  ) as BuildEnvironment;

  const build_options: BuildOptions = {
    entryPoints: [getPathFromRoot('./sqrx-app/index.ts')],
    entryNames: 'main.[hash]',
    sourcemap: process.env.IS_DEV ? 'inline' : false,
    minify: !process.env.IS_DEV,
    bundle: true,
    outdir: build_dir,
    metafile: true,
    loader: {},
    define: {
      ...define,
      'process.env.NODE_ENV': process.env.IS_DEV
        ? '"development"'
        : '"production"',
    },
    plugins: [postBuildPlugin(env)],
  };

  if (watch_mode) {
    esbuild.context(build_options).then((ctx) => {
      ctx.watch();
      ctx.serve({
        servedir: 'build',
        port: 8080,
        host: '0.0.0.0',
      });
    });
  } else {
    esbuild.build(build_options);
  }
})();
