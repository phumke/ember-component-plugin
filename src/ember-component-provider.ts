'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import { FileTaxonomy, getRelativeFilepath } from './vweb-file-taxonomy';
import { Component, ComponentSet } from './vweb-component';
import { getTestFiles, getOpenFiles } from './open-editors';

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
    public readonly component: Component,
    public readonly platform: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(platform, collapsibleState);

    let iconName = 'shared';
    if (platform === 'core') {
      iconName = 'core';
    } else if (platform === 'extended') {
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
    arguments: [this.file.relativeFilepath],
  };
  iconPath = null;

  constructor(
    public readonly file: File,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(file.specializedName(), collapsibleState);

    let iconName = 'file_type_js.svg';
    if (this.file.ext() == 'hbs') {
      iconName = 'file_type_handlebars.svg';
    } else if (this.file.ext() == 'scss') {
      iconName = 'file_type_scss.svg';
    } else if (this.file.ext() == 'js' && this.file.name().includes('test')) {
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
      !this.fileTaxonomy.fileExists('core')
    ) {
      console.error('Workspace root is non voyager-web.');
      return;
    }
  }

  /**
   * This will open the file that was clicked on within the plugin
   */
  openFile(relativeFilePath: string) {
    const fullPath: string = this.fileTaxonomy.getFullPath(relativeFilePath);
    var uri: vscode.Uri = vscode.Uri.file(fullPath);
    vscode.workspace.openTextDocument(uri).then(
      (doc: vscode.TextDocument) => {
        vscode.window.showTextDocument(doc);
      },
      (error: any) => {
        console.error(error);
      }
    );
  }

  /**
   * This will create a new component entry within the plugin given a specified file
   *
   * @param fileUri
   */
  openComponent(fileUri): void {
    const filepath = fileUri.path;
    const file = new File(getRelativeFilepath(this.workspaceRoot, filepath));
    const filteredFiles = this.fileTaxonomy.filterNonComponents([file]);
    if (filteredFiles.length > 0) {
      const component = new Component(filteredFiles[0]);
      this.openComponents.add(new Component(filteredFiles[0]));
      this._onDidChangeTreeData.fire();
    }
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
   * TODO change the path to be the localhost one to handle qprod
   *
   * @param treeItem the clicked on component
   * @param testType the type of component, options are 'unit', 'integration', 'acceptance', or '', defaults to ''
   */
  runTests(treeItem: vscode.TreeItem, testType: string = ''): void {
    const rootPath = 'https://pemberly.www.linkedin.com:4443/tests/index.html';
    const filterBase = '?filter=';
    let name;
    if (treeItem.contextValue === 'component') {
      name = (<ComponentTreeElement>treeItem).component.name;
    } else {
      name = (<FileTreeElement>treeItem).file.componentName();
    }

    let filter = name;
    if (testType) {
      filter = '/' + testType + '.*' + name + '/i';
    }

    const browserPath = rootPath + filterBase + filter;
    // Open in browser
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.parse(encodeURI(browserPath))
    );
  }

  refresh(): void {
    this.getOpenFiles().then(files => {
      let openFiles = this.fileTaxonomy.filterNonComponents(files);
      openFiles.forEach(file => {
        this.openComponents.add(new Component(file));
      });
      this._onDidChangeTreeData.fire();
    });
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

  createPlatformBranches(
    componentBranch: ComponentTreeElement
  ): PlatformTreeElement[] {
    const platforms = this.fileTaxonomy.getComponentPlatforms(
      componentBranch.component
    );
    return platforms.map(platform => {
      return new PlatformTreeElement(
        componentBranch.component,
        platform,
        vscode.TreeItemCollapsibleState.Collapsed
      );
    });
  }

  createFileBranches(platformBranch: PlatformTreeElement): FileTreeElement[] {
    const files = this.fileTaxonomy.getComponentPlatformFiles(
      platformBranch.component,
      platformBranch.platform
    );
    return files.map(file => {
      return new FileTreeElement(file, vscode.TreeItemCollapsibleState.None);
    });
  }

  getOpenFiles(): Promise<File[]> {
    // return getTestFiles(this.workspaceRoot);
    return getOpenFiles(this.workspaceRoot);
  }
}
