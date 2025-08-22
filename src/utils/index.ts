import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DependencyNode } from '../types';

/**
 * Utility functions for the Node Module Map extension
 */

export class Utils {
  /**
   * Check if a file path is a package.json file
   */
  static isPackageJson(filePath: string): boolean {
    return path.basename(filePath) === 'package.json';
  }

  /**
   * Check if a file path is a package-lock.json file
   */
  static isPackageLockJson(filePath: string): boolean {
    return path.basename(filePath) === 'package-lock.json';
  }

  /**
   * Get all package.json files in the workspace
   */
  static async findPackageJsonFiles(): Promise<vscode.Uri[]> {
    const pattern = '**/package.json';
    return await vscode.workspace.findFiles(pattern, '**/node_modules/**');
  }

  /**
   * Get all package-lock.json files in the workspace
   */
  static async findPackageLockJsonFiles(): Promise<vscode.Uri[]> {
    const pattern = '**/package-lock.json';
    return await vscode.workspace.findFiles(pattern, '**/node_modules/**');
  }

  /**
   * Read and parse a JSON file
   */
  static async readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Error reading JSON file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get workspace root folders
   */
  static getWorkspaceRoots(): string[] {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      return [];
    }
    return folders.map(folder => folder.uri.fsPath);
  }

  /**
   * Check if the current workspace has npm files
   */
  static async hasNpmFiles(): Promise<boolean> {
    const packageJsonFiles = await this.findPackageJsonFiles();
    return packageJsonFiles.length > 0;
  }

  /**
   * Generate a unique ID for a dependency
   */
  static generateDependencyId(name: string, version: string, source: string): string {
    return `${name}@${version}-${path.basename(source)}`;
  }

  /**
   * Compare two semantic versions
   * Returns: 1 if version1 > version2, 2 if version1 < version2, 0 if equal
   */
  static compareVersions(version1: string, version2: string): number {
    // Handle pre-release versions (e.g., 1.0.0-alpha vs 1.0.0)
    const v1 = version1.replace(/^v/, '');
    const v2 = version2.replace(/^v/, '');

    // If one has pre-release and the other doesn't, the one without pre-release is greater
    const v1HasPreRelease = v1.includes('-');
    const v2HasPreRelease = v2.includes('-');

    if (v1HasPreRelease && !v2HasPreRelease) return 2;
    if (!v1HasPreRelease && v2HasPreRelease) return 1;

    // If both have pre-release or both don't, compare numerically
    const v1Parts = v1.split('.').map(part => {
      const numPart = part.split('-')[0]; // Remove pre-release part for numeric comparison
      return parseInt(numPart, 10) || 0;
    });
    const v2Parts = v2.split('.').map(part => {
      const numPart = part.split('-')[0]; // Remove pre-release part for numeric comparison
      return parseInt(numPart, 10) || 0;
    });

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return 2;
    }

    return 0; // versions are equal
  }

  /**
   * Check if a version is outdated compared to another
   */
  static isVersionOutdated(current: string, latest: string): boolean {
    return this.compareVersions(current, latest) === 2;
  }

  /**
   * Get the update type (patch, minor, major)
   */
  static getUpdateType(current: string, latest: string): 'patch' | 'minor' | 'major' | 'none' {
    if (!this.isVersionOutdated(current, latest)) {
      return 'none';
    }

    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    if (currentParts[0] !== latestParts[0]) {
      return 'major';
    }
    if (currentParts[1] !== latestParts[1]) {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Get status color for a dependency node
   */
  static getStatusColor(status: DependencyNode['status']): string {
    switch (status) {
      case 'up-to-date':
        return '#4CAF50'; // Green
      case 'outdated':
        return '#FF9800'; // Orange
      case 'vulnerable':
        return '#F44336'; // Red
      case 'conflict':
        return '#2196F3'; // Blue
      default:
        return '#9E9E9E'; // Gray
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get relative path from workspace root
   */
  static getRelativePath(fullPath: string, workspaceRoot: string): string {
    return path.relative(workspaceRoot, fullPath);
  }

  /**
   * Check if a path is within a workspace
   */
  static isWithinWorkspace(filePath: string, workspaceRoots: string[]): boolean {
    return workspaceRoots.some(root => filePath.startsWith(root));
  }

  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
