import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Linter, readJsonInTree } from '@nrwl/workspace';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';
import { ApplicationSchematicSchema } from './schema';

describe('application', () => {
  let appTree: Tree;
  const options: ApplicationSchematicSchema = {
    name: 'test',
    skipFormat: false,
    unitTestRunner: 'jest',
    e2eTestRunner: 'cypress',
    linter: Linter.TsLint
  };

  const testRunner = new SchematicTestRunner(
    '@nxtend/ionic-react',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should add dependencies to package.json', async () => {
    const tree = await testRunner
      .runSchematicAsync('application', options, appTree)
      .toPromise();

    const packageJSON = readJsonInTree(tree, 'package.json');
    expect(packageJSON.dependencies['@ionic/react-router']).toBeDefined();
  });

  function testGeneratedFiles(tree: Tree) {
    expect(
      tree.exists(`apps/${options.name}/src/app/theme/variables.css`)
    ).toBeTruthy();

    expect(
      tree.exists(`apps/${options.name}/src/app/app.spec.tsx`)
    ).toBeTruthy();
    expect(tree.exists(`apps/${options.name}/src/app/app.tsx`)).toBeTruthy();

    expect(
      tree.exists(`apps/${options.name}/src/assets/icon/favicon.png`)
    ).toBeTruthy();
    expect(
      tree.exists(`apps/${options.name}/src/assets/icon/icon.png`)
    ).toBeTruthy();

    expect(tree.exists(`apps/${options.name}/src/index.html`)).toBeTruthy();
    expect(tree.exists(`apps/${options.name}/src/manifest.json`)).toBeTruthy();

    expect(
      tree.exists(`apps/${options.name}/src/app/${options.name}.spec.tsx`)
    ).toBeFalsy();
    expect(
      tree.exists(`apps/${options.name}/src/app/${options.name}.tsx`)
    ).toBeFalsy();
  }

  it('should generate application', async () => {
    const tree = await testRunner
      .runSchematicAsync('application', options, appTree)
      .toPromise();

    testGeneratedFiles(tree);
  });

  it('should generate application with app alias', async () => {
    const tree = await testRunner
      .runSchematicAsync('app', options, appTree)
      .toPromise();

    testGeneratedFiles(tree);
  });

  it('should apply template files', async () => {
    const tree = await testRunner
      .runSchematicAsync('application', options, appTree)
      .toPromise();

    expect(
      tree.exists(`apps/${options.name}/src/index.html.template`)
    ).toBeFalsy();
    expect(
      tree.exists(`apps/${options.name}/src/manifest.json.template`)
    ).toBeFalsy();
  });

  it('should delete unused @nrwl/react files', async () => {
    const tree = await testRunner
      .runSchematicAsync('application', options, appTree)
      .toPromise();

    expect(tree.exists(`apps/${options.name}/src/app/app.css`)).toBeFalsy();
    expect(tree.exists(`apps/${options.name}/src/favicon.ico`)).toBeFalsy();
  });

  it('should update workspace.json', async () => {
    const tree = await testRunner
      .runSchematicAsync('application', options, appTree)
      .toPromise();
    const workspaceJson = readJsonInTree(tree, '/workspace.json');

    expect(
      workspaceJson.projects[options.name].architect.build.options.assets
    ).not.toContain('/src/favicon.ico');
    expect(
      workspaceJson.projects[options.name].architect.build.options.webpackConfig
    ).toEqual('@nxtend/ionic-react/plugins/webpack');
  });

  describe('--style', () => {
    it('should generate application with scss style', async () => {
      const style = 'scss';
      const tree = await testRunner
        .runSchematicAsync('application', { ...options, style }, appTree)
        .toPromise();

      expect(
        tree.exists(`apps/${options.name}/src/app/theme/variables.scss`)
      ).toBeTruthy();
    });

    it('should generate application with styled-components style', async () => {
      const style = 'styled-components';
      const tree = await testRunner
        .runSchematicAsync('application', { ...options, style }, appTree)
        .toPromise();

      expect(
        tree.exists(
          `apps/${options.name}/src/app/theme/variables.styled-components`
        )
      ).toBeFalsy();
    });
  });

  describe('--unitTestRunner', () => {
    it('should generate Jest mocks', async () => {
      const tree = await testRunner
        .runSchematicAsync('application', options, appTree)
        .toPromise();

      expect(
        tree.exists(`apps/${options.name}/src/app/__mocks__/fileMock.js`)
      ).toBeTruthy();
      expect(
        tree.exists(`apps/${options.name}/jest.config.js.template`)
      ).toBeFalsy();
    });

    it('should not generate Jest mocks', async () => {
      const tree = await testRunner
        .runSchematicAsync(
          'application',
          { ...options, unitTestRunner: 'none' },
          appTree
        )
        .toPromise();

      expect(
        tree.exists(`apps/${options.name}/src/app/__mocks__/fileMock.js`)
      ).toBeFalsy();
      expect(
        tree.exists(`apps/${options.name}/jest.config.js.template`)
      ).toBeFalsy();
    });
  });
});
