// Webview frontend logic for Node Module Map
import * as d3 from 'd3';
import './types';

interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  color: string;
  size: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface DependencyEdge {
  id: string;
  source: string | DependencyNode;
  target: string | DependencyNode;
  type: string;
  color: string;
  width: number;
}

interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  metadata: {
    totalPackages: number;
    totalDependencies: number;
    conflicts: number;
    vulnerabilities: number;
    outdated: number;
  };
}

class DependencyGraphVisualization {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private simulation!: d3.Simulation<DependencyNode, DependencyEdge>;
  private nodes!: d3.Selection<SVGGElement, DependencyNode, SVGGElement, unknown>;
  private edges!: d3.Selection<SVGLineElement, DependencyEdge, SVGGElement, unknown>;
  private data: DependencyGraph | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.init();
  }

  private init() {
    // Create SVG container
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 800 600');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => {
        this.svg.selectAll('g').attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Create main group for all elements
    this.svg.append('g');

    // Initialize event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.sendMessage('refresh');
      });
    }

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.sendMessage('export');
      });
    }

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.filterNodes(target.value);
      });
    }

    // Filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-toggles input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateFilters();
      });
    });
  }

  public updateData(data: DependencyGraph) {
    this.data = data;
    this.render();
    this.updateStats();
  }

  private render() {
    if (!this.data) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Clear existing content
    this.svg.selectAll('*').remove();

    // Create main group
    const g = this.svg.append('g');

    // Create force simulation
    this.simulation = d3.forceSimulation<DependencyNode>(this.data.nodes)
      .force('link', d3.forceLink<DependencyNode, DependencyEdge>(this.data.edges).id((d) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create edges
    this.edges = g.append('g')
      .selectAll('line')
      .data(this.data.edges)
      .enter()
      .append('line')
      .attr('stroke', (d: DependencyEdge) => d.color)
      .attr('stroke-width', (d: DependencyEdge) => d.width)
      .attr('opacity', 0.6);

    // Create nodes
    this.nodes = g.append('g')
      .selectAll('g')
      .data(this.data.nodes)
      .enter()
      .append('g')
      .call(this.drag(this.simulation));

    // Add circles to nodes
    this.nodes.append('circle')
      .attr('r', (d: DependencyNode) => d.size)
      .attr('fill', (d: DependencyNode) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    this.nodes.append('text')
      .text((d: DependencyNode) => `${d.name}\n@${d.version}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none');

    // Add hover effects
    this.nodes
      .on('mouseover', (event: Event, d: DependencyNode) => this.handleNodeHover(event, d))
      .on('mouseout', (event: Event, d: DependencyNode) => this.handleNodeOut(event, d))
      .on('click', (event: Event, d: DependencyNode) => this.handleNodeClick(event, d));

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      this.edges
        .attr('x1', (d: DependencyEdge) => {
          const source = typeof d.source === 'string' ? { x: 0, y: 0 } : d.source;
          return source.x || 0;
        })
        .attr('y1', (d: DependencyEdge) => {
          const source = typeof d.source === 'string' ? { x: 0, y: 0 } : d.source;
          return source.y || 0;
        })
        .attr('x2', (d: DependencyEdge) => {
          const target = typeof d.target === 'string' ? { x: 0, y: 0 } : d.target;
          return target.x || 0;
        })
        .attr('y2', (d: DependencyEdge) => {
          const target = typeof d.target === 'string' ? { x: 0, y: 0 } : d.target;
          return target.y || 0;
        });

      this.nodes
        .attr('transform', (d: DependencyNode) => `translate(${d.x || 0},${d.y || 0})`);
    });
  }

  private drag(simulation: d3.Simulation<DependencyNode, DependencyEdge>) {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, DependencyNode, DependencyNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, DependencyNode, DependencyNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, DependencyNode, DependencyNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGGElement, DependencyNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  private handleNodeHover(_event: Event, d: DependencyNode) {
    // Highlight connected edges
    this.edges
      .attr('opacity', (edge: DependencyEdge) =>
        (typeof edge.source === 'string' ? edge.source : edge.source.id) === d.id ||
        (typeof edge.target === 'string' ? edge.target : edge.target.id) === d.id ? 1 : 0.1
      );

    // Show package info
    this.showPackageInfo(d);
  }

  private handleNodeOut(_event: Event, _d: DependencyNode) {
    // Reset edge opacity
    this.edges.attr('opacity', 0.6);

    // Hide package info
    this.hidePackageInfo();
  }

  private handleNodeClick(_event: Event, d: DependencyNode) {
    // Send package selection message
    this.sendMessage('packageSelected', d);
  }

  private showPackageInfo(node: DependencyNode) {
    const packageInfo = document.getElementById('package-info');
    const packageDetails = document.getElementById('package-details');

    if (packageInfo && packageDetails) {
      packageDetails.innerHTML = `
        <div class="package-detail">
          <strong>Name:</strong> ${node.name}
        </div>
        <div class="package-detail">
          <strong>Version:</strong> ${node.version}
        </div>
        <div class="package-detail">
          <strong>Type:</strong> ${node.type}
        </div>
        <div class="package-detail">
          <strong>Status:</strong> <span style="color: ${node.color}">${node.status}</span>
        </div>
      `;

      packageInfo.style.display = 'block';
    }
  }

  private hidePackageInfo() {
    const packageInfo = document.getElementById('package-info');
    if (packageInfo) {
      packageInfo.style.display = 'none';
    }
  }

    private filterNodes(searchTerm: string) {
    if (!this.data) return;

    const filteredNodes = this.data.nodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.version.includes(searchTerm)
    );

    this.nodes.style('opacity', (d: DependencyNode) =>
      filteredNodes.includes(d) ? 1 : 0.3
    );
  }

  private updateFilters() {
    if (!this.data) return;

    const showDeps = (document.getElementById('show-deps') as HTMLInputElement).checked;
    const showDevDeps = (document.getElementById('show-dev-deps') as HTMLInputElement).checked;
    const showPeerDeps = (document.getElementById('show-peer-deps') as HTMLInputElement).checked;
    const showOptionalDeps = (document.getElementById('show-optional-deps') as HTMLInputElement).checked;

    this.nodes.style('opacity', (d: DependencyNode) => {
      switch (d.type) {
        case 'dependency': return showDeps ? 1 : 0.3;
        case 'devDependency': return showDevDeps ? 1 : 0.3;
        case 'peerDependency': return showPeerDeps ? 1 : 0.3;
        case 'optionalDependency': return showOptionalDeps ? 1 : 0.3;
        default: return 1;
      }
    });

    // Send filter change message
    this.sendMessage('filterChanged', {
      showDeps,
      showDevDeps,
      showPeerDeps,
      showOptionalDeps
    });
  }

  private updateStats() {
    if (!this.data) return;

    const stats = this.data.metadata;

    (document.getElementById('total-packages') as HTMLElement).textContent = stats.totalPackages.toString();
    (document.getElementById('total-deps') as HTMLElement).textContent = stats.totalDependencies.toString();
    (document.getElementById('conflicts') as HTMLElement).textContent = stats.conflicts.toString();
    (document.getElementById('vulnerabilities') as HTMLElement).textContent = stats.vulnerabilities.toString();
    (document.getElementById('outdated') as HTMLElement).textContent = stats.outdated.toString();
  }

  private sendMessage(command: string, data?: unknown) {
    // Send message to VS Code extension
    if (window.vscode) {
      window.vscode.postMessage({ command, data });
    }
  }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're in VS Code webview
  if (window.vscode) {
    // Initialize the visualization
    const visualization = new DependencyGraphVisualization('graph-canvas');

    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
      const message = event.data;

      switch (message.command) {
        case 'updateGraph':
          visualization.updateData(message.data);
          break;
        case 'showLoading':
          document.getElementById('loading')!.style.display = 'block';
          document.getElementById('no-data')!.style.display = 'none';
          break;
        case 'hideLoading':
          document.getElementById('loading')!.style.display = 'none';
          break;
        case 'showNoData':
          document.getElementById('no-data')!.style.display = 'block';
          document.getElementById('loading')!.style.display = 'none';
          break;
      }
    });
  } else {
    // Not in VS Code, show demo data or error
    console.log('Not running in VS Code webview');
  }
});
