'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
  EmberComponentsProvider,
  getOutputChannel,
} from './ember-component-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  const emberComponentsProvider = new EmberComponentsProvider(rootPath);

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'emberComponents',
      emberComponentsProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('emberComponents.openComponent', file =>
      emberComponentsProvider.openComponent(file)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'emberComponents.closeComponent',
      component => emberComponentsProvider.closeComponent(component)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'emberComponents.runTests',
      componentTreeItem => emberComponentsProvider.runTests(componentTreeItem)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'emberComponents.runUnitTests',
      componentTreeItem =>
        emberComponentsProvider.runUnitTests(componentTreeItem)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'emberComponents.runIntTests',
      componentTreeItem =>
        emberComponentsProvider.runIntegrationTests(componentTreeItem)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'emberComponents.runAcceptTests',
      componentTreeItem =>
        emberComponentsProvider.runAcceptanceTests(componentTreeItem)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('emberComponents.openFile', file =>
      emberComponentsProvider.openFile(file)
    )
  );

  getOutputChannel().appendLine('ember-component-view is now active');
}
