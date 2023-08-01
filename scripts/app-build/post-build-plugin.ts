import type { Metafile, PluginBuild } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { BuildEnvironment } from '../env/definition';
import { getPathFromRoot } from '../utils/root-path';

const time = () => new Date().getTime();

type ExtensionMappedOutput = Metafile['outputs'][string] & {
  filename: string;
  extension: string;
  outputPath: string;
};

const html_root = getPathFromRoot('./sqrx-app/index.html');

export const postBuildPlugin = (env: BuildEnvironment) => ({
  name: 'postbuild',
  setup(build: PluginBuild) {
    let laststart = time();
    build.onStart(() => {
      laststart = time();
    });
    build.onEnd(async (result) => {
      let html_data = await fs.readFile(html_root, 'utf-8');

      const outputs = Object.entries(result.metafile?.outputs ?? {}).reduce(
        (acc, [outputPath, outputDetails]) => {
          const fname = path.basename(outputPath);
          const extension = path.extname(fname);

          if (extension === '.css') {
            acc.css.push({
              ...outputDetails,
              filename: fname,
              extension,
              outputPath,
            });
          } else if (extension === '.js') {
            acc.js.push({
              ...outputDetails,
              filename: fname,
              extension,
              outputPath,
            });
          }

          return acc;
        },
        {
          css: [] as ExtensionMappedOutput[],
          js: [] as ExtensionMappedOutput[],
        }
      );

      html_data = html_data.replace(
        '<!-- STYLE_REPLACEMENT_AREA -->',
        outputs.css
          .map((a) => `<link rel="stylesheet" href="${a.filename}" />`)
          .join('\n')
      );

      html_data = html_data.replace(
        '<!-- SCRIPT_REPLACEMENT_AREA -->',
        outputs.js
          .map((a) => `<script src="${a.filename}"></script>`)
          .join('\n')
      );

      await fs.writeFile(
        getPathFromRoot('./build/index.html'),
        html_data,
        'utf-8'
      );

      console.info('Build completed in', time() - laststart, 'milliseconds');
    });
  },
});
