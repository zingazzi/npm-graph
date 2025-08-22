import * as assert from 'assert';
import { Utils } from '../utils';

suite('NPM Registry Service Tests', () => {
  // Core version comparison functionality tests (no network dependencies)

  test('Should handle version comparison correctly', () => {
    // Test various version comparison scenarios
    const testCases = [
      { v1: '1.0.0', v2: '1.0.0', expected: 0 },
      { v1: '1.0.0', v2: '1.0.1', expected: 2 },
      { v1: '1.0.1', v2: '1.0.0', expected: 1 },
      { v1: '2.0.0', v2: '1.9.9', expected: 1 },
      { v1: '1.9.9', v2: '2.0.0', expected: 2 },
      { v1: '1.0.0', v2: '1.0.0-alpha', expected: 1 },
      { v1: '1.0.0-alpha', v2: '1.0.0', expected: 2 }
    ];

    testCases.forEach(({ v1, v2, expected }) => {
      const result = Utils.compareVersions(v1, v2);
      assert.strictEqual(result, expected, `Version comparison ${v1} vs ${v2} should return ${expected}`);
    });
  });

  test('Should determine update type correctly', () => {
    const testCases = [
      { current: '1.0.0', latest: '1.0.0', expected: 'none' },
      { current: '1.0.0', latest: '1.0.1', expected: 'patch' },
      { current: '1.0.0', latest: '1.1.0', expected: 'minor' },
      { current: '1.0.0', latest: '2.0.0', expected: 'major' },
      { current: '1.0.0', latest: '1.0.0-alpha', expected: 'none' },
      { current: '1.0.0-alpha', latest: '1.0.0', expected: 'patch' }
    ];

    testCases.forEach(({ current, latest, expected }) => {
      const result = Utils.getUpdateType(current, latest);
      assert.strictEqual(result, expected, `Update type for ${current} -> ${latest} should be ${expected}`);
    });
  });

  test('Should handle different version formats', () => {
    const testCases = [
      { v1: 'v1.0.0', v2: '1.0.0', expected: 0 },
      { v1: '1.0.0', v2: 'v1.0.0', expected: 0 },
      { v1: 'v1.0.0', v2: 'v1.0.1', expected: 2 },
      { v1: '1.0.0-beta', v2: '1.0.0', expected: 2 },
      { v1: '1.0.0', v2: '1.0.0-beta', expected: 1 }
    ];

    testCases.forEach(({ v1, v2, expected }) => {
      const result = Utils.compareVersions(v1, v2);
      assert.strictEqual(result, expected, `Version comparison ${v1} vs ${v2} should return ${expected}`);
    });
  });

  test('Should handle edge case versions', () => {
    const edgeCases = [
      { v1: '0.0.0', v2: '0.0.0', expected: 0 },
      { v1: '999.999.999', v2: '999.999.999', expected: 0 },
      { v1: '0.0.0', v2: '999.999.999', expected: 2 },
      { v1: '999.999.999', v2: '0.0.0', expected: 1 },
      { v1: '1.0.0-0', v2: '1.0.0', expected: 2 },
      { v1: '1.0.0', v2: '1.0.0-0', expected: 1 }
    ];

    edgeCases.forEach(({ v1, v2, expected }) => {
      const result = Utils.compareVersions(v1, v2);
      assert.strictEqual(result, expected, `Edge case version comparison ${v1} vs ${v2} should return ${expected}`);
    });
  });

  test('Should maintain consistent version comparison results', () => {
    // Test that comparison is consistent and transitive
    const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0'];

    for (let i = 0; i < versions.length; i++) {
      for (let j = 0; j < versions.length; j++) {
        const v1 = versions[i];
        const v2 = versions[j];
        const result1 = Utils.compareVersions(v1, v2);
        const result2 = Utils.compareVersions(v1, v2);

        // Same comparison should always return same result
        assert.strictEqual(result1, result2, `Version comparison should be consistent for ${v1} vs ${v2}`);

        // Test transitivity: if a < b and b < c, then a < c
        if (i < j) {
          assert.ok(result1 === 2, `Version ${v1} should be less than ${v2}`);
        } else if (i > j) {
          assert.ok(result1 === 1, `Version ${v1} should be greater than ${v2}`);
        } else {
          assert.ok(result1 === 0, `Version ${v1} should equal ${v2}`);
        }
      }
    }
  });
});
