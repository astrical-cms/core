/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { getOrderedMiddleware, onRequest } from '../../src/middleware';
import { sequence } from 'astro/middleware';

// Mock astro/middleware
vi.mock('astro/middleware', () => ({
    defineMiddleware: vi.fn((fn) => fn),
    sequence: vi.fn((...args) => args),
}));

// Mock site:config
vi.mock('site:config', () => ({
    MIDDLEWARE: ['mod-a', 'mod-b'],
}));

describe('src/middleware', () => {
    it('should resolve middleware in the correct order', () => {
        const mockMwA = () => { };
        const mockMwB = () => { };

        const modules = {
            '../modules/mod-a/middleware.ts': { onRequest: mockMwA },
            '../modules/mod-b/middleware.ts': { onRequest: mockMwB },
            '../modules/mod-c/middleware.ts': { onRequest: () => { } }, // Not in order list
        };

        const order = ['mod-b', 'mod-a']; // Reversed order

        const result = getOrderedMiddleware(modules as any, order);

        expect(result).toHaveLength(2);
        expect(result[0]).toBe(mockMwB);
        expect(result[1]).toBe(mockMwA);
    });

    it('should ignore modules not in the order list', () => {
        const mockMwA = () => { };
        const modules = {
            '../modules/mod-a/middleware.ts': { onRequest: mockMwA },
            '../modules/mod-b/middleware.ts': { onRequest: () => { } },
        };

        const order = ['mod-a'];

        const result = getOrderedMiddleware(modules as any, order);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockMwA);
    });

    it('should skip ordered modules that are missing middleware file', () => {
        const mockMwA = () => { };
        const modules = {
            '../modules/mod-a/middleware.ts': { onRequest: mockMwA },
        };

        // mod-b is in order but not in modules map
        const order = ['mod-a', 'mod-b'];

        const result = getOrderedMiddleware(modules as any, order);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockMwA);
    });

    it('should skip ordered modules that have middleware file but no onRequest export', () => {
        const mockMwA = () => { };
        const modules = {
            '../modules/mod-a/middleware.ts': { onRequest: mockMwA },
            '../modules/mod-b/middleware.ts': { /* no onRequest */ },
        };

        const order = ['mod-a', 'mod-b'];

        const result = getOrderedMiddleware(modules as any, order);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockMwA);
    });

    it('should handle regex matching correctly', () => {
        const mockMw = () => { };
        const modules = {
            // Valid path
            '../modules/valid/middleware.ts': { onRequest: mockMw },
            // Invalid paths
            '../other/invalid/middleware.ts': { onRequest: mockMw },
            '../modules/sub/dir/middleware.ts': { onRequest: mockMw }, // Too deep if regex is strict?
            '../modules/nots-middleware.ts': { onRequest: mockMw },
        };

        // strict regex: /\.\.\/modules\/([^/]+)\/middleware\.ts$/
        // sub/dir/middleware.ts will NOT match ([^/]+) which allows no slashes. Correct.

        const order = ['valid', 'sub'];
        const result = getOrderedMiddleware(modules as any, order);

        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockMw);
    });

    it('should export onRequest using sequence', () => {
        // onRequest is created at module level using defaults.
        // Testing it verifies the default flow.
        // In this test file, MIDDLEWARE is mocked as ['mod-a', 'mod-b']
        // But middlewareModules (import.meta.glob) is likely empty or whatever is on disk.
        // Since mock is empty/undefined context for glob here, onRequest might be empty sequence.
        // But we just want to ensure it is defined.
        expect(onRequest).toBeDefined();
        expect(sequence).toHaveBeenCalled();
    });
});
