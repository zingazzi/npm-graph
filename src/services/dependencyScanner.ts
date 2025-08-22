import * as vscode from 'vscode';
import * as path from 'path';
import { Utils } from '../utils';
import { NpmRegistryService } from './npmRegistryService';
import {
  DependencyNode,
  DependencyEdge,
  DependencyGraph,
  PackageJson,
  PackageLockJson,
  WorkspaceInfo
} from '../types';

interface LegacyDependency {
  version: string;
  dependencies?: Record<string, LegacyDependency>;
}

/**
 * Service for scanning and parsing npm dependencies
 */
export class DependencyScanner {
  private static instance: DependencyScanner;

  private constructor() {}

  static getInstance(): DependencyScanner {
    if (!DependencyScanner.instance) {
      DependencyScanner.instance = new DependencyScanner();
    }
    return DependencyScanner.instance;
  }

  /**
   * Scan the entire workspace for dependencies
   */
  async scanWorkspace(): Promise<DependencyGraph> {
    console.log('Starting workspace dependency scan...');

    const startTime = Date.now();
    const workspaceRoots = Utils.getWorkspaceRoots();

    if (workspaceRoots.length === 0) {
      throw new Error('No workspace folders found');
    }

    const workspaces: WorkspaceInfo[] = [];

    // Scan each workspace root
    for (const root of workspaceRoots) {
      const workspaceInfo = await this.scanWorkspaceRoot(root);
      if (workspaceInfo) {
        workspaces.push(workspaceInfo);
      }
    }

    // Build the complete dependency graph
    const graph = await this.buildDependencyGraph(workspaces);

    const scanTime = Date.now() - startTime;
    console.log(`Workspace scan completed in ${scanTime}ms`);

    return graph;
  }

  /**
   * Scan a single workspace root for dependencies
   */
  private async scanWorkspaceRoot(rootPath: string): Promise<WorkspaceInfo | null> {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const packageLockPath = path.join(rootPath, 'package-lock.json');

      // Read package.json
      const packageJson = await Utils.readJsonFile<PackageJson>(packageJsonPath);
      if (!packageJson) {
        console.warn(`Could not read package.json at ${packageJsonPath}`);
        return null;
      }

      // Read package-lock.json if it exists
      let packageLockJson: PackageLockJson | undefined;
      if (await this.fileExists(packageLockPath)) {
        const lockData = await Utils.readJsonFile<PackageLockJson>(packageLockPath);
        if (lockData) {
          packageLockJson = lockData;
        }
      }

      // Parse dependencies
      const dependencies = await this.parseDependencies(
        packageJson,
        packageLockJson,
        rootPath
      );

      return {
        root: rootPath,
        name: packageJson.name || path.basename(rootPath),
        packageJson,
        packageLockJson,
        dependencies
      };
    } catch (error) {
      console.error(`Error scanning workspace root ${rootPath}:`, error);
      return null;
    }
  }

  /**
   * Parse dependencies from package.json and package-lock.json
   */
  private async parseDependencies(
    packageJson: PackageJson,
    packageLockJson: PackageLockJson | undefined,
    sourcePath: string
  ): Promise<DependencyNode[]> {
    const dependencies: DependencyNode[] = [];
    const dependencyTypes = [
      { key: 'dependencies', type: 'dependency' as const },
      { key: 'devDependencies', type: 'devDependency' as const },
      { key: 'peerDependencies', type: 'peerDependency' as const },
      { key: 'optionalDependencies', type: 'optionalDependency' as const }
    ];

    for (const { key, type } of dependencyTypes) {
      const deps = packageJson[key as keyof PackageJson] as Record<string, string> | undefined;
      if (deps) {
        for (const [name, version] of Object.entries(deps)) {
          const dependency = await this.createDependencyNode(
            name,
            version,
            type,
            sourcePath,
            packageLockJson
          );
          if (dependency) {
            dependencies.push(dependency);
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Create a dependency node with metadata
   */
  private async createDependencyNode(
    name: string,
    version: string,
    type: DependencyNode['type'],
    sourcePath: string,
    packageLockJson?: PackageLockJson
  ): Promise<DependencyNode | null> {
    try {
      // Get actual installed version from package-lock.json if available
      let actualVersion = version;
      let status: DependencyNode['status'] = 'up-to-date';

      if (packageLockJson) {
        const lockInfo = this.findPackageInLockFile(name, packageLockJson);
        if (lockInfo) {
          actualVersion = lockInfo.version;
        }
      }

      // Generate unique ID
      const id = Utils.generateDependencyId(name, actualVersion, sourcePath);

      // Determine status (basic implementation - will be enhanced later)
      if (version.startsWith('^') || version.startsWith('~')) {
        status = 'up-to-date'; // Will be enhanced with version checking
      }

      return {
        id,
        name,
        version: actualVersion,
        type,
        status,
        source: sourcePath,
        depth: 0, // Will be calculated during graph building
        size: 20, // Default size for visualization
        color: Utils.getStatusColor(status),
        metadata: {
          // Will be populated with npm registry data later
        }
      };
    } catch (error) {
      console.error(`Error creating dependency node for ${name}:`, error);
      return null;
    }
  }

  /**
   * Find package information in package-lock.json
   */
  private findPackageInLockFile(
    packageName: string,
    packageLockJson: PackageLockJson
  ): { version: string; resolved?: string } | null {
    // Check direct dependencies first
    if (packageLockJson.dependencies && packageLockJson.dependencies[packageName]) {
      return packageLockJson.dependencies[packageName];
    }

    // Check packages section (npm v7+)
    if (packageLockJson.packages) {
      const packageKey = `node_modules/${packageName}`;
      if (packageLockJson.packages[packageKey]) {
        return packageLockJson.packages[packageKey];
      }
    }

    return null;
  }

    /**
   * Build the complete dependency graph from workspace information
   */
  private async buildDependencyGraph(workspaces: WorkspaceInfo[]): Promise<DependencyGraph> {
    const allNodes: DependencyNode[] = [];
    const allEdges: DependencyEdge[] = [];

    // Collect all nodes and process each workspace
    for (const workspace of workspaces) {
      // Add workspace dependencies to all nodes
      const workspaceNodes = workspace.dependencies.map(dep => ({
        ...dep,
        source: workspace.root
      }));
      allNodes.push(...workspaceNodes);

      // Build edges from package-lock.json if available
      if (workspace.packageLockJson) {
        const workspaceEdges = await this.buildEdgesFromPackageLock(
          workspace.packageLockJson,
          workspace.root,
          workspaceNodes
        );
        allEdges.push(...workspaceEdges);
      } else {
        // Build basic edges from package.json
        const basicEdges = this.buildBasicEdges(workspace.packageJson, workspace.root, workspaceNodes);
        allEdges.push(...basicEdges);
      }
    }

    // Remove duplicates and merge conflicts
    const { uniqueNodes, conflictNodes } = this.processNodesAndConflicts(allNodes);

    // Calculate node depths based on dependency relationships
    this.calculateNodeDepths(uniqueNodes, allEdges);

    // Check for outdated packages
    await this.checkOutdatedPackages(uniqueNodes);

    // Calculate metadata
    const outdatedCount = uniqueNodes.filter(node => node.status === 'outdated').length;
    const vulnerabilityCount = uniqueNodes.filter(node => node.status === 'vulnerable').length;

    const metadata = {
      totalPackages: uniqueNodes.length,
      totalDependencies: allEdges.length,
      conflicts: conflictNodes.length,
      vulnerabilities: vulnerabilityCount,
      outdated: outdatedCount,
      scanTime: new Date(),
      workspaceRoots: workspaces.map(w => w.root)
    };

    return {
      nodes: uniqueNodes,
      edges: allEdges,
      metadata
    };
  }

    /**
   * Build edges from package-lock.json
   */
  private async buildEdgesFromPackageLock(
    packageLockJson: PackageLockJson,
    _sourcePath: string,
    workspaceNodes: DependencyNode[]
  ): Promise<DependencyEdge[]> {
    const edges: DependencyEdge[] = [];

    // Process packages section (npm v7+)
    if (packageLockJson.packages) {
      for (const [packagePath, packageInfo] of Object.entries(packageLockJson.packages)) {
        if (packagePath === '' || !packageInfo.dependencies) continue;

        const packageName = packageInfo.name || path.basename(packagePath);
        const sourceNode = workspaceNodes.find(n => n.name === packageName);

        if (sourceNode && packageInfo.dependencies) {
          for (const [depName, depVersion] of Object.entries(packageInfo.dependencies)) {
            const targetNode = workspaceNodes.find(n => n.name === depName);
            if (targetNode) {
              edges.push({
                id: `${sourceNode.id}->${targetNode.id}`,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'transitive',
                version: depVersion,
                color: '#999',
                width: 1
              });
            }
          }
        }
      }
    }

    // Process legacy dependencies section
    if (packageLockJson.dependencies) {
      await this.processLegacyDependencies(packageLockJson.dependencies, edges, workspaceNodes);
    }

    return edges;
  }

  /**
   * Process legacy dependencies structure
   */
  private async processLegacyDependencies(
    dependencies: Record<string, LegacyDependency>,
    edges: DependencyEdge[],
    workspaceNodes: DependencyNode[],
    parentName?: string
  ): Promise<void> {
    for (const [depName, depInfo] of Object.entries(dependencies)) {
      const sourceNode = parentName ? workspaceNodes.find(n => n.name === parentName) : null;
      const targetNode = workspaceNodes.find(n => n.name === depName);

      if (sourceNode && targetNode) {
        edges.push({
          id: `${sourceNode.id}->${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'transitive',
          version: depInfo.version,
          color: '#999',
          width: 1
        });
      }

      // Recursively process nested dependencies
      if (depInfo.dependencies) {
        await this.processLegacyDependencies(depInfo.dependencies, edges, workspaceNodes, depName);
      }
    }
  }

  /**
   * Build basic edges from package.json
   */
  private buildBasicEdges(
    packageJson: PackageJson,
    sourcePath: string,
    workspaceNodes: DependencyNode[]
  ): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    const rootId = `root-${path.basename(sourcePath)}`;

    // Create edges from root to direct dependencies
    const dependencyTypes = [
      { deps: packageJson.dependencies, type: 'dependency' },
      { deps: packageJson.devDependencies, type: 'devDependency' },
      { deps: packageJson.peerDependencies, type: 'peerDependency' },
      { deps: packageJson.optionalDependencies, type: 'optionalDependency' }
    ];

    for (const { deps, type } of dependencyTypes) {
      if (deps) {
        for (const [depName, depVersion] of Object.entries(deps)) {
          const targetNode = workspaceNodes.find(n => n.name === depName);
          if (targetNode) {
            edges.push({
              id: `${rootId}->${targetNode.id}`,
              source: rootId,
              target: targetNode.id,
              type: 'direct',
              version: depVersion,
              color: this.getEdgeColor(type),
              width: 2
            });
          }
        }
      }
    }

    return edges;
  }

  /**
   * Get edge color based on dependency type
   */
  private getEdgeColor(type: string): string {
    switch (type) {
      case 'dependency': return '#4CAF50';
      case 'devDependency': return '#FF9800';
      case 'peerDependency': return '#2196F3';
      case 'optionalDependency': return '#9C27B0';
      default: return '#999';
    }
  }

  /**
   * Process nodes and detect conflicts
   */
  private processNodesAndConflicts(nodes: DependencyNode[]): {
    uniqueNodes: DependencyNode[],
    conflictNodes: DependencyNode[]
  } {
    const nodeMap = new Map<string, DependencyNode[]>();
    const conflictNodes: DependencyNode[] = [];

    // Group nodes by name
    for (const node of nodes) {
      if (!nodeMap.has(node.name)) {
        nodeMap.set(node.name, []);
      }
      nodeMap.get(node.name)!.push(node);
    }

    const uniqueNodes: DependencyNode[] = [];

    // Process each group
    for (const [, nodeGroup] of nodeMap.entries()) {
      if (nodeGroup.length === 1) {
        // No conflicts, add the single node
        uniqueNodes.push(nodeGroup[0]);
      } else {
        // Multiple versions detected - conflict!
        const versions = new Set(nodeGroup.map(n => n.version));

        if (versions.size > 1) {
          // Mark all as conflicts
          for (const node of nodeGroup) {
            node.status = 'conflict';
            node.color = Utils.getStatusColor('conflict');
            conflictNodes.push(node);
          }

          // Add the first one as the representative node
          uniqueNodes.push(nodeGroup[0]);
        } else {
          // Same version, just add one
          uniqueNodes.push(nodeGroup[0]);
        }
      }
    }

    return { uniqueNodes, conflictNodes };
  }

  /**
   * Calculate node depths in the dependency tree
   */
  private calculateNodeDepths(nodes: DependencyNode[], edges: DependencyEdge[]): void {
    const depthMap = new Map<string, number>();
    const edgeMap = new Map<string, string[]>();

        // Build adjacency list
    for (const edge of edges) {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as DependencyNode).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as DependencyNode).id;

      if (!edgeMap.has(sourceId)) {
        edgeMap.set(sourceId, []);
      }
      edgeMap.get(sourceId)!.push(targetId);
    }

    // Calculate depths using BFS
    const queue: Array<{ nodeId: string, depth: number }> = [];
    const visited = new Set<string>();

    // Start with root nodes (nodes that are not targets of any edge)
    const allTargets = new Set(edges.map(e => typeof e.target === 'string' ? e.target : (e.target as DependencyNode).id));
    const rootNodes = nodes.filter(n => !allTargets.has(n.id));

    for (const rootNode of rootNodes) {
      queue.push({ nodeId: rootNode.id, depth: 0 });
      depthMap.set(rootNode.id, 0);
    }

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const children = edgeMap.get(nodeId) || [];
      for (const childId of children) {
        const currentDepth = depthMap.get(childId);
        const newDepth = depth + 1;

        if (currentDepth === undefined || newDepth < currentDepth) {
          depthMap.set(childId, newDepth);
          queue.push({ nodeId: childId, depth: newDepth });
        }
      }
    }

    // Apply calculated depths to nodes
    for (const node of nodes) {
      node.depth = depthMap.get(node.id) || 0;
    }
  }

  /**
   * Check for outdated packages using npm registry
   */
  private async checkOutdatedPackages(nodes: DependencyNode[]): Promise<void> {
    const registryService = NpmRegistryService.getInstance();

    // Process packages in batches to avoid overwhelming the registry
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (const batch of batches) {
      const promises = batch.map(async (node) => {
        // Skip checking if already marked as conflict
        if (node.status === 'conflict') {
          return;
        }

        try {
          const versionInfo = await registryService.getVersionInfo(node.name, node.version);

          if (versionInfo.isOutdated) {
            node.status = 'outdated';
            node.color = Utils.getStatusColor('outdated');
            node.latestVersion = versionInfo.latest;
          }
        } catch (error) {
          console.warn(`Failed to check version for ${node.name}:`, error);
        }
      });

      await Promise.all(promises);

      // Small delay between batches to be respectful to the registry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }



  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a specific dependency by name
   */
  async getDependency(name: string): Promise<DependencyNode | null> {
    const graph = await this.scanWorkspace();
    return graph.nodes.find(node => node.name === name) || null;
  }

  /**
   * Get dependencies by type
   */
  async getDependenciesByType(type: DependencyNode['type']): Promise<DependencyNode[]> {
    const graph = await this.scanWorkspace();
    return graph.nodes.filter(node => node.type === type);
  }

  /**
   * Get outdated dependencies
   */
  async getOutdatedDependencies(): Promise<DependencyNode[]> {
    const graph = await this.scanWorkspace();
    return graph.nodes.filter(node => node.status === 'outdated');
  }

  /**
   * Get vulnerable dependencies
   */
  async getVulnerableDependencies(): Promise<DependencyNode[]> {
    const graph = await this.scanWorkspace();
    return graph.nodes.filter(node => node.status === 'vulnerable');
  }
}
