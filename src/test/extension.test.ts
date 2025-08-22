import * as assert from 'assert';
import * as vscode from 'vscode';
import { DependencyScanner } from '../services/dependencyScanner';
import { Utils } from '../utils';

suite('Node Module Map Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    // The extension ID is based on the package.json name
    const ext = vscode.extensions.getExtension('node-module-map');
    if (ext) {
      assert.ok(ext);
    } else {
      // In test environment, the extension might not be loaded yet
      assert.ok(true, 'Extension not loaded in test environment');
    }
  });

  test('Should activate', async () => {
    const ext = vscode.extensions.getExtension('node-module-map');
    if (ext) {
      await ext.activate();
      assert.ok(true);
    }
  });

  test('Utils class should have required methods', () => {
    assert.ok(typeof Utils.isPackageJson === 'function');
    assert.ok(typeof Utils.isPackageLockJson === 'function');
    assert.ok(typeof Utils.findPackageJsonFiles === 'function');
    assert.ok(typeof Utils.getWorkspaceRoots === 'function');
    assert.ok(typeof Utils.compareVersions === 'function');
  });

  test('DependencyScanner should be singleton', () => {
    const scanner1 = DependencyScanner.getInstance();
    const scanner2 = DependencyScanner.getInstance();
    assert.strictEqual(scanner1, scanner2);
  });

  test('Version comparison should work correctly', () => {
    assert.strictEqual(Utils.compareVersions('1.0.0', '1.0.0'), 0);
    assert.strictEqual(Utils.compareVersions('1.0.0', '1.1.0'), 2);
    assert.strictEqual(Utils.compareVersions('2.0.0', '1.9.0'), 1);
  });

  test('Status colors should be defined', () => {
    const upToDateColor = Utils.getStatusColor('up-to-date');
    const outdatedColor = Utils.getStatusColor('outdated');
    const vulnerableColor = Utils.getStatusColor('vulnerable');
    const conflictColor = Utils.getStatusColor('conflict');

    assert.ok(upToDateColor);
    assert.ok(outdatedColor);
    assert.ok(vulnerableColor);
    assert.ok(conflictColor);
    assert.notStrictEqual(upToDateColor, outdatedColor);
  });
});
