// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DependencyScanner } from './services/dependencyScanner';
import { Utils } from './utils';
import { DependencyGraph } from './types';
import { DependencyGraphProvider } from './webview/dependencyGraphProvider';

/**
 * Main extension entry point
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Node Module Map extension is now active!');

  // Create webview provider
  const dependencyGraphProvider = new DependencyGraphProvider(context.extensionUri);

  // Register webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      DependencyGraphProvider.viewType,
      dependencyGraphProvider
    )
  );

  // Register commands
  const showDependencyGraph = vscode.commands.registerCommand(
    'npm-graph.showDependencyGraph',
    async () => {
      try {
        await showDependencyGraphCommand(dependencyGraphProvider);
      } catch (error) {
        console.error('Error showing dependency graph:', error);
        vscode.window.showErrorMessage('Failed to show dependency graph. See console for details.');
      }
    }
  );

  const analyzeDependencies = vscode.commands.registerCommand(
    'npm-graph.analyzeDependencies',
    async () => {
      try {
        await analyzeDependenciesCommand();
      } catch (error) {
        console.error('Error analyzing dependencies:', error);
        vscode.window.showErrorMessage('Failed to analyze dependencies. See console for details.');
      }
    }
  );

  // Add commands to subscriptions
  context.subscriptions.push(showDependencyGraph, analyzeDependencies);

  // Register workspace context key for when clauses
  updateWorkspaceContext();

  // Listen for workspace changes
  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    updateWorkspaceContext();
  });
}

/**
 * Show dependency graph command implementation
 */
async function showDependencyGraphCommand(webviewProvider: DependencyGraphProvider) {
  // Check if workspace has npm files
  if (!(await Utils.hasNpmFiles())) {
    vscode.window.showWarningMessage('No npm projects found in the current workspace.');
    return;
  }

  // Show progress indicator
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning dependencies...',
      cancellable: false
    },
    async (progress) => {
      progress.report({ increment: 0 });

      // Scan dependencies
      const scanner = DependencyScanner.getInstance();
      const graph = await scanner.scanWorkspace();

      progress.report({ increment: 75 });

      // Update webview with real data
      webviewProvider.updateGraph(graph);

      // Show webview panel
      vscode.commands.executeCommand('workbench.view.extension.nodeModuleMap');

      progress.report({ increment: 100 });

      // Show summary message
      await showDependencyGraphResults(graph);
    }
  );
}

/**
 * Analyze dependencies command implementation
 */
async function analyzeDependenciesCommand() {
  // Check if workspace has npm files
  if (!(await Utils.hasNpmFiles())) {
    vscode.window.showWarningMessage('No npm projects found in the current workspace.');
    return;
  }

  // Show progress indicator
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing dependencies...',
      cancellable: false
    },
    async (progress) => {
      progress.report({ increment: 0 });

            // Scan dependencies
      const scanner = DependencyScanner.getInstance();
      const graph = await scanner.scanWorkspace();

      progress.report({ increment: 50 });

      // Show analysis results
      await showDependencyAnalysis(graph);

      progress.report({ increment: 100 });
    }
  );
}

/**
 * Show dependency graph results
 */
async function showDependencyGraphResults(graph: DependencyGraph) {
  // For now, show a simple message with basic info
  // This will be replaced with the actual graph visualization webview
  const message = `Dependency scan completed!\n\n` +
    `📦 Total packages: ${graph.metadata.totalPackages}\n` +
    `🔗 Total dependencies: ${graph.metadata.totalDependencies}\n` +
    `⚠️  Conflicts: ${graph.metadata.conflicts}\n` +
    `🔒 Vulnerabilities: ${graph.metadata.vulnerabilities}\n` +
    `🔄 Outdated: ${graph.metadata.outdated}\n\n` +
    `Graph visualization coming soon!`;

  vscode.window.showInformationMessage(message);
}

/**
 * Show dependency analysis results
 */
async function showDependencyAnalysis(graph: DependencyGraph) {
  // For now, show a simple message with analysis info
  // This will be replaced with a detailed analysis panel
  const message = `Dependency analysis completed!\n\n` +
    `📊 Analysis Summary:\n` +
    `• ${graph.metadata.totalPackages} packages analyzed\n` +
    `• ${graph.metadata.conflicts} version conflicts detected\n` +
    `• ${graph.metadata.vulnerabilities} security vulnerabilities found\n` +
    `• ${graph.metadata.outdated} packages have updates available\n\n` +
    `Detailed analysis panel coming soon!`;

  vscode.window.showInformationMessage(message);
}

/**
 * Update workspace context for when clauses
 */
async function updateWorkspaceContext() {
  const hasNpmFiles = await Utils.hasNpmFiles();
  vscode.commands.executeCommand('setContext', 'workspaceHasNpmFiles', hasNpmFiles);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('Node Module Map extension deactivated');
}
