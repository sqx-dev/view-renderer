import { execSync } from 'child_process';
import esbuild from 'esbuild';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifacts_dir = path.join(__dirname, '../.artifacts');

execSync(`mkdir -p ${artifacts_dir}`);

esbuild.buildSync({
  entryPoints: [
    path.join(__dirname, './env/index.ts'),
    path.join(__dirname, './app-build/index.ts'),
  ],
  bundle: true,
  platform: 'node',
  target: 'node16',
  entryNames: '[dir]',
  external: ['esbuild'],
  outdir: path.join(__dirname, '../.artifacts'),
});
