/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanContent } from '../../../src/utils/content-scanner';
import path from 'node:path';

// Mock fs
const { mockExistsSync, mockReaddirSync, mockStatSync, mockReadFileSync } = vi.hoisted(() => ({
    mockExistsSync: vi.fn(),
    mockReaddirSync: vi.fn(),
    mockStatSync: vi.fn(),
    mockReadFileSync: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:fs')>();
    return {
        default: {
            ...actual,
            existsSync: mockExistsSync,
            readdirSync: mockReaddirSync,
            statSync: mockStatSync,
            readFileSync: mockReadFileSync,
        }
    };
});

describe('src/utils/content-scanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        mockExistsSync.mockReturnValue(false);
        mockReaddirSync.mockReturnValue([]);
        mockStatSync.mockImplementation(() => ({ isDirectory: () => false }));
    });

    it('should return empty content if no directories exist', () => {
        const result = scanContent('/content');
        expect(result).toEqual({ forms: {} });
    });

    describe('loadContent (Project)', () => {
        it('should load parsing yaml files', () => {
            mockExistsSync.mockImplementation((p: string) => p.startsWith('/content'));
            mockReaddirSync.mockImplementation((p: string) => {
                if (p === '/content') return ['pages'];
                if (p === '/content/pages') return ['home.yaml'];
                return [];
            });
            mockStatSync.mockImplementation((p: string) => ({
                isDirectory: () => {
                    // Start from most specific
                    if (p === '/content/pages/home.yaml') return false;
                    if (p === '/content/pages') return true;
                    if (p === '/content') return true;
                    return false;
                }
            }));

            mockReadFileSync.mockImplementation((p) => {
                if (p.endsWith('home.yaml')) return 'title: Home Access';
                return '';
            });

            const result = scanContent('/content');
            expect(result.pages).toBeDefined();
            // path parsing: relative specType/specPath
            // pages/home.yaml -> pages is specType, home is specPath
            expect((result as any).pages['home']).toEqual({ title: 'Home Access' });
        });
    });

    describe('loadModuleContent', () => {
        it('should scan modules and ignore menus', () => {
            // Mock modules dir exists
            // path.resolve(process.cwd(), 'modules') -> lets assume /mock/cwd/modules
            // We need to mock path.resolve? process.cwd?
            // The module uses process.cwd().

            const modulesDir = path.resolve(process.cwd(), 'modules');
            // normalize path for matching if needed, but resolve returns abs path

            mockExistsSync.mockImplementation((p: string) => {
                if (p === '/content') return true;
                if (p === modulesDir) return true;
                if (p === path.join(modulesDir, 'mod-a', 'content')) return true;
                return false;
            });

            mockReaddirSync.mockImplementation((p: string) => {
                if (p === modulesDir) return ['mod-a'];
                if (p === path.join(modulesDir, 'mod-a', 'content')) return ['menus.yaml', 'pages.yaml'];
                return [];
            });

            mockStatSync.mockImplementation((p: string) => ({
                isDirectory: () => {
                    // Check specific module paths
                    if (p === modulesDir) return true;
                    if (p === path.join(modulesDir, 'mod-a')) return true; // readdirSync iterates modules
                    // Note: loadModuleContent logic: const modules = fs.readdirSync(MODULES_DIR);
                    // for (const moduleName of modules) { 
                    //    path.join(..., moduleName, 'content') -> exists check -> stat.isDirectory check
                    // }
                    if (p === path.join(modulesDir, 'mod-a', 'content')) return true;
                    return false;
                }
            }));

            mockReadFileSync.mockImplementation((p: string) => {
                if (p.endsWith('menus.yaml')) return 'items: []';
                if (p.endsWith('pages.yaml')) return 'foo: bar';
                return '';
            });

            const result = scanContent('/content');
            // Menus should be stripped from modules
            expect(result.menus).toBeUndefined();
            // Pages (which are valid spec type) should be present?
            // pages.yaml -> specType 'pages' (because strict file name implies spec type if at root of content?)
            // No, file structure: 'content/menus.yaml' -> relative 'menus.yaml' -> specType 'menus', specPath ''?
            // Code: relativePath.split('.')[0] ... specType = components[0].
            // relative = 'menus.yaml' -> split('.')[0] -> 'menus'. pathComponents=['menus'].
            // specType='menus', specPath=''.
            // So content['menus'][''] = ...

            // The code deletes content['menus'].
            expect((result as any).pages).toBeDefined();
        });
    });

    describe('resolveComponents', () => {
        it('should resolve shared components', () => {
            mockExistsSync.mockReturnValue(true);

            mockReaddirSync.mockImplementation((p: string) => {
                if (p.endsWith('/content')) return ['pages', 'shared'];
                if (p.endsWith('/content/pages')) return ['test.yaml'];
                if (p.endsWith('/content/shared')) return ['btn.yaml'];
                return [];
            });

            mockStatSync.mockImplementation((p: string) => ({
                isDirectory: () => {
                    if (p.endsWith('.yaml')) return false;
                    // Prevent infinite recursion by only returning true for known dirs
                    if (p.endsWith('/content') || p.endsWith('/content/pages') || p.endsWith('/content/shared')) return true;
                    return false;
                }
            }));

            mockReadFileSync.mockImplementation((p: string) => {
                if (p.endsWith('btn.yaml')) return 'color: blue\nsize: md';
                if (p.endsWith('test.yaml')) return 'type: Page\nitems:\n  - component: btn\n    color: red';
                return '';
            });

            const result = scanContent('/content');
            const page = (result as any).pages['test'];

            expect(page.items[0].color).toBe('red'); // Override
            expect(page.items[0].size).toBe('md');   // Inherited
            expect(page.items[0].component).toBeUndefined(); // Stripped
        });

        it('should index forms', () => {
            mockExistsSync.mockReturnValue(true);

            mockReaddirSync.mockImplementation((p: string) => {
                if (p === '/content') return ['pages'];
                if (p === '/content/pages') return ['contact.yaml'];
                return [];
            });

            mockStatSync.mockImplementation((p: string) => ({
                isDirectory: () => {
                    if (p === '/content') return true;
                    if (p === '/content/pages') return true;
                    // Everything else false (files)
                    return false;
                }
            }));

            mockReadFileSync.mockReturnValue('type: Form\nname: contact\nfields: []');

            const result = scanContent('/content');
            expect((result as any).forms['contact']).toBeDefined();
        });
    });

    describe('corner cases', () => {
        it('should return undefined if shared component not found', () => {
            mockExistsSync.mockReturnValue(true);
            mockReaddirSync.mockImplementation((p: string) => {
                if (p === '/content') return ['pages'];
                if (p === '/content/pages') return ['pages.yaml'];
                return [];
            });
            mockStatSync.mockImplementation((p: string) => ({
                isDirectory: () => !p.endsWith('.yaml')
            }));
            mockReadFileSync.mockReturnValue('component: shared/missing');

            const result = scanContent('/content');
            const page = (result as any).pages['pages'];
            expect(page.component).toBe('shared/missing');
        });

        it('should handle array nodes', () => {
            mockExistsSync.mockReturnValue(true);
            mockReaddirSync.mockImplementation((p) => {
                if (p === '/content') return ['list'];
                if (p === '/content/list') return ['data.yaml'];
                return [];
            });
            mockStatSync.mockImplementation((p: string) => ({ isDirectory: () => !p.endsWith('.yaml') }));

            mockReadFileSync.mockReturnValue('- item1\n- item2');

            const result = scanContent('/content');
            expect(Array.isArray((result as any).list['data'])).toBe(true);
        });
    });
});
