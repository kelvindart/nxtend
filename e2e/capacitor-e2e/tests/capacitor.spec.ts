import {
  ensureNxProject,
  readFile,
  runNxCommandAsync,
  runPackageManagerInstall,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { CapacitorGeneratorSchema } from '@nxtend/capacitor';

const asyncTimeout = 600_000;

const defaultCapacitorProjectOptions: CapacitorGeneratorSchema = {
  project: 'test-app',
  appId: 'test-id',
  skipFormat: true,
};

async function generateApp(options: CapacitorGeneratorSchema) {
  ensureNxProject('@nxtend/capacitor', 'dist/packages/capacitor');

  const packageJson = JSON.parse(readFile('package.json'));
  packageJson.devDependencies['@nrwl/react'] = '*';
  updateFile('package.json', JSON.stringify(packageJson));
  runPackageManagerInstall();

  await runNxCommandAsync(`generate @nrwl/react:app ${options.project}`);
  await runNxCommandAsync(
    `generate @nxtend/capacitor:capacitor-project --project ${options.project}`
  );
}

async function buildAndTestApp(plugin: string) {
  const buildResults = await runNxCommandAsync(`build ${plugin}`);
  expect(buildResults.stdout).toContain('compiled');

  const lintResults = await runNxCommandAsync(`lint ${plugin}`);
  expect(lintResults.stdout).toContain('All files pass linting');

  const testResults = await runNxCommandAsync(`test ${plugin}`);
  expect(testResults.stderr).toContain('Test Suites: 1 passed, 1 total');

  const e2eResults = await runNxCommandAsync(`e2e ${plugin}-e2e --headless`);
  expect(e2eResults.stdout).toContain('All specs passed!');

  const capResults = await runNxCommandAsync(`run ${plugin}:cap`);
  expect(capResults.stdout).toContain('Usage');

  const capPackageInstallResults = await runNxCommandAsync(
    `run ${plugin}:cap --packageInstall false`
  );
  expect(capPackageInstallResults.stdout).toContain('Usage: cap');

  const capHelpResults = await runNxCommandAsync(
    `run ${plugin}:cap --cmd="--help"`
  );
  expect(capHelpResults.stdout).toContain('Usage: cap');
}

describe('capacitor-project e2e', () => {
  it(
    'should build and test successfully',
    async () => {
      const plugin = uniq('capacitor');
      const options: CapacitorGeneratorSchema = {
        ...defaultCapacitorProjectOptions,
        project: plugin,
      };

      await generateApp(options);
      await buildAndTestApp(plugin);
    },
    asyncTimeout
  );
});
