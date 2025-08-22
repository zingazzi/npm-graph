import * as vscode from 'vscode';
import { DependencyGraph } from '../types';

/**
 * Webview provider for dependency graph visualization
 */
export class DependencyGraphProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'node-module-map.dependencyGraph';

  private _disposables: vscode.Disposable[] = [];
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    // Set webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media'),
        vscode.Uri.joinPath(this._extensionUri, 'out/compiled'),
      ]
    };

    // Set the webview's initial html content
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    this._setWebviewMessageListener(webviewView.webview);

    // Handle webview visibility changes
    webviewView.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  /**
   * Update the webview with new dependency graph data
   */
  public updateGraph(graph: DependencyGraph) {
    if (this._view) {
      this._view.webview.postMessage({
        command: 'updateGraph',
        data: graph
      });
    }
  }

  /**
   * Get HTML content for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled', 'webview.css')
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Node Module Map</title>
        <link rel="stylesheet" type="text/css" href="${styleUri}">
    </head>
    <body>
        <div id="app">
            <div class="header">
                <h1>Node Module Map</h1>
                <div class="controls">
                    <button id="refresh-btn">Refresh</button>
                    <button id="export-btn">Export</button>
                </div>
            </div>

            <div class="filters">
                <input type="text" id="search-input" placeholder="Search packages...">
                <div class="filter-toggles">
                    <label><input type="checkbox" id="show-deps" checked> Dependencies</label>
                    <label><input type="checkbox" id="show-dev-deps" checked> Dev Dependencies</label>
                    <label><input type="checkbox" id="show-peer-deps"> Peer Dependencies</label>
                    <label><input type="checkbox" id="show-optional-deps"> Optional Dependencies</label>
                </div>
            </div>

            <div class="graph-container">
                <div id="graph-canvas"></div>
                <div id="loading" class="loading">Loading dependency graph...</div>
                <div id="no-data" class="no-data" style="display: none;">
                    No dependencies found. Make sure you have package.json files in your workspace.
                </div>
            </div>

            <div class="sidebar">
                <div class="stats">
                    <h3>Statistics</h3>
                    <div id="stats-content">
                        <div class="stat-item">
                            <span class="stat-label">Total Packages:</span>
                            <span class="stat-value" id="total-packages">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Dependencies:</span>
                            <span class="stat-value" id="total-deps">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Conflicts:</span>
                            <span class="stat-value" id="conflicts">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Vulnerabilities:</span>
                            <span class="stat-value" id="vulnerabilities">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Outdated:</span>
                            <span class="stat-value" id="outdated">-</span>
                        </div>
                    </div>
                </div>

                <div class="package-info" id="package-info" style="display: none;">
                    <h3>Package Information</h3>
                    <div id="package-details"></div>
                </div>
            </div>
        </div>

        <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * Set up message listener for webview communication
   */
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'refresh':
            this._handleRefresh();
            break;
          case 'export':
            this._handleExport();
            break;
          case 'packageSelected':
            this._handlePackageSelection(message.data);
            break;
          case 'filterChanged':
            this._handleFilterChange(message.data);
            break;
          default:
            console.log('Unknown message from webview:', message);
        }
      },
      undefined,
      this._disposables
    );
  }

  /**
   * Handle refresh request from webview
   */
  private _handleRefresh() {
    console.log('Refresh requested from webview');
    // This will trigger a new dependency scan
    vscode.commands.executeCommand('node-module-map.showDependencyGraph');
  }

  /**
   * Handle export request from webview
   */
  private _handleExport() {
    console.log('Export requested from webview');
    // This will implement graph export functionality
    vscode.window.showInformationMessage('Export functionality coming soon!');
  }

  /**
   * Handle package selection from webview
   */
  private _handlePackageSelection(packageData: unknown) {
    console.log('Package selected:', packageData);
    // This will show package details in the sidebar
  }

  /**
   * Handle filter changes from webview
   */
  private _handleFilterChange(filterData: unknown) {
    console.log('Filter changed:', filterData);
    // This will update the graph visualization based on filters
  }

  /**
   * Dispose of resources
   */
  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
