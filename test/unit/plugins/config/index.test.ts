/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import siteConfigPlugin from '~/../plugins/config/index';
// Mock dependencies with hoisted variables
const { mockExistsSync, mockReadFileSync, mockWriteFileSync } = vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockWriteFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
    default: {
        existsSync: mockExistsSync,
        readFileSync: mockReadFileSync,
        writeFileSync: mockWriteFileSync
    }
}));
vi.mock('~/../plugins/config/utils/loader', () => ({
    loadConfig: vi.fn(),
}));
vi.mock('~/utils/content-scanner', () => ({
    scanContent: vi.fn().mockReturnValue({ forms: {} })
}));


import { loadConfig } from '~/../plugins/config/utils/loader';
import { scanContent } from '~/utils/content-scanner';

describe('plugins/config/index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should name the plugin correctly', () => {
        const plugin = siteConfigPlugin();
        expect(plugin.name).toBe('site-config');
    });

    describe('astro:config:setup', () => {
        it('should setup configuration and virtual module', async () => {
            const plugin = siteConfigPlugin({ config: 'test-config.yaml' });
            const hook = plugin.hooks['astro:config:setup'];

            // Mock config loading
            (loadConfig as any).mockResolvedValue({
                site: { name: 'Test Site' }
            });

            // Mock params
            const updateConfig = vi.fn();
            const addWatchFile = vi.fn();
            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) };
            const config = { root: new URL('file:///root/') };

            // @ts-ignore
            await hook({ config, logger, updateConfig, addWatchFile });

            expect(loadConfig).toHaveBeenCalledWith('test-config.yaml');
            expect(updateConfig).toHaveBeenCalledWith(expect.objectContaining({
                site: undefined, // defaults
                base: '/',
                trailingSlash: 'never',
                vite: expect.any(Object)
            }));

            // Verify vite plugin resolution
            const viteConfig = (updateConfig.mock.calls[0][0] as any).vite;
            const vitePlugin = viteConfig.plugins[0];
            expect(vitePlugin.name).toBe('vite-plugin-site_config');

            expect(vitePlugin.resolveId('site:config')).toBe('\0site:config');
            expect(vitePlugin.resolveId('other')).toBeUndefined();

            const loadResult = vitePlugin.load('\0site:config');
            expect(loadResult).toContain('export const SITE =');
            expect(loadResult).toContain('Test Site'); // Should contain loaded config value

            expect(vitePlugin.load('other')).toBeUndefined();
        });

        it('should handle forms without handlers', async () => {
            const plugin = siteConfigPlugin({ config: 'config.yaml' });
            const hook = plugin.hooks['astro:config:setup'];

            (scanContent as any).mockReturnValue({
                forms: {
                    simple: { description: 'Simple form' } // No handlers
                }
            });

            const updateConfig = vi.fn();
            const config = { root: new URL('file:///root/') };
            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) };
            const addWatchFile = vi.fn();

            // @ts-ignore
            await hook({ config, logger, updateConfig, addWatchFile });

            // Verify that FORMS doesn't include the simple form or has empty handlers
            const viteConfig = (updateConfig.mock.calls[0][0] as any).vite;
            const loadResult = viteConfig.plugins[0].load('\0site:config');

            // The loop runs, if(handlers) is false.
            // FORMS should be empty or not contain 'simple'
            expect(loadResult).not.toContain('"simple"');
        });

        it('should handle config in subdirectory', async () => {
            const plugin = siteConfigPlugin({ config: 'subdir/config.yaml' });
            const hook = plugin.hooks['astro:config:setup'];

            (loadConfig as any).mockResolvedValue({ site: { name: 'Sub Site' } });

            const updateConfig = vi.fn();
            const config = { root: new URL('file:///root/') } as any;
            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) } as any;
            const addWatchFile = vi.fn();

            // @ts-ignore
            await hook({ config, logger, updateConfig, addWatchFile });

            expect(updateConfig).toHaveBeenCalled();
        });
    });

    describe('astro:build:done', () => {
        it('should update robots.txt with sitemap', async () => {
            const plugin = siteConfigPlugin();
            const doneHook = plugin.hooks['astro:config:done'];
            const buildHook = plugin.hooks['astro:build:done'];

            // Setup config state
            // @ts-ignore
            await doneHook({
                config: {
                    outDir: new URL('file:///dist/'),
                    publicDir: new URL('file:///public/'),
                    site: 'https://example.com',
                    base: '/',
                    integrations: [{ name: '@astrojs/sitemap', hooks: {} } as any]
                } as any
            });

            // Mock filesystem
            mockExistsSync.mockReturnValue(true); // sitemap exists
            mockReadFileSync.mockReturnValue('User-agent: *');

            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) } as any;

            // @ts-ignore
            await buildHook({ logger });

            expect(mockWriteFileSync).toHaveBeenCalled();
            const writeCall = mockWriteFileSync.mock.calls[0];
            expect(writeCall[1]).toContain('Sitemap: https://example.com/sitemap-index.xml');
        });

        it('should not update if sitemap integration missing', async () => {
            const plugin = siteConfigPlugin();
            const doneHook = plugin.hooks['astro:config:done'];
            const buildHook = plugin.hooks['astro:build:done'];

            // @ts-ignore
            await doneHook({
                config: {
                    integrations: []
                } as any
            });

            mockWriteFileSync.mockClear();
            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) } as any;
            // @ts-ignore
            await buildHook({ logger });

            expect(mockWriteFileSync).not.toHaveBeenCalled();
        });

        it('should replace existing sitemap in robots.txt', async () => {
            const plugin = siteConfigPlugin();
            const doneHook = plugin.hooks['astro:config:done'];
            const buildHook = plugin.hooks['astro:build:done'];

            // @ts-ignore
            await doneHook({
                config: {
                    outDir: new URL('file:///dist/'),
                    publicDir: new URL('file:///public/'),
                    site: 'https://example.com',
                    base: '/',
                    integrations: [{ name: '@astrojs/sitemap', hooks: {} } as any]
                } as any
            });

            mockExistsSync.mockReturnValue(true);
            mockReadFileSync.mockReturnValue('User-agent: *\nSitemap: old-url');
            mockWriteFileSync.mockClear();

            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) } as any;
            // @ts-ignore
            await buildHook({ logger });

            expect(mockWriteFileSync).toHaveBeenCalled();
            const writeCall = mockWriteFileSync.mock.calls[0];
            expect(writeCall[1]).toContain('Sitemap: https://example.com/sitemap-index.xml');
            expect(writeCall[1]).not.toContain('old-url');
        });

        it('should handle errors silently', async () => {
            const plugin = siteConfigPlugin();
            const doneHook = plugin.hooks['astro:config:done'];
            const buildHook = plugin.hooks['astro:build:done'];

            // Force error by passing invalid config structure that causes crash in try block
            // @ts-ignore
            await doneHook({ config: null });

            const logger = { fork: vi.fn().mockReturnValue({ info: vi.fn() }) };

            // Should not throw
            // @ts-ignore
            await expect(buildHook({ logger: logger as any })).resolves.not.toThrow();
        });
    });

    describe('getContentPath', () => {
        it('should handle root paths', async () => {
            // Re-import to trigger setup with different config
            const plugin = siteConfigPlugin({ config: 'config.yaml' });
            const hook = plugin.hooks['astro:config:setup'];

            (scanContent as any).mockReturnValue({
                forms: {
                    contact: { handlers: { smtp: {} } }
                }
            });

            const updateConfig = vi.fn();
            // @ts-ignore
            await hook({
                config: { root: new URL('file:///root/') } as any,
                logger: { fork: vi.fn().mockReturnValue({ info: vi.fn() }) } as any,
                updateConfig,
                addWatchFile: vi.fn()
            });

            // contentDir should be root path
            expect(loadConfig).toHaveBeenCalledWith('config.yaml');
            // Also properly handled forms with handlers
            const viteConfig = (updateConfig.mock.calls[0][0] as any).vite;
            const loadResult = viteConfig.plugins[0].load('\0site:config');
            expect(loadResult).toContain('"contact"');
            expect(loadResult).toContain('"handlers"');
        });
    });
});

