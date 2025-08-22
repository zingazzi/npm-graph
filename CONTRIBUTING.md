# Contributing to Node Module Map

Thank you for your interest in contributing to Node Module Map! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- VS Code (for development and testing)
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/node-module-map.git
   cd node-module-map
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile the Extension**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Lint Code**
   ```bash
   npm run lint
   ```

## 🏗️ Project Structure

```
npm-graph/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── types/index.ts            # TypeScript type definitions
│   ├── utils/index.ts            # Utility functions
│   ├── services/                 # Business logic services
│   │   ├── dependencyScanner.ts  # Dependency parsing and analysis
│   │   └── npmRegistryService.ts # NPM registry integration
│   ├── webview/                  # Webview frontend
│   │   ├── dependencyGraphProvider.ts  # Webview provider
│   │   ├── webview.ts            # D3.js visualization logic
│   │   ├── webview.css           # Webview styling
│   │   └── types.ts              # Webview-specific types
│   └── test/                     # Test files
├── package.json                  # Extension manifest and dependencies
├── tsconfig.json                 # Main TypeScript configuration
├── tsconfig.webview.json         # Webview TypeScript configuration
└── eslint.config.mjs             # ESLint configuration
```

## 🧪 Development Workflow

### 1. Make Changes

- Create a feature branch: `git checkout -b feature/your-feature-name`
- Make your changes following the coding standards below
- Test your changes thoroughly

### 2. Test Your Changes

```bash
# Compile the extension
npm run compile

# Run linting
npm run lint

# Run tests
npm test

# Test in VS Code (F5 to launch extension host)
```

### 3. Submit Changes

- Commit your changes with clear, descriptive messages
- Push to your fork
- Create a Pull Request

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for public methods
- Avoid `any` type - use `unknown` or specific types

### Code Style

- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public methods
- Keep functions focused and single-purpose

### Error Handling

- Use proper error handling with try-catch blocks
- Log errors appropriately
- Provide user-friendly error messages
- Handle edge cases gracefully

## 🧪 Testing

### Writing Tests

- Place tests in the `src/test/` directory
- Use descriptive test names
- Test both success and failure scenarios
- Mock external dependencies when appropriate

### Test Structure

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## 🔧 Debugging

### VS Code Extension Development

1. Press `F5` to launch the extension development host
2. Open a project with `package.json` files
3. Use the Command Palette to test your commands
4. Check the Debug Console for logs and errors

### Webview Debugging

- Use `console.log()` in webview code
- Check the Developer Tools in the webview
- Use VS Code's built-in debugging for the extension

## 📦 Building and Packaging

### Development Build

```bash
npm run compile
```

### Production Build

```bash
npm run package
```

This creates a `.vsix` file that can be installed in VS Code.

## 🐛 Reporting Issues

When reporting issues, please include:

- VS Code version
- Extension version
- Steps to reproduce
- Expected vs. actual behavior
- Error messages or logs
- Sample project structure (if relevant)

## 💡 Feature Requests

For feature requests:

- Describe the use case clearly
- Explain how it benefits users
- Consider implementation complexity
- Provide examples if possible

## 🤝 Code Review Process

1. **Automated Checks**: All PRs must pass:
   - TypeScript compilation
   - ESLint rules
   - Test suite

2. **Review Requirements**: At least one maintainer must approve

3. **Review Focus**: Code quality, functionality, and maintainability

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [D3.js Documentation](https://d3js.org/)

## 📄 License

By contributing to Node Module Map, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You

Thank you for contributing to Node Module Map! Your contributions help make this tool better for the entire Node.js development community.

---

If you have any questions about contributing, please open an issue or reach out to the maintainers.
