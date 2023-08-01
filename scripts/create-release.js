const { execSync } = require('child_process');
const pkg = require('../package.json');

const exec = (cmd) => execSync(cmd, { stdio: [0, 1, 2] });

try {
  execSync('zip --help && unzip --help');
} catch (ex) {
  console.error(
    'You need to install the zip and unzip cli tools to create releases'
  );
  process.exit(1);
}

// These only need to be run once because they aren't different between builds.
exec('npm run make-artifacts');

const envs = Object.keys(require('../build-params.json'));
const time = new Date();

const zpad = (v) => (v <= 9 ? `0${v}` : v.toString());

const time_string = `${time.getFullYear()}${zpad(time.getMonth() + 1)}${zpad(
  time.getDate()
)}_${zpad(time.getHours())}${zpad(time.getMinutes())}`;

try {
  for (const env of envs) {
    const artifact_name = `vr_${
      pkg.version
    }_${env.toUpperCase()}_${time_string}.zip`;
    exec(`rm -rf ./build && mkdir -p ./build`);
    exec('cp -rf ./sqrx-app/images ./build');
    exec('cp ./vendor/jsmpeg.js ./build');
    exec(`node ./.artifacts/env.js --env=${env}`);
    exec('NODE_ENV=production node ./.artifacts/app-build.js', {
      stdio: [0, 1, 2],
    });
    exec(`cd ./build && zip -r ../.artifacts/releases/${artifact_name} *`);
    console.log('Packed release:', `./.artifacts/releases/${artifact_name}`);
  }
} catch (ex) {
  console.error('Release exited with non-zero code', ex);
}
