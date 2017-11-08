'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { File } from './vweb-file';
import { FileTaxonomy, getRelativeFilepath } from './vweb-file-taxonomy';
import { Component, ComponentSet } from './vweb-component';
import { getTestFiles, getOpenFiles } from './open-editors';

export class ComponentTreeElement extends vscode.TreeItem {
    contextValue = 'component';
    iconPath = null;

    constructor(
        public readonly component: Component,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(component.callableName(), collapsibleState);
        let iconName = 'shared';
        if (component.file.isCore()) {
            iconName = 'core';
        } else if (component.file.isExtended()) {
            iconName = 'extended';
        }
        this.iconPath = {
            light: path.join(__filename, '../..', 'icons', iconName + '_light.png'),
            dark: path.join(__filename, '../..', 'icons', iconName + '_dark.png')
        };
    }
}

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
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
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
            dark: path.join(__filename, '../..', 'icons', iconName)
        };
    }
}

export class EmberComponentsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    openComponents: ComponentSet;
    fileTaxonomy: FileTaxonomy;

    constructor(private workspaceRoot: string = vscode.workspace.rootPath) {
        this.fileTaxonomy = new FileTaxonomy(workspaceRoot);
        this.openComponents = new ComponentSet();

        if (!this.workspaceRoot || !this.fileTaxonomy.fileExists('core') || !this.fileTaxonomy.fileExists('core')) {
            console.error('Workspace root is non voyager-web.');
            return;
        }

        // this.refresh();
    }

    // This will open the clicked on file
    openFile(relativeFilePath: string) {
        const fullPath: string = this.fileTaxonomy.getFullPath(relativeFilePath);
        var uri: vscode.Uri = vscode.Uri.file(fullPath);
        vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
            vscode.window.showTextDocument(doc);
        }, (error: any) => {
            console.error(error);
        });
    }

    openComponent(fileUri): void {
        const filepath = fileUri.path;
        const file = new File(getRelativeFilepath(this.workspaceRoot, filepath));
        const filteredFiles = this.fileTaxonomy.filterNonComponents([file]);
        this.openComponents.add(new Component(filteredFiles[0]));
        this._onDidChangeTreeData.fire();
    }

    closeComponent(treeItem: vscode.TreeItem): void {
        if (treeItem.contextValue === 'component') {
            this.openComponents.delete((<ComponentTreeElement> treeItem).component);
        } else {
            this.openComponents.delete(this.getComponentFromFile((<FileTreeElement> treeItem).file));
        }

        this._onDidChangeTreeData.fire();
    }

    refresh(): void {
        this.getOpenFiles().then((files) => {
            let openFiles = this.fileTaxonomy.filterNonComponents(files);
            openFiles.forEach((file) => {
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
            return Promise.resolve(this.createComponentBranches());
        } else if (element.constructor.name === 'ComponentTreeElement') {
            return Promise.resolve(this.createFileBranches(<ComponentTreeElement> element));
        } else {
            return Promise.resolve([]);
        }
    }

    // This creates new component tree branches from all of the files within the tree
    createComponentBranches(): ComponentTreeElement[] {
        return this.openComponents.toSortedArray().map((component) => {
            return new ComponentTreeElement(component, vscode.TreeItemCollapsibleState.Collapsed)
        });
    }

    createFileBranches(componentBranch: ComponentTreeElement): FileTreeElement[] {
        const files = this.fileTaxonomy.getComponentFiles(componentBranch.component);
        return files.map((file) => {
            return new FileTreeElement(file, vscode.TreeItemCollapsibleState.None);
        });
    }

    getOpenFiles(): Promise<File[]> {
        // return getTestFiles(this.workspaceRoot);
        return getOpenFiles(this.workspaceRoot);
    }

    getComponentFromFile(file): Component {
        return new Component(file);
    }
}
