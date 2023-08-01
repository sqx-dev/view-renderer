const { execSync } = require('child_process');
const concurrently = require('concurrently');
const exec = (cmd) => execSync(cmd, { stdio: [0, 1, 2] });

exec('npm run make-artifacts');
exec('node ./.artifacts/env.js --dev');
exec(`rm -rf ./build && mkdir -p ./build`);
exec('cp -rf ./sqrx-app/images ./build');
exec('cp ./vendor/jsmpeg.js ./build');

concurrently([
  {
    command: 'IS_DEV=true node ./.artifacts/app-build.js --watch',
    prefixColor: 'blue',
    name: 'esbuild',
  },
  {
    command: 'npm run typecheck',
    prefixColor: 'red',
    name: 'typescript',
  },
]);
