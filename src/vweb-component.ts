'use strict';

import { File } from './vweb-file';
import {
  getComponentName,
  getEngine,
  getPathRemainder,
} from './vweb-file-taxonomy';

export class Component {
  name = null;
  engine = null;
  pathRemainder = null;
  platforms = {};

  constructor(public readonly file: File) {
    this.name = getComponentName(file.relativeFilepath);
    this.engine = getEngine(file.relativeFilepath);
    this.pathRemainder = getPathRemainder(file.relativeFilepath);
  }

  callableName() {
    let name = this.engine + '::';
    if (this.pathRemainder) {
      name = name + this.pathRemainder + '/';
    }

    return name + this.name;
  }

  toIdString() {
    return this.name + this.engine + this.pathRemainder;
  }
}

export class ComponentSet {
  map = new Map();

  has(value: Component): boolean {
    return this.map.has(value.toIdString());
  }

  add(value: Component) {
    if (!this.has(value)) {
      return this.map.set(value.toIdString(), value);
    }

    return this;
  }

  delete(value: Component) {
    if (this.has(value)) {
      return this.map.delete(value.toIdString());
    }

    return false;
  }

  toArray(): Component[] {
    return Array.from(this.map.values());
  }

  toSortedArray(): Component[] {
    const sortedArray = this.toArray().sort();
    return sortedArray;
  }
}
