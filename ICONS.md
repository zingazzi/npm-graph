# Node Module Map Extension Icons

This directory contains the icon files for the Node Module Map VS Code extension.

## Icon Files

### `icon.svg` - Main Extension Icon
- **Size**: 128x128 pixels
- **Usage**: Main extension icon displayed in the VS Code marketplace and extension manager
- **Design**: Modern dependency graph visualization with connected nodes
- **Colors**: Dark theme optimized with blue central node and colorful dependency nodes

### `icon-dark.svg` - Dark Theme Version
- **Size**: 128x128 pixels
- **Usage**: Alternative icon for dark themes
- **Design**: Same design as main icon but with lighter colors for better visibility
- **Colors**: Lighter background with more vibrant node colors

### `sidebar-icon.svg` - Sidebar Icon
- **Size**: 24x24 pixels
- **Usage**: Icon displayed in the VS Code sidebar/activity bar
- **Design**: Simplified version of the main icon optimized for small size
- **Colors**: Same color scheme as main icon but simplified for small display

## Icon Design

The icons represent a dependency graph with:
- **Central Node**: Blue circle representing the main package
- **Dependency Nodes**: Colored circles representing different types of dependencies
- **Connection Lines**: Lines showing dependency relationships
- **Secondary Connections**: Lighter lines showing indirect relationships

## Color Scheme

- **Central Node**: Blue (#4299E1) - represents the main package
- **Dependencies**:
  - Green (#48BB78) - production dependencies
  - Orange (#F6AD55) - development dependencies
  - Pink (#F687B3) - peer dependencies
  - Purple (#9F7AEA) - optional dependencies
- **Connections**: Gray (#A0AEC0) - dependency relationships
- **Background**: Dark (#2D3748) - professional appearance

## Usage in package.json

The icons are referenced in the extension's `package.json`:

```json
{
  "icon": "icon.svg",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "icon": "icon.svg"
        }
      ]
    }
  }
}
```

## Customization

To customize the icons:
1. Edit the SVG files using any SVG editor
2. Maintain the same dimensions and viewBox
3. Ensure colors provide good contrast in both light and dark themes
4. Test visibility at different sizes

## File Formats

- **SVG**: Vector format for crisp display at any size
- **Scalable**: Icons look sharp on all display densities
- **Themeable**: Can be adapted for different VS Code themes
- **Lightweight**: Small file sizes for fast loading
