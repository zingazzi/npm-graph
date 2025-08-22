export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  latestVersion?: string;
  type: 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency';
  status: 'up-to-date' | 'outdated' | 'vulnerable' | 'conflict';
  source: string; // path to package.json
  depth: number; // dependency depth level
  size: number; // for visualization
  color: string; // status-based color
  metadata: {
    description?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    author?: string;
    maintainers?: string[];
  };
}

export interface DependencyEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: 'direct' | 'transitive';
  version: string; // required version
  color: string;
  width: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  metadata: {
    totalPackages: number;
    totalDependencies: number;
    conflicts: number;
    vulnerabilities: number;
    outdated: number;
    scanTime: Date;
    workspaceRoots: string[];
  };
}

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export interface PackageLockJson {
  name: string;
  version: string;
  lockfileVersion: number;
  packages: Record<string, PackageLockPackage>;
  dependencies: Record<string, PackageLockDependency>;
}

export interface PackageLockPackage {
  name?: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  integrity?: string;
  resolved?: string;
}

export interface PackageLockDependency {
  version: string;
  resolved: string;
  integrity: string;
  requires?: Record<string, string>;
  dependencies?: Record<string, PackageLockDependency>;
}

export interface WorkspaceInfo {
  root: string;
  name: string;
  packageJson: PackageJson;
  packageLockJson?: PackageLockJson;
  dependencies: DependencyNode[];
}

export interface ExtensionConfig {
  showDevDependencies: boolean;
  showPeerDependencies: boolean;
  showOptionalDependencies: boolean;
  enableSecurityScanning: boolean;
  enableVersionChecking: boolean;
  maxDepth: number;
  nodeSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

export interface SecurityVulnerability {
  packageName: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  cve?: string;
  references?: string[];
}

export interface VersionInfo {
  current: string;
  latest: string;
  isOutdated: boolean;
  updateType: 'patch' | 'minor' | 'major' | 'none';
  publishedDate: Date;
}

export interface GraphLayoutOptions {
  width: number;
  height: number;
  nodeSpacing: number;
  linkDistance: number;
  chargeStrength: number;
  gravityStrength: number;
  enableZoom: boolean;
  enablePan: boolean;
  enableDrag: boolean;
}

export interface FilterOptions {
  showDependencies: boolean;
  showDevDependencies: boolean;
  showPeerDependencies: boolean;
  showOptionalDependencies: boolean;
  showVulnerable: boolean;
  showOutdated: boolean;
  showConflicts: boolean;
  searchTerm: string;
  maxDepth: number;
  packageTypes: string[];
}
