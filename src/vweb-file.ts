'use strict';

import * as path from 'path';

// This takes a relative file path
export class File {
  _name = null;
  _componentName = null;
  _ext = null;
  _engine = null;
  _pathRemainder = null;
  _platform = null;
  _specializedName = null;

  constructor(public readonly relativeFilepath: string) {
    // TODO This is only for testing purposes so the variables are set when printed
    this.name();
    this.componentName();
    this.ext();
    this.engine();
    this.pathRemainder();
    this.platform();
    this.specializedName();
  }

  isUnitTest() {
    return this.isTest() && this.testType() === 'unit';
  }

  isIntegrationTest() {
    return this.isTest() && this.testType() === 'integration';
  }

  isAcceptanceTest() {
    return this.isTest() && this.testType() === 'acceptance';
  }

  isTest() {
    return (
      path.dirname(this.relativeFilepath).split('/')[2] === 'voyager-testing'
    );
  }

  isComponent() {
    return this.relativeFilepath.includes('components');
  }

  isLib() {
    return this.platform() === 'lib';
  }

  isEngineLib() {
    return this.platform() === 'engine-lib';
  }

  isCore() {
    return this.platform() === 'core';
  }

  isExtended() {
    return this.platform() === 'extended';
  }

  isScss() {
    return this.ext() === 'scss';
  }

  // Special case for shared engine since it has an extra directory in the path
  isSharedEngine() {
    return (
      this.engine().split('/')[0] === 'shared' ||
      this.engine().split('/')[0] === 'shared-ext'
    );
  }

  testType() {
    return path.dirname(this.relativeFilepath).split('/')[4];
  }

  name() {
    if (this._name) {
      return this._name;
    }

    this._name = path.basename(this.relativeFilepath).split('.')[0];
    return this._name;
  }

  componentName() {
    if (this._componentName) {
      return this._componentName;
    }

    const nameWithoutTest = this.name().endsWith('-test')
      ? this.name().substring(0, this.name().length - 5)
      : this.name();
    const nameWithoutExt = nameWithoutTest.endsWith('-ext')
      ? nameWithoutTest.substring(0, nameWithoutTest.length - 4)
      : nameWithoutTest;
    this._componentName = nameWithoutExt;
    return this._componentName;
  }

  ext() {
    if (this._ext) {
      return this._ext;
    }

    this._ext = path.basename(this.relativeFilepath).split('.')[1];
    return this._ext;
  }

  // This is the engine, excluding -ext, -global, etc
  // Note that the shared directories contain an extra subdirectory right after the engine, which is also included within this engine component
  engine() {
    if (this._engine) {
      return this._engine;
    }

    let engine = path.dirname(this.relativeFilepath).split('/')[2];
    let nextDir = path.dirname(this.relativeFilepath).split('/')[3];

    if (this.isLib() || this.isEngineLib()) {
      engine = path.dirname(this.relativeFilepath).split('/')[1];
      nextDir = path.dirname(this.relativeFilepath).split('/')[2];
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

    this._engine = engine;

    return this._engine;
  }

  // This is the remainder of the engine path if it was a special case (shared)
  engineRemainder() {
    const splitEngine = this.engine().split('/');
    return splitEngine.splice(1, splitEngine.length).join('/');
  }

  pathRemainder() {
    if (this._pathRemainder) {
      return this._pathRemainder;
    }

    this._pathRemainder = '';
    if (this.isComponent()) {
      this._pathRemainder =
        path.dirname(this.relativeFilepath).split('components/')[1] || '';
    }
    return this._pathRemainder;
  }

  /**
   * This is the platform type - core, extended, lib, engine-lib
   */
  platform() {
    if (this._platform) {
      return this._platform;
    }

    this._platform = path.dirname(this.relativeFilepath).split('/')[0];
    return this._platform;
  }

  specializedName() {
    if (this._specializedName) {
      return this._specializedName;
    }

    this._specializedName = path.join(
      this.engine(),
      this.pathRemainder(),
      this.ext()
    );
    if (this.isTest()) {
      this._specializedName = path.join('tests', this.testType());
    }

    return this._specializedName;
  }
}
