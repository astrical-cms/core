/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanModules, sortModules, type Module } from '../../../../plugins/config/utils/module-scanner';

const { mockExistsSync, mockReadFileSync, mockReaddirSync, mockLstatSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockReaddirSync: vi.fn(),
  mockLstatSync: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    default: {
      ...actual,
      existsSync: mockExistsSync,
      readFileSync: mockReadFileSync,
      readdirSync: mockReaddirSync,
      lstatSync: mockLstatSync,
    }
  };
});

describe('module-scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanModules', () => {
    it('should return empty array if modules directory does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      const result = scanModules('/path/to/modules');
      expect(result).toEqual([]); // Expected empty array if modules dir missing
    });

  });

  it('should scan modules correctly', () => {
    mockExistsSync.mockImplementation((path: string) => {
      if (path === '/modules') return true;
      if (path === '/modules/mod-a/module.yaml') return true;
      if (path === '/modules/mod-b/module.yaml') return false;
      return false;
    });

    mockReaddirSync.mockReturnValue([
      { name: 'mod-a', isDirectory: () => true },
      { name: 'mod-b', isDirectory: () => true },
      { name: 'not-a-module', isDirectory: () => false },
    ] as any);

    mockReadFileSync.mockImplementation((path: string) => {
      if (path === '/modules/mod-a/module.yaml') return 'name: "CustomName"\ndependencies: ["mod-b"]';
      return '';
    });

    const result = scanModules('/modules');

    expect(result).toHaveLength(2);
    // mod-a has manifest
    expect(result[0]).toMatchObject({
      name: 'CustomName',
      path: '/modules/mod-a',
      manifest: { name: 'CustomName', dependencies: ['mod-b'] }
    });
    // mod-b falls back to dir name
    expect(result[1]).toMatchObject({
      name: 'mod-b',
      path: '/modules/mod-b',
      manifest: undefined
    });
  });

  it('should handle invalid manifest gracefully', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([{ name: 'mod-a', isDirectory: () => true }] as any);
    mockReadFileSync.mockImplementation(() => { throw new Error('Invalid YAML'); });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    const result = scanModules('/modules');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('mod-a');
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('sortModules', () => {
  it('should sort modules topologically', () => {
    const modules: Module[] = [
      { name: 'A', path: '/a', manifest: { name: 'A', dependencies: ['B'] } },
      { name: 'B', path: '/b', manifest: { name: 'B' } },
      { name: 'C', path: '/c', manifest: { name: 'C', dependencies: ['A'] } },
    ];

    const sorted = sortModules(modules);
    expect(sorted).toEqual(['B', 'A', 'C']);
  });

  it('should handle modules without dependencies', () => {
    const modules: Module[] = [
      { name: 'A', path: '/a' },
      { name: 'B', path: '/b' },
    ];

    const sorted = sortModules(modules);
    // Order is stable for independent modules (insertion order)
    expect(sorted).toEqual(['A', 'B']);
  });

  it('should detect cycles and log error', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const modules: Module[] = [
      { name: 'A', path: '/a', manifest: { name: 'A', dependencies: ['B'] } },
      { name: 'B', path: '/b', manifest: { name: 'B', dependencies: ['A'] } },
    ];

    const sorted = sortModules(modules);

    // It should break the cycle. The exact output depends on implementation detail of which one is visited first.
    // But it should finish without infinite loop.
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Circular dependency detected'));
    expect(sorted.length).toBeGreaterThan(0);

    consoleErrorSpy.mockRestore();
  });

  it('should ignore missing dependencies', () => {
    const modules: Module[] = [{ name: 'A', path: '/a', manifest: { name: 'A', dependencies: ['MISSING'] } }];

    const sorted = sortModules(modules);
    expect(sorted).toEqual(['A']);
  });
  it('should handle cycle detection with re-entry (coverage for line 144)', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const modules: Module[] = [
      { name: 'C', path: '/c', manifest: { name: 'C', dependencies: ['A'] } },
      { name: 'A', path: '/a', manifest: { name: 'A', dependencies: ['B'] } },
      { name: 'B', path: '/b', manifest: { name: 'B', dependencies: ['A'] } },
    ];

    sortModules(modules);

    // Verification: The cycle A<->B should be broken. C depends on A.
    // Logic:
    // 1. Visit C -> Visit A -> Visit B -> Visit A (Cycle A). Returns.
    // 2. B finishes. A finishes? No, A returned early.
    // 3. C finishes.
    // 4. Loop visits A. A is in cycleDetected. Returns (Hits Line 144).

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Circular dependency detected'));
    // We expect some valid output for the rest.
    consoleErrorSpy.mockRestore();
  });
});
