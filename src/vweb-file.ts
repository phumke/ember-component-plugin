'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import { getRelativeFilepath } from './vweb-file-taxonomy';

// This takes a relative file path
export class File {
  relativeFilepath = null;

  constructor(
    public readonly workspaceRoot: string,
    public readonly uri: vscode.Uri
  ) {
    this.relativeFilepath = getRelativeFilepath(workspaceRoot, uri.path);
  }
}
