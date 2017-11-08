'use strict';

import { File } from './vweb-file';

const componentPlatformOrdering = {
  "lib": 0,
  "engine-lib": 0,
  "core": 1,
  "extended": 2,
}

export class Component {
  name = null;
  platform = null;
  engine = null;
  pathRemainder = null;

  constructor(
      public readonly file: File
  ) {
      this.name = file.name();
      this.platform = file.platform();
      this.engine = file.engine();
      this.pathRemainder = file.pathRemainder();
  }

  callableName() {
    let name = this.name + ' (' + this.engine + '::';
    if (this.pathRemainder) {
        name = name + this.pathRemainder + '/';
    }

    return name + this.name + ')';
  }

  toIdString() {
      return this.name + this.platform + this.engine + this.pathRemainder;
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
    const sortedArray = this.toArray().sort(compareComponents);
    return sortedArray;
  }
}

function compareComponents(left: Component, right: Component) {
  if (left.name < right.name) {
      return -1;
  } else if (left.name > right.name) {
      return 1;
  }
  return componentPlatformOrdering[left.platform] - componentPlatformOrdering[right.platform];
}

