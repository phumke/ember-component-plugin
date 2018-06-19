'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import {
  FileTaxonomy,
  getComponentName,
  getExt,
  getName,
  getPlatform,
  getRelativeFilepath,
  getSpecializedName,
} from './vweb-file-taxonomy';
import { Component, ComponentSet } from './vweb-component';
import { getOpenFiles } from './open-editors';
import { Platform } from './vweb-platform';

let _channel: vscode.OutputChannel;
export function getOutputChannel(): vscode.OutputChannel {
  if (!_channel) {
    _channel = vscode.window.createOutputChannel('Ember Components');
  }
  return _channel;
}

/**
 * This is an interface class for vscode proper
 * This creates a tree element for the plugin that shows the component with nested platforms within it
 */
export class ComponentTreeElement extends vscode.TreeItem {
  contextValue = 'component';
  iconPath = null;

  constructor(
    public readonly component: Component,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(component.callableName(), collapsibleState);
  }
}

/**
 * This is an interface class for vscode proper
 * This creates a tree element for the plugin that shows the specific platform for a component with nested files within it
 */
export class PlatformTreeElement extends vscode.TreeItem {
  contextValue = 'platform';
  iconPath = null;

  constructor(
    public readonly platform: Platform,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(platform.name, collapsibleState);

    let iconName = 'shared';
    if (platform.name === 'core') {
      iconName = 'core';
    } else if (platform.name === 'extended') {
      iconName = 'extended';
    }
    this.iconPath = {
      light: path.join(__filename, '../..', 'icons', iconName + '_light.png'),
      dark: path.join(__filename, '../..', 'icons', iconName + '_dark.png'),
    };
  }
}

/**
 * This is an interface class for vscode proper
 * This creates a tree element for the plugin that shows a specific file
 */
export class FileTreeElement extends vscode.TreeItem {
  contextValue = 'file';
  command = {
    command: 'emberComponents.openFile',
    title: '',
    arguments: [this.file],
  };
  iconPath = null;

  constructor(
    public readonly file: File,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(getSpecializedName(file.relativeFilepath), collapsibleState);

    const ext = getExt(file.relativeFilepath);
    let iconName = 'file_type_js.svg';
    if (ext == 'hbs') {
      iconName = 'file_type_handlebars.svg';
    } else if (ext == 'scss') {
      iconName = 'file_type_scss.svg';
    } else if (
      ext == 'js' &&
      getName(this.file.relativeFilepath).includes('test')
    ) {
      iconName = 'file_type_testjs.svg';
    }

    this.iconPath = {
      light: path.join(__filename, '../..', 'icons', iconName),
      dark: path.join(__filename, '../..', 'icons', iconName),
    };
  }
}

/**
 * This actually builds the vs-code plugin experience, putting together the tree view
 * This also has all of the functions that are defined as the command line interfaces for the tool
 */
export class EmberComponentsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

  openComponents: ComponentSet; // The set of open components viewed within the plugin
  fileTaxonomy: FileTaxonomy; // Used to search through the files

  constructor(private workspaceRoot: string = vscode.workspace.rootPath) {
    this.fileTaxonomy = new FileTaxonomy(workspaceRoot);
    this.openComponents = new ComponentSet();

    if (
      !this.workspaceRoot ||
      !this.fileTaxonomy.fileExists('core') ||
      !this.fileTaxonomy.fileExists('extended')
    ) {
      getOutputChannel().appendLine('Workspace root is non voyager-web.');
      return;
    }
  }

  _findFilesWrapper(
    toFind: string,
    count = 50,
    toExcludeList = [
      '**/node_modules',
      '**/bower_components',
      'build',
      'dist',
      'tmp',
      'i18n',
      '.vscode',
    ]
  ): Thenable<vscode.Uri[]> {
    const toExclude = `{${toExcludeList.join(',')}}`;
    return vscode.workspace.findFiles(toFind, toExclude, 50);
  }

  /**
   * This will open the file that was clicked on within the plugin
   */
  openFile(file: File) {
    vscode.workspace.openTextDocument(file.uri).then(
      (doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc);
      },
      (error: any) => {
        getOutputChannel().appendLine(error);
        getOutputChannel().show(true);
      }
    );
  }

  /**
   * This will create a new component entry within the plugin given a specified file
   *
   * @param fileUri
   */
  openComponent(fileUri): void {
    const file = new File(this.workspaceRoot, fileUri);
    const filteredFiles = this.fileTaxonomy.filterNonComponents([file]);
    if (filteredFiles.length > 0) {
      const component = new Component(filteredFiles[0]);

      getOutputChannel().appendLine('Opening: ' + component.callableName());

      // find most files
      this._findFilesWrapper('**/*' + component.name + '.*').then(
        (workspaceFiles: vscode.Uri[]) => {
          this.addItemsToTreeView(component, workspaceFiles);
        },
        (error: any) => {
          getOutputChannel().appendLine(error);
          getOutputChannel().show(true);
        }
      );
      // find outstanding test files
      this._findFilesWrapper('**/*' + component.name + '*-test.js').then(
        (workspaceFiles: vscode.Uri[]) => {
          this.addItemsToTreeView(component, workspaceFiles);
        },
        (error: any) => {
          getOutputChannel().appendLine(error);
          getOutputChannel().show(true);
        }
      );

      this.openComponents.add(component);
      this._onDidChangeTreeData.fire();
    } else {
      getOutputChannel().appendLine(
        'Error: ' + file.relativeFilepath + ' is not a component file'
      );
    }
  }

  addItemsToTreeView(component: Component, foundFiles: vscode.Uri[]): void {
    getOutputChannel().appendLine('Found Files:');

    foundFiles.map(foundFile => {
      getOutputChannel().appendLine(foundFile.path);

      const currFile = new File(this.workspaceRoot, foundFile);
      const platform = getPlatform(
        getRelativeFilepath(this.workspaceRoot, foundFile.path)
      );
      if (!component.platforms[platform]) {
        component.platforms[platform] = new Platform(platform);
      }
      component.platforms[platform].files.push(currFile);

      this._onDidChangeTreeData.fire();
    });
  }

  /**
   * This will close a component within the plugin given a specified component
   *
   * @param treeItem
   */
  closeComponent(treeItem: vscode.TreeItem): void {
    if (treeItem.contextValue === 'component') {
      this.openComponents.delete((<ComponentTreeElement>treeItem).component);
    } else {
      this.openComponents.delete(
        new Component((<FileTreeElement>treeItem).file)
      );
    }

    this._onDidChangeTreeData.fire();
  }

  /**
   * This will run the unit tests for the selected tree item within the plugin
   * @param treeItem
   */
  runUnitTests(treeItem: vscode.TreeItem): void {
    this.runTests(treeItem, 'unit');
  }

  /**
   * This will run the integration tests for the selected tree item within the plugin
   * @param treeItem
   */
  runIntegrationTests(treeItem: vscode.TreeItem): void {
    this.runTests(treeItem, 'integration');
  }

  /**
   * This will run the acceptance tests for the selected tree item within the plugin
   * @param treeItem
   */
  runAcceptanceTests(treeItem: vscode.TreeItem): void {
    this.runTests(treeItem, 'acceptance');
  }

  /**
   * This will attempt to run a given type of test for a component wihtin the browser, or all tests that match that specializedName.
   *
   * @param treeItem the clicked on component
   * @param testType the type of component, options are 'unit', 'integration', 'acceptance', or '', defaults to ''
   */
  runTests(treeItem: vscode.TreeItem, testType: string = ''): void {
    const { testUrl } = vscode.workspace.getConfiguration(
      'ember-component-view'
    );
    const filterBase = '?filter=';

    const treeLevel = treeItem.contextValue;
    let componentName;
    if (treeLevel === 'component') {
      componentName = (<ComponentTreeElement>treeItem).component.name;
    } else if (treeLevel === 'platform') {
      // TODO fix this - it's pretty hacky right now
      componentName = getComponentName(
        (<PlatformTreeElement>treeItem).platform.files[0].relativeFilepath
      );
    } else {
      componentName = getComponentName(
        (<FileTreeElement>treeItem).file.relativeFilepath
      );
    }

    const filter = testType
      ? '/' + testType + '.*' + componentName + '/i'
      : componentName;

    const browserPath = testUrl + filterBase + filter;

    getOutputChannel().appendLine('Running test: ' + browserPath);

    // Open in browser
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.parse(encodeURI(browserPath))
    );
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      // If this is the top level
      return Promise.resolve(this.createComponentBranches());
    } else if (element.constructor.name === 'ComponentTreeElement') {
      // Component level
      return Promise.resolve(
        this.createPlatformBranches(<ComponentTreeElement>element)
      );
    } else if (element.constructor.name === 'PlatformTreeElement') {
      // Platform level
      return Promise.resolve(
        this.createFileBranches(<PlatformTreeElement>element)
      );
    } else {
      // File level
      return Promise.resolve([]);
    }
  }

  /**
   * This creates new component tree branches from all of the files within the tree
   */
  createComponentBranches(): ComponentTreeElement[] {
    return this.openComponents.toSortedArray().map(component => {
      return new ComponentTreeElement(
        component,
        vscode.TreeItemCollapsibleState.Collapsed
      );
    });
  }

  /**
   * This creates new platform tree branches for a given component from all of the files within the tree
   */
  createPlatformBranches(
    componentBranch: ComponentTreeElement
  ): PlatformTreeElement[] {
    const platforms = componentBranch.component.platforms;
    return Object.keys(platforms).map((key, index) => {
      return new PlatformTreeElement(
        platforms[key],
        vscode.TreeItemCollapsibleState.Collapsed
      );
    });
  }

  createFileBranches(platformBranch: PlatformTreeElement): FileTreeElement[] {
    const files = platformBranch.platform.files;
    return files.map(file => {
      return new FileTreeElement(file, vscode.TreeItemCollapsibleState.None);
    });
  }

  getOpenFiles(): Promise<File[]> {
    return getOpenFiles(this.workspaceRoot);
  }
}
