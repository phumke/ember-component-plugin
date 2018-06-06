'use strict';

import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import { Component } from './vweb-component';

/**
 * This is the platform type - core, extended, lib, engine-lib
 */
export function getPlatform(relativeFilepath: string): string {
  return path.dirname(relativeFilepath).split('/')[0];
}

export function isLib(relativeFilepath: string): boolean {
  return getPlatform(relativeFilepath) === 'lib';
}

export function isEngineLib(relativeFilepath: string): boolean {
  return getPlatform(relativeFilepath) === 'engine-lib';
}

export function isCore(relativeFilepath: string): boolean {
  return getPlatform(relativeFilepath) === 'core';
}

export function isExtended(relativeFilepath: string): boolean {
  return getPlatform(relativeFilepath) === 'extended';
}

export function isTest(relativeFilepath: string): boolean {
  return path.dirname(relativeFilepath).split('/')[2] === 'voyager-testing';
}

export function testType(relativeFilepath: string): string {
  return path.dirname(relativeFilepath).split('/')[4];
}

export function isUnitTest(relativeFilepath: string): boolean {
  return isTest(relativeFilepath) && testType(relativeFilepath) === 'unit';
}

export function isIntegrationTest(relativeFilepath: string): boolean {
  return (
    isTest(relativeFilepath) && testType(relativeFilepath) === 'integration'
  );
}

export function isAcceptanceTest(relativeFilepath: string): boolean {
  return (
    isTest(relativeFilepath) && testType(relativeFilepath) === 'acceptance'
  );
}

export function getSpecializedName(relativeFilepath: string): string {
  let specializedName = path.join(
    getEngine(relativeFilepath),
    getPathRemainder(relativeFilepath),
    getExt(relativeFilepath)
  );
  if (isTest(relativeFilepath)) {
    specializedName = path.join('tests', testType(relativeFilepath));
  }

  return specializedName;
}

export function getRelativeFilepath(root: string, filePath: string): string {
  const relPath = filePath.replace(root, '');

  if (relPath.length > 0 && relPath[0] === '/') {
    return relPath.slice(1);
  }

  return relPath;
}

export function getExt(relativeFilepath: string): string {
  return path.basename(relativeFilepath).split('.')[1];
}

export function isScss(relativeFilepath: string): boolean {
  return getExt(relativeFilepath) === 'scss';
}

export function isComponent(relativeFilepath: string): boolean {
  return relativeFilepath.includes('components');
}

export function getPathRemainder(relativeFilepath: string): string {
  return isComponent(relativeFilepath)
    ? path.dirname(relativeFilepath).split('components/')[1] || ''
    : '';
}

// This is the engine, excluding -ext, -global, etc
// Note that the shared directories contain an extra subdirectory right after the engine, which is also included within this engine component
export function getEngine(relativeFilepath: string): string {
  let engine = path.dirname(relativeFilepath).split('/')[2];
  let nextDir = path.dirname(relativeFilepath).split('/')[3];

  if (isLib(relativeFilepath) || isEngineLib(relativeFilepath)) {
    engine = path.dirname(relativeFilepath).split('/')[1];
    nextDir = path.dirname(relativeFilepath).split('/')[2];
  }

  engine = engine.endsWith('-ext')
    ? engine.substring(0, engine.length - 4)
    : engine;

  engine = engine.endsWith('-common')
    ? engine.substring(0, engine.length - 7)
    : engine;

  // Special case for shared engine, there is an extra directory within the path
  if (nextDir.startsWith('shared')) {
    engine = engine + '/' + nextDir;
  }

  return engine;
}

// Special case for shared engine since it has an extra directory in the path
export function isSharedEngine(relativeFilepath: string): boolean {
  return (
    getEngine(relativeFilepath).split('/')[0] === 'shared' ||
    getEngine(relativeFilepath).split('/')[0] === 'shared-ext'
  );
}

export function getName(relativeFilepath: string): string {
  return path.basename(relativeFilepath).split('.')[0];
}

export function getComponentName(relativeFilepath: string): string {
  const name = getName(relativeFilepath);
  const nameWithoutTest = name.endsWith('-test')
    ? name.substring(0, name.length - 5)
    : name;
  const nameWithoutExt = nameWithoutTest.endsWith('-ext')
    ? nameWithoutTest.substring(0, nameWithoutTest.length - 4)
    : nameWithoutTest;
  return nameWithoutExt;
}

export class FileTaxonomy {
  constructor(private workspaceRoot: string) {}

  // Handle identifying non-component files and rejecting them
  filterNonComponents(files: File[]) {
    return files.filter(
      _ => isComponent(_.relativeFilepath) && !isScss(_.relativeFilepath)
    );
  }

  getFullPath(relativeFilePath: string): string {
    return path.join(this.workspaceRoot, relativeFilePath);
  }

  fileExists(relativeFilePath: string): boolean {
    return fs.existsSync(path.join(this.workspaceRoot, relativeFilePath));
  }
}
