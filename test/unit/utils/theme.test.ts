/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getComponentClasses, getClasses } from '~/utils/theme';

vi.mock('node:fs');
vi.mock('js-yaml');
vi.mock('~/utils/cache', () => ({
    checkVar: vi.fn(() => false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));
vi.mock('site:config', () => ({
    UI: { theme: 'default' },
    I18N: {
        language: 'en',
        textDirection: 'ltr',
    }
}));

describe('src/utils/theme', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');
        vi.spyOn(yaml, 'load').mockReturnValue({});
    });

    describe('getComponentClasses()', () => {
        it('should resolve classes', () => {
            const mockThemeStyles = {
                'group1': 'style-1',
                'group2': 'style-2',
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = {
                base: 'class-base @group1',
                nested: {
                    inner: '@group2'
                }
            };

            const resolved = getComponentClasses(classes);
            expect(resolved.base).toContain('style-1');
            expect(resolved.base).toContain('class-base');
            expect((resolved.nested as any).inner).toBe('style-2');
        });

        it('should return empty object if no classes provided', () => {
            expect(getComponentClasses(undefined)).toEqual({});
        });

        it('should resolve recursive group references', () => {
            const mockThemeStyles = {
                'group1': '@group2',
                'group2': 'final-style',
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = { base: '@group1' };
            const resolved = getComponentClasses(classes);
            expect(resolved.base).toBe('final-style');
        });

        it('should handle non-string resolution', () => {
            const mockThemeStyles = { 'group': 123 }; // Invalid group type
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = { base: '@group', other: 456, deep: { val: 789 } };
            const resolved = getComponentClasses(classes);
            expect(resolved.base).toBe(''); // Should resolve to empty string
            expect(resolved.other).toBe(456); // Should pass through
            expect((resolved.deep as any).val).toBe(789);
        });
    });

    describe('getClasses()', () => {
        it('should merge theme and override classes', () => {
            const mockThemeStyles = {
                'Button': { base: 'btn-base', icon: 'icon-base' }
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const overrides = { base: 'btn-override' };

            const result = getClasses('Button', overrides);

            expect(result.base).toBe('btn-override');
            expect(result.icon).toBe('icon-base');
        });
    });

    describe('Error handling', () => {
        it('should handle fs errors gracefully', () => {
            (fs.readFileSync as any).mockImplementation(() => { throw new Error('File not found'); });
            const resolved = getComponentClasses({});
            expect(resolved).toEqual({});
        });
    });
});
