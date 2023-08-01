const { execSync } = require('child_process');

const args = process.argv;

const env = (() => {
  const env = args.find((a) => a.startsWith('--env='));
  return env ? env.split('--env=')[1] : 'default';
})();

const exec = (cmd) => execSync(cmd, { stdio: [0, 1, 2] });

try {
  exec('npm run make-artifacts');
  exec(`rm -rf ./build && mkdir -p ./build`);
  exec('cp -rf ./sqrx-app/images ./build');
  exec('cp ./vendor/jsmpeg.js ./build');
  exec(`node ./.artifacts/env.js ${env !== 'default' ? `--env=${env}` : ''}`);
  exec('node ./.artifacts/app-build.js');
} catch (ex) {
  console.error('Build exited with non-zero code');
}
