// Webview frontend logic for Node Module Map
import * as d3 from 'd3';
import './types';

interface DependencyNode {
  id: string;
  name: string;
  version: string;
  latestVersion?: string;
  type: string;
  status: string;
  color: string;
  size: number;
  depth: number;
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
  version: string;
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

interface FilterOptions {
  maxDepth: number;
  showDevDependencies: boolean;
  showPeerDependencies: boolean;
  showOptionalDependencies: boolean;
  showOutdated: boolean;
  showConflicts: boolean;
}

class DependencyGraphVisualization {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private simulation!: d3.Simulation<DependencyNode, DependencyEdge>;
  private nodes!: d3.Selection<SVGGElement, DependencyNode, SVGGElement, unknown>;
  private edges!: d3.Selection<SVGLineElement, DependencyEdge, SVGGElement, unknown>;
  private data: DependencyGraph | null = null;
  private filteredData: DependencyGraph | null = null;
  private filters: FilterOptions = {
    maxDepth: 3,
    showDevDependencies: true,
    showPeerDependencies: true,
    showOptionalDependencies: true,
    showOutdated: true,
    showConflicts: true
  };

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

    // Depth control
    const depthSlider = document.getElementById('depth-slider') as HTMLInputElement;
    if (depthSlider) {
      depthSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.filters.maxDepth = parseInt(target.value);
        this.updateDepthLabel();
        this.applyFilters();
      });
    }

    // Filter checkboxes
    const filterCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const filterName = target.name as keyof FilterOptions;
        if (filterName in this.filters) {
          (this.filters as any)[filterName] = target.checked;
          this.applyFilters();
        }
      });
    });
  }

  private updateDepthLabel() {
    const depthLabel = document.getElementById('depth-label');
    if (depthLabel) {
      depthLabel.textContent = `Depth: ${this.filters.maxDepth}`;
    }
  }

  private applyFilters() {
    if (!this.data) return;

    this.filteredData = {
      nodes: this.data.nodes.filter(node => {
        // Apply depth filter
        if (node.depth > this.filters.maxDepth) return false;

        // Apply type filters
        if (node.type === 'devDependency' && !this.filters.showDevDependencies) return false;
        if (node.type === 'peerDependency' && !this.filters.showPeerDependencies) return false;
        if (node.type === 'optionalDependency' && !this.filters.showOptionalDependencies) return false;

        // Apply status filters
        if (node.status === 'outdated' && !this.filters.showOutdated) return false;
        if (node.status === 'conflict' && !this.filters.showConflicts) return false;

        return true;
      }),
      edges: this.data.edges.filter(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        const sourceNode = this.filteredData!.nodes.find(n => n.id === sourceId);
        const targetNode = this.filteredData!.nodes.find(n => n.id === targetId);

        return sourceNode && targetNode;
      }),
      metadata: this.data.metadata
    };

    this.updateVisualization();
  }

  private filterNodes(searchTerm: string) {
    if (!this.filteredData) return;

    const searchLower = searchTerm.toLowerCase();
    const filteredNodes = this.filteredData.nodes.filter(node =>
      node.name.toLowerCase().includes(searchLower) ||
      node.version.toLowerCase().includes(searchLower)
    );

    const filteredEdges = this.filteredData.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      const sourceNode = filteredNodes.find(n => n.id === sourceId);
      const targetNode = filteredNodes.find(n => n.id === targetId);

      return sourceNode && targetNode;
    });

    this.updateVisualization({
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: this.filteredData.metadata
    });
  }

  updateData(graph: DependencyGraph) {
    this.data = graph;
    this.applyFilters();
    this.updateStatistics();
  }

  private updateStatistics() {
    if (!this.data) return;

    const statsContainer = document.getElementById('statistics');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Total Packages:</span>
          <span class="stat-value">${this.data.metadata.totalPackages}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Dependencies:</span>
          <span class="stat-value">${this.data.metadata.totalDependencies}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Conflicts:</span>
          <span class="stat-value conflict">${this.data.metadata.conflicts}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Outdated:</span>
          <span class="stat-value outdated">${this.data.metadata.outdated}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Vulnerabilities:</span>
          <span class="stat-value vulnerable">${this.data.metadata.vulnerabilities}</span>
        </div>
      `;
    }
  }

  private updateVisualization(graphData?: DependencyGraph) {
    const data = graphData || this.filteredData;
    if (!data) return;

    // Clear existing elements
    this.svg.selectAll('*').remove();

    // Create main group
    const g = this.svg.append('g');

    // Create edges
    this.edges = g.selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.width)
      .attr('opacity', 0.6);

    // Create nodes
    this.nodes = g.selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(this.drag(this.simulation));

    // Add circles to nodes
    this.nodes.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    this.nodes.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 15)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // Add version labels
    this.nodes.append('text')
      .text(d => d.version)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 30)
      .attr('font-size', '10px')
      .attr('fill', '#666');

    // Add depth indicators
    this.nodes.append('text')
      .text(d => `D${d.depth}`)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 45)
      .attr('font-size', '8px')
      .attr('fill', '#999');

    // Setup force simulation
    this.simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(400, 300))
      .force('collision', d3.forceCollide().radius(d => (d as DependencyNode).size + 5));

    // Update positions on tick
    this.simulation.on('tick', () => {
      this.edges
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      this.nodes
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Add hover effects
    this.nodes
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.selectNode(d));

    // Add click events for edges
    this.edges
      .on('click', (event, d) => this.selectEdge(d));
  }

  private drag(simulation: d3.Simulation<DependencyNode, DependencyEdge>) {
    return d3.drag<SVGGElement, DependencyNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        (d as any).fx = (d as any).x;
        (d as any).fy = (d as any).y;
      })
      .on('drag', (event, d) => {
        (d as any).fx = event.x;
        (d as any).fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        (d as any).fx = null;
        (d as any).fy = null;
      });
  }

  private showTooltip(event: MouseEvent, node: DependencyNode) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      const statusText = node.status === 'up-to-date' ? 'Up to Date' :
                        node.status === 'outdated' ? 'Outdated' :
                        node.status === 'conflict' ? 'Version Conflict' :
                        node.status === 'vulnerable' ? 'Vulnerable' : 'Unknown';

      tooltip.innerHTML = `
        <strong>${node.name}</strong><br>
        Version: ${node.version}<br>
        ${node.latestVersion ? `Latest: ${node.latestVersion}<br>` : ''}
        Type: ${node.type}<br>
        Status: ${statusText}<br>
        Depth: ${node.depth}
      `;
      tooltip.style.display = 'block';
      tooltip.style.left = event.pageX + 10 + 'px';
      tooltip.style.top = event.pageY - 10 + 'px';
    }
  }

  private hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  private selectNode(node: DependencyNode) {
    // Highlight selected node and its connections
    this.nodes.selectAll('circle')
      .attr('stroke', (d: any) => d.id === node.id ? '#ff0000' : '#fff')
      .attr('stroke-width', (d: any) => d.id === node.id ? 4 : 2);

    this.edges
      .attr('opacity', (d: any) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        return (sourceId === node.id || targetId === node.id) ? 1 : 0.3;
      });

    // Send selection message to extension
    this.sendMessage('selectNode', { nodeId: node.id, nodeName: node.name });
  }

  private selectEdge(edge: DependencyEdge) {
    // Highlight selected edge
    this.edges
      .attr('stroke-width', (d: any) => d.id === edge.id ? d.width + 2 : d.width)
      .attr('opacity', (d: any) => d.id === edge.id ? 1 : 0.3);

    // Send selection message to extension
    this.sendMessage('selectEdge', {
      edgeId: edge.id,
      source: typeof edge.source === 'string' ? edge.source : edge.source.id,
      target: typeof edge.target === 'string' ? edge.target : edge.target.id
    });
  }

  private sendMessage(command: string, data?: any) {
    if (window.vscode) {
      window.vscode.postMessage({
        command,
        data
      });
    }
  }
}

// Initialize visualization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const visualization = new DependencyGraphVisualization('dependency-graph');

  // Listen for messages from the extension
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
      case 'updateGraph':
        visualization.updateData(message.data);
        break;
    }
  });
});
