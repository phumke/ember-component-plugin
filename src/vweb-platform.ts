'use strict';

import { File } from './vweb-file';

export class Platform {
  files = [];

  constructor(public readonly name: string) {}

  toIdString() {
    return this.name;
  }
}
