'use strict';

import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import { Component } from './vweb-component';

export function getRelativeFilepath(root: string, filePath: string): string {
  const relPath = filePath.replace(root, '');

  if (relPath.length > 0 && relPath[0] === '/') {
    return relPath.slice(1);
  }

  return relPath;
}

// TODO refactor with looping
export class FileTaxonomy {
  constructor(private workspaceRoot: string) {
  }

  // Handle identifying non-component files and rejecting them
  filterNonComponents(files: File[]) {
    return files.filter(_ => _.isComponent() && !_.isTest() && !_.isScss());
  }

  getFullPath(relativeFilePath: string): string {
    return path.join(this.workspaceRoot, relativeFilePath);
  }

  /**
   * file structure:
   *  trunk/<core or extended>/lib/<engine or engine-ext>/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   *  trunk/engine-lib/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   *  trunk/global/addon/<components or templates>/<N/A or components>/<remainder of path>.<js or hbs>
   * @param component
   */
  getComponentFiles(component: Component): File[] {
    const files = [];
    const templateFile = this.getTemplateFile(component);
    const jsFile = this.getJsFile(component);
    const testFiles = this.getTestFiles(component);
    const scssFiles = this.getScssFiles(component);
    if (templateFile) {
      files.push(templateFile);
    }
    if (jsFile) {
      files.push(jsFile);
    }
    if (testFiles) {
      files.push.apply(files, testFiles);
    }
    if (scssFiles) {
      files.push.apply(files, scssFiles);
    }

    return files;
  }
  // engine-lib/abi-common/addon/components/abi-form.js

  getTemplateFile(component: Component): File {
    const name = component.name;
    const platform = component.platform;
    const engine = component.engine;
    const rootEngine = component.file.rootEngine();
    const remainder = component.pathRemainder;
    const ext = '.hbs';
    const filename = name + ext;

    const searchPaths = [
      `${platform}/lib/${engine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/engines/${engine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/lib/${rootEngine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/engines/${rootEngine}/addon/templates/components/${remainder}/${filename}`,
      `engine-lib/${engine}/addon/templates/components/${remainder}/${filename}`,
      `lib/${engine}/addon/templates/components/${remainder}/${filename}`,
    ];

    for (const filePath of searchPaths) {
      if (this.fileExists(filePath)) {
        return new File(filePath);
      }
    }

    return null;
  }

  getJsFile(component: Component): File {
    const name = component.name;
    const platform = component.platform;
    const engine = component.engine;
    const rootEngine = component.file.rootEngine();
    const remainder = component.pathRemainder;
    const ext = '.js';
    const filename = name + ext;

    const searchPaths = [
      `${platform}/lib/${engine}/addon/components/${remainder}/${filename}`,
      `${platform}/engines/${engine}/addon/components/${remainder}/${filename}`,
      `${platform}/lib/${rootEngine}/addon/components/${remainder}/${filename}`,
      `${platform}/engines/${rootEngine}/addon/components/${remainder}/${filename}`,
      `engine-lib/${engine}/addon/components/${remainder}/${filename}`,
      `lib/${engine}/addon/components/${remainder}/${filename}`,
    ];

    for (const filePath of searchPaths) {
      if (this.fileExists(filePath)) {
        return new File(filePath);
      }
    }

    return null;
  }

  /**
   * file structure
   *  trunk/extended/tests/unit/components/<engine>/<remainder of path>/<name>-test.js
   *  trunk/core/lib/voyager-testing/tests/<unit or integration>/components/<engine without ext>/<remainder of path>/<name><N/A or -core or -ext>-test.js
   *  trunk/core/lib/voyager-testing/tests/acceptance/<engine without ext>/<remainder of path>/<name><N/A or -core or -ext>-test.js
   * @param originalComponentFile
   */
  getTestFiles(component: Component): File[] {
    const name = component.name;
    const platform = component.platform;
    const platformExt = (platform === 'core' ? 'core' : 'ext');
    const rootEngine = component.file.rootEngine();
    const platformEngine = rootEngine + '-' + platformExt;
    const remainder = component.pathRemainder;
    const globalFilename = name + '-test.js';
    const platformFilename = name + '-' + platformExt + '-test.js';

    const searchPaths = [
      `core/lib/voyager-testing/tests/unit/components/${rootEngine}/${remainder}/${globalFilename}`,
      `core/lib/voyager-testing/tests/unit/components/${rootEngine}/${remainder}/${platformFilename}`,
      `core/lib/voyager-testing/tests/integration/components/${rootEngine}/${remainder}/${globalFilename}`,
      `core/lib/voyager-testing/tests/integration/components/${rootEngine}/${remainder}/${platformFilename}`,
      `core/lib/voyager-testing/tests/acceptance/components/${rootEngine}/${remainder}/${globalFilename}`,
      `core/lib/voyager-testing/tests/acceptance/components/${rootEngine}/${remainder}/${platformFilename}`,
      `extended/tests/unit/components/${rootEngine}/${remainder}/${globalFilename}`,
      `extended/tests/unit/components/${platformEngine}/${remainder}/${globalFilename}`,
      `extended/tests/integration/components/${rootEngine}/${remainder}/${globalFilename}`,
      `extended/tests/integration/components/${platformEngine}/${remainder}/${globalFilename}`,
      `extended/tests/acceptance/components/${rootEngine}/${remainder}/${globalFilename}`,
      `extended/tests/acceptance/components/${platformEngine}/${remainder}/${globalFilename}`,
    ];

    return searchPaths.filter(filePath => this.fileExists(filePath)).map(filePath => new File(filePath));
  }

  getScssFiles(component: Component): File[] {
    const name = component.name + '.scss';
    const platform = component.platform;
    const platformExt = (platform === 'core' ? 'core' : 'ext');
    const engine = component.engine;
    const globalEngine = component.file.globalEngine();
    const remainder = component.pathRemainder;

    const searchPaths = [
      `${platform}/lib/${engine}/addon/styles/components/${remainder}`,
      `${platform}/lib/${engine}/app/styles/components/${remainder}`,
      `${platform}/lib/${engine}/addon/styles/components`,
      `${platform}/lib/${engine}/app/styles/components`,
      `global/${globalEngine}/app/styles/${globalEngine}/components`
    ];

    return searchPaths
      .filter(filePath => this.fileExists(filePath))
      .map(filePath => this.getSimilarFiles(filePath, name))
      .reduce((prev, elem) => prev.concat(elem), []);
  }

  getSimilarFiles(relativeFilePath: string, desiredName: string): File[] {
    const matchedFiles = [];
    fs.readdirSync(path.join(this.workspaceRoot, relativeFilePath)).forEach(file => {
      if (file.endsWith(desiredName)) {
        matchedFiles.push(new File(path.join(relativeFilePath, file)));
      }
    });

    return matchedFiles;
  }

  fileExists(relativeFilePath: string): boolean {
    return fs.existsSync(path.join(this.workspaceRoot, relativeFilePath))
  }
}
