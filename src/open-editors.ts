'use strict';

import * as vscode from 'vscode';
import { File } from './vweb-file';
import { getRelativeFilepath } from './vweb-file-taxonomy';

// iterate through the editors that are open and load them - will need to wait for each to resolve since it takes a second to become active
export async function getOpenFiles(workspaceRootPath: string): Promise<File[]> {
  const editorTracker = new ActiveEditorTracker();

  let currentActive = vscode.window.activeTextEditor;
  let editor = null;
  const openEditors: vscode.TextEditor[] = [];
  do {
    editor = await editorTracker.awaitNext(500);
    openEditors.push(editor);
  } while (
    (currentActive === undefined && editor === undefined) ||
    editor.document.uri.path != currentActive.document.uri.path
  );

  editorTracker.dispose();

  const editors = openEditors.filter(_ => _.document !== undefined).map(_ => {
    return new File(workspaceRootPath, _.document.uri);
  });

  return editors;
}

// This file is needed solely due to a missing vscode API for accessing the list of open editors
// it's a hacky workaround that activates each editor in turn and records the current URI
// See https://github.com/eamodio/vscode-restore-editors/blob/master/src/activeEditorTracker.ts
export class ActiveEditorTracker extends vscode.Disposable {
  private _disposable: vscode.Disposable;
  private _resolver:
    | ((value?: vscode.TextEditor | PromiseLike<vscode.TextEditor>) => void)
    | undefined;

  constructor() {
    super(() => this.dispose());

    this._disposable = vscode.window.onDidChangeActiveTextEditor(
      e => this._resolver && this._resolver(e)
    );
  }

  dispose() {
    this._disposable && this._disposable.dispose();
  }

  async awaitClose(timeout: number = 500): Promise<vscode.TextEditor> {
    this.close();
    return this.wait(timeout);
  }

  awaitNext(timeout: number = 500): Promise<vscode.TextEditor> {
    this.next();
    return this.wait(timeout);
  }

  async close(): Promise<{} | undefined> {
    return vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }

  async next(): Promise<{} | undefined> {
    return vscode.commands.executeCommand('workbench.action.nextEditor');
  }

  async wait(timeout: number = 500): Promise<vscode.TextEditor> {
    const editor = await new Promise<vscode.TextEditor>((resolve, reject) => {
      let timer: any;

      this._resolver = (editor: vscode.TextEditor) => {
        if (timer) {
          clearTimeout(timer as any);
          timer = 0;
          resolve(editor);
        }
      };

      timer = setTimeout(() => {
        resolve(vscode.window.activeTextEditor);
        timer = 0;
      }, timeout) as any;
    });
    this._resolver = undefined;
    return editor;
  }
}
