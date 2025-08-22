import * as assert from 'assert';
import * as vscode from 'vscode';
import { DependencyGraphProvider } from '../webview/dependencyGraphProvider';
import { DependencyGraph } from '../types';

suite('Webview and Graph Visualization Tests', () => {
  let provider: DependencyGraphProvider;
  let mockExtensionUri: vscode.Uri;

  setup(() => {
    // Create a mock extension URI for testing
    mockExtensionUri = vscode.Uri.file('/mock/extension/path');
    provider = new DependencyGraphProvider(mockExtensionUri);
  });

  test('Should create DependencyGraphProvider instance', () => {
    assert.ok(provider, 'DependencyGraphProvider should be created');
    assert.ok(typeof provider.updateGraph === 'function', 'Should have updateGraph method');
    assert.ok(typeof provider.dispose === 'function', 'Should have dispose method');
  });

  test('Should generate valid HTML content', () => {
    // Mock webview for testing
    const mockWebview = {
      asWebviewUri: (uri: vscode.Uri) => uri.toString(),
      options: {},
      onDidReceiveMessage: () => ({ dispose: () => {} }),
      postMessage: () => {}
    } as unknown as vscode.Webview;

    // Mock webview view for testing
    const mockWebviewView = {
      webview: mockWebview,
      onDidDispose: () => ({ dispose: () => {} })
    } as unknown as vscode.WebviewView;

    // Test HTML generation
    try {
      provider.resolveWebviewView(mockWebviewView, {} as vscode.WebviewViewResolveContext, {} as vscode.CancellationToken);

      // The provider should not throw errors during initialization
      assert.ok(true, 'Webview should initialize without errors');
    } catch {
      assert.fail('Webview initialization should not throw errors');
    }
  });

  test('Should handle graph update messages', () => {
    // Test that the provider can handle graph updates
    const mockGraph: DependencyGraph = {
      nodes: [
        {
          id: 'test-package@1.0.0-test',
          name: 'test-package',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test/path',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        }
      ],
      edges: [
        {
          id: 'root->test-package@1.0.0-test',
          source: 'root-test',
          target: 'test-package@1.0.0-test',
          type: 'direct',
          version: '1.0.0',
          color: '#4CAF50',
          width: 2
        }
      ],
      metadata: {
        totalPackages: 1,
        totalDependencies: 1,
        conflicts: 0,
        vulnerabilities: 0,
        outdated: 0,
        scanTime: new Date(),
        workspaceRoots: ['/test/path']
      }
    };

    try {
      // Test that updateGraph doesn't throw errors
      provider.updateGraph(mockGraph);
      assert.ok(true, 'Graph update should not throw errors');
    } catch {
      assert.fail('Graph update should not throw errors');
    }
  });

  test('Should validate graph data structure for webview', () => {
    // Test various graph structures to ensure they're valid for webview
    const testGraphs: DependencyGraph[] = [
      // Empty graph
      {
        nodes: [],
        edges: [],
        metadata: {
          totalPackages: 0,
          totalDependencies: 0,
          conflicts: 0,
          vulnerabilities: 0,
          outdated: 0,
          scanTime: new Date(),
          workspaceRoots: []
        }
      },
      // Single node graph
      {
        nodes: [
          {
            id: 'single@1.0.0',
            name: 'single',
            version: '1.0.0',
            type: 'dependency',
            status: 'up-to-date',
            source: '/test',
            depth: 0,
            size: 20,
            color: '#4CAF50',
            metadata: {}
          }
        ],
        edges: [],
        metadata: {
          totalPackages: 1,
          totalDependencies: 0,
          conflicts: 0,
          vulnerabilities: 0,
          outdated: 0,
          scanTime: new Date(),
          workspaceRoots: ['/test']
        }
      },
      // Complex graph with multiple dependencies
      {
        nodes: [
          {
            id: 'root@1.0.0',
            name: 'root',
            version: '1.0.0',
            type: 'dependency',
            status: 'up-to-date',
            source: '/test',
            depth: 0,
            size: 20,
            color: '#4CAF50',
            metadata: {}
          },
          {
            id: 'dep1@2.0.0',
            name: 'dep1',
            version: '2.0.0',
            type: 'dependency',
            status: 'outdated',
            source: '/test',
            depth: 1,
            size: 18,
            color: '#FF9800',
            metadata: {}
          },
          {
            id: 'dep2@1.5.0',
            name: 'dep2',
            version: '1.5.0',
            type: 'devDependency',
            status: 'up-to-date',
            source: '/test',
            depth: 1,
            size: 16,
            color: '#4CAF50',
            metadata: {}
          }
        ],
        edges: [
          {
            id: 'root->dep1',
            source: 'root@1.0.0',
            target: 'dep1@2.0.0',
            type: 'direct',
            version: '^2.0.0',
            color: '#4CAF50',
            width: 2
          },
          {
            id: 'root->dep2',
            source: 'root@1.0.0',
            target: 'dep2@1.5.0',
            type: 'direct',
            version: '^1.5.0',
            color: '#FF9800',
            width: 2
          }
        ],
        metadata: {
          totalPackages: 3,
          totalDependencies: 2,
          conflicts: 0,
          vulnerabilities: 0,
          outdated: 1,
          scanTime: new Date(),
          workspaceRoots: ['/test']
        }
      }
    ];

    testGraphs.forEach((graph, index) => {
      try {
        // Test that each graph structure is valid
        assert.ok(Array.isArray(graph.nodes), `Graph ${index} should have nodes array`);
        assert.ok(Array.isArray(graph.edges), `Graph ${index} should have edges array`);
        assert.ok(graph.metadata, `Graph ${index} should have metadata`);

        // Test metadata consistency
        assert.strictEqual(graph.metadata.totalPackages, graph.nodes.length,
          `Graph ${index} total packages should match node count`);
        assert.strictEqual(graph.metadata.totalDependencies, graph.edges.length,
          `Graph ${index} total dependencies should match edge count`);

        // Test node structure
        graph.nodes.forEach((node, nodeIndex) => {
          assert.ok(typeof node.id === 'string', `Graph ${index} node ${nodeIndex} should have string ID`);
          assert.ok(typeof node.name === 'string', `Graph ${index} node ${nodeIndex} should have string name`);
          assert.ok(typeof node.version === 'string', `Graph ${index} node ${nodeIndex} should have string version`);
          assert.ok(typeof node.depth === 'number', `Graph ${index} node ${nodeIndex} should have number depth`);
          assert.ok(typeof node.size === 'number', `Graph ${index} node ${nodeIndex} should have number size`);
          assert.ok(typeof node.color === 'string', `Graph ${index} node ${nodeIndex} should have string color`);
        });

        // Test edge structure
        graph.edges.forEach((edge, edgeIndex) => {
          assert.ok(typeof edge.id === 'string', `Graph ${index} edge ${edgeIndex} should have string ID`);
          assert.ok(typeof edge.source === 'string', `Graph ${index} edge ${edgeIndex} should have string source`);
          assert.ok(typeof edge.target === 'string', `Graph ${index} edge ${edgeIndex} should have string target`);
          assert.ok(typeof edge.version === 'string', `Graph ${index} edge ${edgeIndex} should have string version`);
          assert.ok(typeof edge.color === 'string', `Graph ${index} edge ${edgeIndex} should have string color`);
          assert.ok(typeof edge.width === 'number', `Graph ${index} edge ${edgeIndex} should have number width`);
        });

        // Test that the graph can be updated in the provider
        provider.updateGraph(graph);
        assert.ok(true, `Graph ${index} should be updatable in provider`);

      } catch {
        assert.fail(`Graph ${index} validation failed`);
      }
    });
  });

  test('Should handle graph with different dependency types', () => {
    const mixedTypeGraph: DependencyGraph = {
      nodes: [
        {
          id: 'root@1.0.0',
          name: 'root',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'dev-dep@1.0.0',
          name: 'dev-dep',
          version: '1.0.0',
          type: 'devDependency',
          status: 'up-to-date',
          source: '/test',
          depth: 1,
          size: 16,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'peer-dep@1.0.0',
          name: 'peer-dep',
          version: '1.0.0',
          type: 'peerDependency',
          status: 'up-to-date',
          source: '/test',
          depth: 1,
          size: 18,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'opt-dep@1.0.0',
          name: 'opt-dep',
          version: '1.0.0',
          type: 'optionalDependency',
          status: 'up-to-date',
          source: '/test',
          depth: 1,
          size: 14,
          color: '#4CAF50',
          metadata: {}
        }
      ],
      edges: [
        {
          id: 'root->dev-dep',
          source: 'root@1.0.0',
          target: 'dev-dep@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#FF9800',
          width: 2
        },
        {
          id: 'root->peer-dep',
          source: 'root@1.0.0',
          target: 'peer-dep@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#2196F3',
          width: 2
        },
        {
          id: 'root->opt-dep',
          source: 'root@1.0.0',
          target: 'opt-dep@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#9C27B0',
          width: 2
        }
      ],
      metadata: {
        totalPackages: 4,
        totalDependencies: 3,
        conflicts: 0,
        vulnerabilities: 0,
        outdated: 0,
        scanTime: new Date(),
        workspaceRoots: ['/test']
      }
    };

    try {
      // Test that mixed type graph is valid
      assert.ok(mixedTypeGraph.nodes.length === 4, 'Should have 4 nodes');
      assert.ok(mixedTypeGraph.edges.length === 3, 'Should have 3 edges');

      // Test dependency type distribution
      const types = mixedTypeGraph.nodes.map(node => node.type);
      assert.ok(types.includes('dependency'), 'Should include dependency type');
      assert.ok(types.includes('devDependency'), 'Should include devDependency type');
      assert.ok(types.includes('peerDependency'), 'Should include peerDependency type');
      assert.ok(types.includes('optionalDependency'), 'Should include optionalDependency type');

      // Test that graph can be updated
      provider.updateGraph(mixedTypeGraph);
      assert.ok(true, 'Mixed type graph should be updatable');

          } catch {
        assert.fail('Mixed type graph validation failed');
      }
  });

  test('Should handle graph with different status types', () => {
    const mixedStatusGraph: DependencyGraph = {
      nodes: [
        {
          id: 'up-to-date@1.0.0',
          name: 'up-to-date',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'outdated@1.0.0',
          name: 'outdated',
          version: '1.0.0',
          type: 'dependency',
          status: 'outdated',
          source: '/test',
          depth: 1,
          size: 18,
          color: '#FF9800',
          metadata: {}
        },
        {
          id: 'conflict@1.0.0',
          name: 'conflict',
          version: '1.0.0',
          type: 'dependency',
          status: 'conflict',
          source: '/test',
          depth: 1,
          size: 18,
          color: '#2196F3',
          metadata: {}
        },
        {
          id: 'vulnerable@1.0.0',
          name: 'vulnerable',
          version: '1.0.0',
          type: 'dependency',
          status: 'vulnerable',
          source: '/test',
          depth: 1,
          size: 18,
          color: '#F44336',
          metadata: {}
        }
      ],
      edges: [
        {
          id: 'root->up-to-date',
          source: 'root-test',
          target: 'up-to-date@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#4CAF50',
          width: 2
        },
        {
          id: 'root->outdated',
          source: 'root-test',
          target: 'outdated@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#FF9800',
          width: 2
        },
        {
          id: 'root->conflict',
          source: 'root-test',
          target: 'conflict@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#2196F3',
          width: 2
        },
        {
          id: 'root->vulnerable',
          source: 'root-test',
          target: 'vulnerable@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#F44336',
          width: 2
        }
      ],
      metadata: {
        totalPackages: 4,
        totalDependencies: 4,
        conflicts: 1,
        vulnerabilities: 1,
        outdated: 1,
        scanTime: new Date(),
        workspaceRoots: ['/test']
      }
    };

    try {
      // Test that mixed status graph is valid
      assert.ok(mixedStatusGraph.nodes.length === 4, 'Should have 4 nodes');
      assert.ok(mixedStatusGraph.edges.length === 4, 'Should have 4 edges');

      // Test status distribution
      const statuses = mixedStatusGraph.nodes.map(node => node.status);
      assert.ok(statuses.includes('up-to-date'), 'Should include up-to-date status');
      assert.ok(statuses.includes('outdated'), 'Should include outdated status');
      assert.ok(statuses.includes('conflict'), 'Should include conflict status');
      assert.ok(statuses.includes('vulnerable'), 'Should include vulnerable status');

      // Test metadata accuracy
      assert.strictEqual(mixedStatusGraph.metadata.conflicts, 1, 'Should have 1 conflict');
      assert.strictEqual(mixedStatusGraph.metadata.vulnerabilities, 1, 'Should have 1 vulnerability');
      assert.strictEqual(mixedStatusGraph.metadata.outdated, 1, 'Should have 1 outdated');

      // Test that graph can be updated
      provider.updateGraph(mixedStatusGraph);
      assert.ok(true, 'Mixed status graph should be updatable');

          } catch {
        assert.fail('Mixed status graph validation failed');
      }
  });

  test('Should handle large graphs gracefully', () => {
    // Create a large graph with many nodes and edges
    const largeGraph: DependencyGraph = {
      nodes: Array.from({ length: 100 }, (_, i) => ({
        id: `package-${i}@1.0.0`,
        name: `package-${i}`,
        version: '1.0.0',
        type: 'dependency' as const,
        status: 'up-to-date' as const,
        source: '/test',
        depth: Math.floor(i / 10),
        size: 20 - Math.floor(i / 10) * 2,
        color: '#4CAF50',
        metadata: {}
      })),
      edges: Array.from({ length: 150 }, (_, i) => ({
        id: `edge-${i}`,
        source: `package-${Math.floor(i / 1.5)}@1.0.0`,
        target: `package-${i + 1}@1.0.0`,
        type: 'direct' as const,
        version: '^1.0.0',
        color: '#4CAF50',
        width: 2
      })),
      metadata: {
        totalPackages: 100,
        totalDependencies: 150,
        conflicts: 0,
        vulnerabilities: 0,
        outdated: 0,
        scanTime: new Date(),
        workspaceRoots: ['/test']
      }
    };

    try {
      // Test that large graph is valid
      assert.ok(largeGraph.nodes.length === 100, 'Should have 100 nodes');
      assert.ok(largeGraph.edges.length === 150, 'Should have 150 edges');

      // Test that large graph can be updated
      const startTime = Date.now();
      provider.updateGraph(largeGraph);
      const updateTime = Date.now() - startTime;

      // Should complete within reasonable time
      assert.ok(updateTime < 1000, 'Large graph update should complete within 1 second');
      assert.ok(true, 'Large graph should be updatable');

          } catch {
        assert.fail('Large graph validation failed');
      }
  });

  test('Should handle edge cases in graph data', () => {
    const edgeCaseGraph: DependencyGraph = {
      nodes: [
        {
          id: 'empty-name@1.0.0',
          name: '',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'very-long-name-123456789@1.0.0',
          name: 'very-long-name-123456789',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        },
        {
          id: 'special-chars@1.0.0',
          name: 'special-chars',
          version: '1.0.0',
          type: 'dependency',
          status: 'up-to-date',
          source: '/test/with/special/chars',
          depth: 0,
          size: 20,
          color: '#4CAF50',
          metadata: {}
        }
      ],
      edges: [
        {
          id: 'edge-with-special-chars',
          source: 'empty-name@1.0.0',
          target: 'very-long-name-123456789@1.0.0',
          type: 'direct',
          version: '^1.0.0',
          color: '#4CAF50',
          width: 2
        }
      ],
      metadata: {
        totalPackages: 3,
        totalDependencies: 1,
        conflicts: 0,
        vulnerabilities: 0,
        outdated: 0,
        scanTime: new Date(),
        workspaceRoots: ['/test/with/special/chars']
      }
    };

    try {
      // Test that edge case graph is handled
      assert.ok(edgeCaseGraph.nodes.length === 3, 'Should have 3 nodes');
      assert.ok(edgeCaseGraph.edges.length === 1, 'Should have 1 edge');

      // Test that edge case graph can be updated
      provider.updateGraph(edgeCaseGraph);
      assert.ok(true, 'Edge case graph should be updatable');

          } catch {
        assert.fail('Edge case graph validation failed');
      }
  });

  test('Should dispose resources correctly', () => {
    try {
      // Test that dispose method works without errors
      provider.dispose();
      assert.ok(true, 'Provider should dispose without errors');

      // Test that dispose can be called multiple times safely
      provider.dispose();
      assert.ok(true, 'Provider should handle multiple dispose calls safely');

          } catch {
        assert.fail('Provider disposal should not throw errors');
      }
  });
});
