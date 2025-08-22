# Changelog

All notable changes to the Node Module Map extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup and foundation
- VS Code extension scaffolding with Yeoman generator
- TypeScript configuration for both extension and webview
- ESLint configuration with TypeScript support
- Basic project structure and file organization

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.0.1] - 2025-08-22

### Added
- **Project Foundation**
  - VS Code extension project initialization
  - TypeScript configuration for extension backend
  - TypeScript configuration for webview frontend
  - ESLint configuration with separate rules for different file types
  - Comprehensive project documentation (README.md, CONTRIBUTING.md)

- **Core Architecture**
  - Extension activation and command registration
  - Webview provider implementation
  - Activity bar integration with custom view container
  - Command palette integration

- **Type System**
  - Comprehensive TypeScript interfaces for dependency data
  - Type definitions for dependency nodes, edges, and graphs
  - Package.json and package-lock.json type definitions
  - Extension configuration and workspace information types

- **Utility Functions**
  - File type detection utilities
  - JSON file reading and parsing
  - Workspace root detection
  - NPM file presence checking
  - Version comparison utilities
  - File path utilities

- **Dependency Scanning Service**
  - Workspace scanning for package.json and package-lock.json files
  - Dependency parsing and graph building
  - Support for multiple workspace roots
  - Package-lock.json parsing for both npm v7+ and legacy formats
  - Transitive dependency edge creation
  - Version conflict detection and resolution
  - Node depth calculation using BFS algorithm

- **NPM Registry Service**
  - Integration with npm registry API
  - Package version information fetching
  - Outdated package detection
  - Version comparison utilities
  - Caching for performance optimization
  - Batch processing capabilities

- **Webview Frontend**
  - D3.js integration for dependency graph visualization
  - Force-directed graph layout
  - Interactive node and edge rendering
  - User interaction handling (hover, click, search)
  - Responsive design with VS Code theme integration
  - Statistics display and package information sidebar

- **Testing Infrastructure**
  - Unit test setup with VS Code test framework
  - Test coverage for core utilities and services
  - Singleton pattern testing
  - Version comparison testing
  - Status color definition testing

### Technical Details
- **Build System**: Dual TypeScript compilation (extension + webview)
- **Linting**: ESLint with TypeScript-specific rules
- **Testing**: VS Code extension testing framework
- **Dependencies**: D3.js for visualization, TypeScript for type safety
- **Architecture**: Clean separation between extension backend and webview frontend

### Known Issues
- Security vulnerability scanning not yet implemented (placeholder)
- Large dependency trees may have performance considerations
- Some edge cases in package-lock.json parsing may need refinement

### Future Enhancements
- Security vulnerability integration (Snyk, npm audit)
- Performance optimization for large dependency trees
- Advanced filtering and search capabilities
- Export functionality (PNG, SVG, JSON)
- Real-time dependency monitoring
- Integration with package managers (yarn, pnpm)

---

## Version History

- **0.0.1**: Initial release with core dependency visualization functionality
- **Unreleased**: Development version with ongoing enhancements

## Release Notes

### v0.0.1 - Initial Release
This is the initial release of the Node Module Map extension, providing developers with a comprehensive tool for visualizing and analyzing npm dependency relationships in VS Code workspaces.

**Key Features:**
- Interactive dependency graph visualization using D3.js
- Multi-workspace support
- Version conflict detection
- Outdated package identification
- Real-time dependency scanning
- Professional VS Code integration

**Target Audience:**
- Node.js developers
- Frontend developers
- DevOps engineers
- Project managers
- Development teams

**Use Cases:**
- Dependency analysis and optimization
- Security vulnerability assessment
- Version conflict resolution
- Project dependency documentation
- Team collaboration and code review
