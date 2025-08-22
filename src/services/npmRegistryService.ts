import * as https from 'https';
import { VersionInfo } from '../types';

interface NpmPackageInfo {
  'dist-tags'?: {
    latest?: string;
  };
  time?: Record<string, string>;
}

/**
 * Service for interacting with npm registry
 */
export class NpmRegistryService {
  private static instance: NpmRegistryService;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheTimeout = 1000 * 60 * 5; // 5 minutes

  private constructor() {}

  static getInstance(): NpmRegistryService {
    if (!NpmRegistryService.instance) {
      NpmRegistryService.instance = new NpmRegistryService();
    }
    return NpmRegistryService.instance;
  }

  /**
   * Get package information from npm registry
   */
    async getPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
    const cacheKey = `package:${packageName}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as NpmPackageInfo;
    }

    try {
      const data = await this.fetchFromRegistry(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data as NpmPackageInfo;
    } catch (error) {
      console.error(`Error fetching package info for ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Get latest version of a package
   */
  async getLatestVersion(packageName: string): Promise<string | null> {
    try {
      const packageInfo = await this.getPackageInfo(packageName);
      return packageInfo?.['dist-tags']?.latest || null;
    } catch (error) {
      console.error(`Error getting latest version for ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Compare current version with latest and get version info
   */
  async getVersionInfo(packageName: string, currentVersion: string): Promise<VersionInfo> {
    try {
      const latestVersion = await this.getLatestVersion(packageName);

      if (!latestVersion) {
        return {
          current: currentVersion,
          latest: currentVersion,
          isOutdated: false,
          updateType: 'none',
          publishedDate: new Date()
        };
      }

      const isOutdated = this.compareVersions(currentVersion, latestVersion) < 0;
      const updateType = this.getUpdateType(currentVersion, latestVersion);

      // Get published date for latest version
      const packageInfo = await this.getPackageInfo(packageName);
      const publishedDate = packageInfo?.time?.[latestVersion]
        ? new Date(packageInfo.time[latestVersion])
        : new Date();

      return {
        current: currentVersion,
        latest: latestVersion,
        isOutdated,
        updateType,
        publishedDate
      };
    } catch (error) {
      console.error(`Error getting version info for ${packageName}:`, error);
      return {
        current: currentVersion,
        latest: currentVersion,
        isOutdated: false,
        updateType: 'none',
        publishedDate: new Date()
      };
    }
  }

  /**
   * Get security vulnerabilities for a package
   */
  async getSecurityInfo(_packageName: string, _version: string): Promise<unknown[]> {
    // Note: This would require integration with a security service like Snyk or npm audit
    // For now, return empty array - will be implemented in future enhancement
    return [];
  }

  /**
   * Batch check versions for multiple packages
   */
  async batchCheckVersions(packages: Array<{ name: string; version: string }>): Promise<Map<string, VersionInfo>> {
    const results = new Map<string, VersionInfo>();
    const promises = packages.map(async (pkg) => {
      const versionInfo = await this.getVersionInfo(pkg.name, pkg.version);
      results.set(pkg.name, versionInfo);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Fetch data from npm registry
   */
  private fetchFromRegistry(url: string): Promise<NpmPackageInfo> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'Node-Module-Map-VSCode-Extension'
        }
      }, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse JSON response: ${error}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Compare two semantic versions
   */
  private compareVersions(version1: string, version2: string): number {
    // Remove any leading 'v' and clean version strings
    const v1 = version1.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const v2 = version2.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);

    const maxLength = Math.max(v1.length, v2.length);

    for (let i = 0; i < maxLength; i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Get update type based on version difference
   */
  private getUpdateType(current: string, latest: string): 'patch' | 'minor' | 'major' | 'none' {
    if (this.compareVersions(current, latest) === 0) {
      return 'none';
    }

    const currentParts = current.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const latestParts = latest.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);

    if (currentParts[0] !== latestParts[0]) {
      return 'major';
    }
    if (currentParts[1] !== latestParts[1]) {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
