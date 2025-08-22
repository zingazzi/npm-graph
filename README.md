# Node Module Map

A powerful VS Code extension that provides interactive visualization of npm dependency trees with multi-repo support, conflict detection, and security insights.

## Features

### 🎯 Core Functionality
- **Interactive Dependency Graph**: Visualize your project's npm dependency tree using an interactive, force-directed graph
- **Multi-Repo Support**: View dependencies from multiple repositories within a single VS Code workspace
- **Conflict Detection**: Easily identify version conflicts and dependency hell scenarios
- **Security Insights**: Highlight outdated packages and known vulnerabilities

### 🔍 Advanced Analysis
- **Real-time Scanning**: Automatically scan workspace for package.json and package-lock.json files
- **Transitive Dependencies**: View complete dependency chains and relationships
- **Version Comparison**: Compare installed versions with latest available versions
- **Filtering & Search**: Powerful filtering options to focus on specific dependency types

### 💡 Developer Experience
- **Right-click Actions**: Quick access to npm commands and package information
- **Export Capabilities**: Save graphs as images or export dependency data
- **Performance Optimized**: Fast and responsive even with thousands of packages
- **Seamless Integration**: Works natively within VS Code

## Installation

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac) to open Extensions
3. Search for "Node Module Map"
4. Click Install

## Usage

### Basic Usage
1. Open a project or multi-root workspace in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open Command Palette
3. Type "Node Module Map: Show Dependency Graph"
4. Select the command to open the dependency visualization

### Commands Available
- **Show Dependency Graph**: Opens the main dependency visualization panel
- **Analyze Dependencies**: Performs a comprehensive dependency analysis

### Graph Interaction
- **Zoom**: Use mouse wheel or pinch gestures
- **Pan**: Click and drag to move around the graph
- **Node Selection**: Click on nodes to focus and see details
- **Right-click**: Access context menu with package actions

## Requirements

- VS Code 1.103.0 or higher
- Node.js project with package.json files
- TypeScript 5.9.2 or higher (for development)

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- VS Code

### Setup
```bash
git clone <repository-url>
cd npm-graph
npm install
npm run compile
```

### Development Commands
```bash
npm run watch          # Watch for changes and recompile
npm run lint           # Run ESLint
npm run test           # Run tests
npm run build          # Build for production
```

### Project Structure
```
src/
├── extension.ts           # Main extension entry point
├── webview/              # Webview panel implementation
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
└── services/             # Core business logic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join our Discord server for discussions

## Roadmap

- [ ] Security vulnerability integration
- [ ] Advanced filtering options
- [ ] Export to multiple formats
- [ ] Performance optimizations
- [ ] Custom themes and styling
- [ ] Integration with package managers (yarn, pnpm)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
