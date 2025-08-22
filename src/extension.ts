// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DependencyScanner } from './services/dependencyScanner';
import { DependencyGraphProvider } from './webview/dependencyGraphProvider';

let dependencyGraphProvider: DependencyGraphProvider;

/**
 * Main extension entry point
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Node Module Map extension is now active!');

  // Create dependency graph provider
  dependencyGraphProvider = new DependencyGraphProvider(context.extensionUri);

  // Register webview view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'node-module-map.dependencyGraph',
      dependencyGraphProvider
    )
  );

  // Register commands
  const showDependencyGraph = vscode.commands.registerCommand(
    'node-module-map.showDependencyGraph',
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
    'node-module-map.analyzeDependencies',
    async () => {
      try {
        await analyzeDependenciesCommand();
      } catch (error) {
        console.error('Error analyzing dependencies:', error);
        vscode.window.showErrorMessage('Failed to analyze dependencies. See console for details.');
      }
    }
  );

  context.subscriptions.push(showDependencyGraph, analyzeDependencies);
}

/**
 * Show dependency graph command implementation
 */
async function showDependencyGraphCommand(webviewProvider: DependencyGraphProvider) {
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: 'Analyzing dependencies...',
    cancellable: false
  };

  await vscode.window.withProgress(progressOptions, async (progress) => {
    progress.report({ message: 'Scanning workspace for package.json files...' });

    try {
      const scanner = DependencyScanner.getInstance();

      // Scan with default options (can be enhanced with user preferences later)
      const graph = await scanner.scanWorkspace({
        maxDepth: 3,
        includeDevDependencies: true,
        includePeerDependencies: true,
        includeOptionalDependencies: true,
        enableVersionChecking: true
      });

      console.log('Dependency scan completed. Graph data:', graph);
      console.log('Nodes count:', graph.nodes.length);
      console.log('Edges count:', graph.edges.length);
      console.log('Sample nodes:', graph.nodes.slice(0, 3));
      console.log('Sample edges:', graph.edges.slice(0, 3));

      progress.report({ message: 'Updating visualization...' });

      // Update the webview with the graph data
      webviewProvider.updateGraph(graph);

      // Show the dependency graph view container first
      await vscode.commands.executeCommand('workbench.view.extension.nodeModuleMap');

      // Focus on the webview
      await vscode.commands.executeCommand('workbench.view.extension.nodeModuleMap.dependencyGraph');

      vscode.window.showInformationMessage(
        `Dependency graph generated: ${graph.nodes.length} packages, ${graph.edges.length} dependencies`
      );

    } catch (error) {
      console.error('Error scanning dependencies:', error);
      vscode.window.showErrorMessage(
        'Failed to scan dependencies. Make sure you have package.json files in your workspace.'
      );
    }
  });
}

/**
 * Analyze dependencies command implementation
 */
async function analyzeDependenciesCommand() {
  const progressOptions = {
    location: vscode.ProgressLocation.Notification,
    title: 'Analyzing dependencies...',
    cancellable: false
  };

  await vscode.window.withProgress(progressOptions, async (progress) => {
    progress.report({ message: 'Scanning dependencies for issues...' });

    try {
      const scanner = DependencyScanner.getInstance();
      const graph = await scanner.scanWorkspace({
        maxDepth: 5, // Deeper scan for analysis
        includeDevDependencies: true,
        includePeerDependencies: true,
        includeOptionalDependencies: true,
        enableVersionChecking: true
      });

      progress.report({ message: 'Generating analysis report...' });

      // Count issues
      const outdated = graph.nodes.filter(n => n.status === 'outdated').length;
      const conflicts = graph.nodes.filter(n => n.status === 'conflict').length;
      const vulnerable = graph.nodes.filter(n => n.status === 'vulnerable').length;

      // Show analysis results
      let message = `Analysis complete:\n`;
      message += `• Total packages: ${graph.nodes.length}\n`;
      message += `• Total dependencies: ${graph.edges.length}\n`;

      if (outdated > 0) {
        message += `• ⚠️  ${outdated} outdated packages\n`;
      }
      if (conflicts > 0) {
        message += `• ❌ ${conflicts} version conflicts\n`;
      }
      if (vulnerable > 0) {
        message += `• 🚨 ${vulnerable} vulnerable packages\n`;
      }

      if (outdated === 0 && conflicts === 0 && vulnerable === 0) {
        message += `• ✅ All packages are up to date!`;
      }

      vscode.window.showInformationMessage(message);

      // Also update the graph view if it's open
      if (dependencyGraphProvider) {
        dependencyGraphProvider.updateGraph(graph);
      }

    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      vscode.window.showErrorMessage('Failed to analyze dependencies. See console for details.');
    }
  });
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('Node Module Map extension is now deactivated!');
}
