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
    console.log('DependencyGraphProvider.resolveWebviewView called');
    console.log('Webview view:', webviewView);
    console.log('Webview view type:', webviewView.viewType);

    this._view = webviewView;

    // Set webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled'),
        vscode.Uri.joinPath(this._extensionUri, 'src', 'webview'),
      ]
    };

    console.log('Webview options set');

    // Set the webview's initial html content
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    console.log('HTML content set');

    // Handle messages from the webview
    this._setWebviewMessageListener(webviewView.webview);

    // Handle webview visibility changes
    webviewView.onDidDispose(() => this.dispose(), null, this._disposables);

    console.log('Webview view resolved successfully');
  }

  /**
   * Update the webview with new dependency graph data
   */
  public updateGraph(graph: DependencyGraph) {
    console.log('DependencyGraphProvider.updateGraph called with:', graph);
    console.log('Nodes count:', graph.nodes.length);
    console.log('Edges count:', graph.edges.length);

    if (this._view) {
      console.log('Webview view exists, sending message...');
      try {
        this._view.webview.postMessage({
          command: 'updateGraph',
          data: graph
        });
        console.log('Message sent to webview successfully');
      } catch (error) {
        console.error('Error sending message to webview:', error);
        throw error; // Re-throw to be caught by the extension
      }
    } else {
      console.log('Webview view does not exist yet');
      throw new Error('Webview view not available');
    }
  }

  /**
   * Get HTML content for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'compiled', 'webview'));
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node Module Map - Dependency Graph</title>
    <link rel="stylesheet" href="${cssUri}/webview.css">
    <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Node Module Map</h1>
            <div class="header-controls">
                <button id="refresh-btn" class="btn btn-primary">
                    <span class="icon">🔄</span>
                    Refresh
                </button>
                <button id="export-btn" class="btn btn-secondary">
                    <span class="icon">📤</span>
                    Export
                </button>
            </div>
        </header>

        <div class="controls-panel">
            <div class="control-group">
                <label for="depth-slider">Dependency Depth:</label>
                <div class="depth-control">
                    <input type="range" id="depth-slider" min="0" max="5" value="0" class="depth-slider">
                    <span id="depth-label" class="depth-label">Depth: 0</span>
                </div>
            </div>

            <div class="control-group">
                <label>Dependency Types:</label>
                <div class="filter-toggles">
                    <label class="checkbox-label">
                        <input type="checkbox" name="showDevDependencies" checked>
                        Dev Dependencies
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="showPeerDependencies" checked>
                        Peer Dependencies
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="showOptionalDependencies" checked>
                        Optional Dependencies
                    </label>
                </div>
            </div>

            <div class="control-group">
                <label>Status Filters:</label>
                <div class="filter-toggles">
                    <label class="checkbox-label">
                        <input type="checkbox" name="showOutdated" checked>
                        Show Outdated
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="showConflicts" checked>
                        Show Conflicts
                    </label>
                </div>
            </div>

            <div class="control-group">
                <label for="search-input">Search:</label>
                <input type="text" id="search-input" placeholder="Search packages or versions..." class="search-input">
            </div>
        </div>

        <div class="main-content">
            <div class="graph-container">
                <div id="dependency-graph" class="dependency-graph"></div>
                <div id="loading" class="loading" style="display: none;">
                    <div class="spinner"></div>
                    <p>Analyzing dependencies...</p>
                </div>
                <div id="no-data" class="no-data" style="display: none;">
                    <p>No dependencies found in this workspace.</p>
                    <p>Make sure you have a package.json file in your workspace root.</p>
                </div>
            </div>

            <div class="sidebar">
                <div class="sidebar-section">
                    <h3>Statistics</h3>
                    <div id="statistics" class="statistics">
                        <div class="stat-item">
                            <span class="stat-label">Total Packages:</span>
                            <span class="stat-value">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Dependencies:</span>
                            <span class="stat-value">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Conflicts:</span>
                            <span class="stat-value conflict">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Outdated:</span>
                            <span class="stat-value outdated">-</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Vulnerabilities:</span>
                            <span class="stat-value vulnerable">-</span>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3>Legend</h3>
                    <div class="legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #4CAF50; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Up to Date</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #FF9800; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Outdated</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #F44336; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Version Conflict</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #9C27B0; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Vulnerable</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #2196F3; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Dev Dependency</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #FF5722; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Peer Dependency</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background-color: #607D8B; width: 20px; height: 20px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
                            <span>Optional Dependency</span>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3>Package Info</h3>
                    <div id="package-info" class="package-info" style="display: none;">
                        <div id="package-details"></div>
                    </div>
                    <div class="no-selection">
                        <p>Click on a node or edge to see details</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="tooltip" class="tooltip" style="display: none;"></div>

    <script src="${webviewUri}/webview.js"></script>
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
          case 'updateDepth':
            this._handleDepthUpdate(message.data);
            break;
          case 'updateFilters':
            this._handleFilterUpdate(message.data);
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
   * Handle depth updates from webview
   */
  private _handleDepthUpdate(depthData: { maxDepth: number }) {
    console.log('Depth updated:', depthData);
    // Trigger a new dependency scan with the new depth
    vscode.commands.executeCommand('node-module-map.showDependencyGraph', depthData.maxDepth);
  }

  /**
   * Handle filter updates from webview
   */
  private _handleFilterUpdate(filterData: unknown) {
    console.log('Filters updated:', filterData);
    // This will update the graph visualization based on new filters
  }

  /**
   * Dispose of resources
   */
  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
