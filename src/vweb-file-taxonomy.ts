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
  constructor(private workspaceRoot: string) {}

  // Handle identifying non-component files and rejecting them
  filterNonComponents(files: File[]) {
    return files.filter(_ => _.isComponent() && !_.isTest() && !_.isScss());
  }

  getFullPath(relativeFilePath: string): string {
    return path.join(this.workspaceRoot, relativeFilePath);
  }

  /**
   * The list of possible platforms which have files for that component
   */
  getComponentPlatforms(component: Component): string[] {
    const platforms = ['lib', 'engine-lib', 'core', 'extended'];

    return platforms.filter(
      platform => this.getComponentPlatformFiles(component, platform).length > 0
    );
  }

  /**
   * Get the list of all related component files for a given platform
   * @param component
   */
  getComponentPlatformFiles(component: Component, platform: string): File[] {
    const files = [];
    const templateFile = this.getTemplateFile(
      component.name,
      platform,
      component.engine,
      component.pathRemainder
    );
    const jsFile = this.getJsFile(
      component.name,
      platform,
      component.engine,
      component.pathRemainder
    );
    const testFiles = this.getTestFiles(
      component.name,
      platform,
      component.engine,
      component.pathRemainder
    );
    const scssFiles = this.getScssFiles(
      component.name,
      platform,
      component.engine,
      component.pathRemainder
    );
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

    console.log(platform);
    console.log(testFiles);
    console.log(scssFiles);

    return files;
  }

  /**
   * Finds the template file associated with that template
   * @param name the component name
   * @param platform the desired platform to search in
   * @param engine the component engine
   * @param remainder the remainder of the path
   */
  getTemplateFile(
    name: string,
    platform: string,
    engine: string,
    remainder: string
  ): File {
    const ext = '.hbs';
    const filename = name + ext;
    const commonEngine = this.commonEngine(engine);

    const searchPaths = [
      `${platform}/lib/${engine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/engines/${engine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/${engine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/lib/${commonEngine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/engines/${commonEngine}/addon/templates/components/${remainder}/${filename}`,
      `${platform}/${commonEngine}/addon/templates/components/${remainder}/${filename}`,
    ];

    for (const filePath of searchPaths) {
      if (this.fileExists(filePath)) {
        return new File(filePath);
      }
    }

    return null;
  }

  /**
   * Finds the js file associated with that template
   * @param name the component name
   * @param platform the desired platform to search in
   * @param engine the component engine
   * @param remainder the remainder of the path
   */
  getJsFile(
    name: string,
    platform: string,
    engine: string,
    remainder: string
  ): File {
    const ext = '.js';
    const filename = name + ext;
    const commonEngine = this.commonEngine(engine);

    const searchPaths = [
      `${platform}/lib/${engine}/addon/components/${remainder}/${filename}`,
      `${platform}/engines/${engine}/addon/components/${remainder}/${filename}`,
      `${platform}/${engine}/addon/components/${remainder}/${filename}`,
      `${platform}/lib/${commonEngine}/addon/components/${remainder}/${filename}`,
      `${platform}/engines/${commonEngine}/addon/components/${remainder}/${filename}`,
      `${platform}/${commonEngine}/addon/components/${remainder}/${filename}`,
    ];

    for (const filePath of searchPaths) {
      if (this.fileExists(filePath)) {
        return new File(filePath);
      }
    }

    return null;
  }

  /**
   * Finds the test files associated with that template
   * @param name the component name
   * @param platform the desired platform to search in
   * @param engine the component engine
   * @param remainder the remainder of the path
   */
  getTestFiles(
    name: string,
    platform: string,
    engine: string,
    remainder: string
  ): File[] {
    const platformExt = platform === 'core' ? 'core' : 'ext';
    const platformEngine = engine + '-' + platformExt;
    const globalFilename = name + '-test.js';
    const platformFilename = name + '-' + platformExt + '-test.js';
    const coreUnitRoot = 'core/lib/voyager-testing/tests/unit/components';
    const coreIntRoot = 'core/lib/voyager-testing/tests/integration/components';
    const coreAccRoot = 'core/lib/voyager-testing/tests/acceptance/components';
    const extendedUnitRoot = 'extended/tests/unit/components';
    const extendedIntRoot = 'extended/tests/integration/components';
    const extendedAccRoot = 'extended/tests/acceptance/components';

    const searchPaths = [
      `${coreUnitRoot}/${engine}/${remainder}/${globalFilename}`,
      `${coreUnitRoot}/${engine}/${remainder}/${platformFilename}`,
      `${coreUnitRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${coreUnitRoot}/${engine}/lib/${remainder}/${platformFilename}`,
      `${coreIntRoot}/${engine}/${remainder}/${globalFilename}`,
      `${coreIntRoot}/${engine}/${remainder}/${platformFilename}`,
      `${coreIntRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${coreIntRoot}/${engine}/lib/${remainder}/${platformFilename}`,
      `${coreAccRoot}/${engine}/${remainder}/${globalFilename}`,
      `${coreAccRoot}/${engine}/${remainder}/${platformFilename}`,
      `${coreAccRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${coreAccRoot}/${engine}/lib/${remainder}/${platformFilename}`,
      `${extendedUnitRoot}/${engine}/${remainder}/${globalFilename}`,
      `${extendedUnitRoot}/${platformEngine}/${remainder}/${globalFilename}`,
      `${extendedUnitRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${extendedUnitRoot}/${platformEngine}/lib/${remainder}/${globalFilename}`,
      `${extendedIntRoot}/${engine}/${remainder}/${globalFilename}`,
      `${extendedIntRoot}/${platformEngine}/${remainder}/${globalFilename}`,
      `${extendedIntRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${extendedIntRoot}/${platformEngine}/lib/${remainder}/${globalFilename}`,
      `${extendedAccRoot}/${engine}/${remainder}/${globalFilename}`,
      `${extendedAccRoot}/${platformEngine}/${remainder}/${globalFilename}`,
      `${extendedAccRoot}/${engine}/lib/${remainder}/${globalFilename}`,
      `${extendedAccRoot}/${platformEngine}/lib/${remainder}/${globalFilename}`,
    ];

    return searchPaths
      .filter(filePath => this.fileExists(filePath))
      .map(filePath => new File(filePath));
  }

  /**
   * Finds the scss files associated with the component
   * TODO handle when the platform is lib
   * @param name the component name
   * @param platform the desired platform to search in
   * @param engine the component engine
   * @param remainder the remainder of the path
   */
  getScssFiles(
    name: string,
    platform: string,
    engine: string,
    remainder: string
  ): File[] {
    const nameWExt = name + '.scss';
    const platformExt = platform === 'core' ? 'core' : 'ext';
    const globalEngine = this.globalEngine(engine);
    const commonEngine = this.commonEngine(engine);
    const appDir = 'app/styles/components';
    const addonDir = 'addon/styles/components';

    const searchPaths = [
      `${platform}/lib/${engine}/${addonDir}/${remainder}`,
      `${platform}/lib/${engine}/${appDir}/${remainder}`,
      `${platform}/lib/${engine}/${addonDir}`,
      `${platform}/lib/${engine}/${appDir}`,
      `${platform}/${engine}/${appDir}`,
      `${platform}/${engine}/${addonDir}`,
      `${platform}/${commonEngine}/${appDir}`,
      `${platform}/${commonEngine}/${addonDir}`,
      `global/${globalEngine}/app/styles/${globalEngine}/components`,
      `lib/${globalEngine}/app/styles/${globalEngine}/components`,
    ];

    // Handle the weird shared-ext folders
    engine.split('/').forEach(elem => {
      searchPaths.push(
        `${platform}/lib/${engine}/app/styles/${elem}/components/${remainder}`
      );
      searchPaths.push(
        `lib/${engine}/app/styles/${elem}/components/${remainder}`
      );
    });

    return searchPaths
      .filter(searchPath => this.fileExists(searchPath))
      .map(searchPath => this.getSimilarFiles(searchPath, nameWExt))
      .reduce((prev, elem) => prev.concat(elem), []);
  }

  getSimilarFiles(relativeFilePath: string, desiredName: string): File[] {
    const matchedFiles = [];
    fs
      .readdirSync(path.join(this.workspaceRoot, relativeFilePath))
      .forEach(file => {
        if (file.endsWith(desiredName)) {
          matchedFiles.push(new File(path.join(relativeFilePath, file)));
        }
      });

    return matchedFiles;
  }

  fileExists(relativeFilePath: string): boolean {
    return fs.existsSync(path.join(this.workspaceRoot, relativeFilePath));
  }

  commonEngine(engine: string) {
    return engine + '-common';
  }

  globalEngine(engine: string) {
    return engine + '-global';
  }
}
