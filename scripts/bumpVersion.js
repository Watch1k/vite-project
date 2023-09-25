import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';

function readPackageJson() {
  return JSON.parse(readFileSync('package.json').toString());
}

function writePackageJson(packageJson) {
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2).concat('\n'));
}

(async () => {
  const { name: packageName } = readPackageJson();
  const eventPayload = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!).toString());
  const versionType =
    eventPayload.pull_request?.labels
      ?.find((label) => ['major', 'minor', 'patch'].includes(label.name.toLowerCase()))
      ?.name.toLowerCase() || 'patch';

  try {
    console.log(`Bumping ${versionType} version: "${packageName}"`);
    await execa('npm', ['version', versionType, '--no-git-tag-version'], {
      stdout: process.stdout,
    });
  } catch (error) {
    console.error(`Error bumping ${versionType} version: "${packageName}"`, error);
  }

  const repoVersion = process.env.REPO_VERSION;
  try {
    console.log(`Adding repoVersion "${repoVersion}" to package.json: "${packageName}"`);
    const packageJson = readPackageJson();
    packageJson.repoVersion = repoVersion;
    packageJson.description = `${packageName}. repo version: ${repoVersion}`;
    writePackageJson(packageJson);
  } catch (error) {
    console.error(`Error adding repoVersion "${repoVersion}" to package.json: "${packageName}"`, error);
  }
})();
