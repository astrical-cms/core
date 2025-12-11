
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getClasses, getComponentClasses } from '../../../src/utils/theme';

vi.mock('node:fs');
vi.mock('js-yaml');
vi.mock('../../../src/utils/cache', () => ({
    checkVar: vi.fn(() => false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));

// We need to mock site:config differently to test the fallback
vi.mock('site:config', async () => {
    return {
        UI: {}, // No theme defined, should fallback to 'default'
        I18N: { language: 'en' }
    };
});

describe('src/utils/theme (Gaps)', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
    });

    it('should fallback to default theme if UI.theme is undefined', () => {
        // Mock fs to verify we look for 'default' theme
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');
        (yaml.load as any).mockReturnValue({});

        getClasses('Test');

        expect(fs.readFileSync).toHaveBeenCalledWith(
            expect.stringContaining('src/themes/default/style.yaml'),
            'utf-8'
        );
    });

    it('should handle undefined component styles', () => {
        // Mock loadStyles to return empty object (handled by mocking yaml.load to return {})
        (yaml.load as any).mockReturnValue({});

        const result = getClasses('NonExistent');
        expect(result).toEqual({});
    });

    it('should handle module loading errors', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true); // Modules dir exists
        vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
            throw new Error('Read dir failed');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        getClasses('Test');

        expect(consoleSpy).toHaveBeenCalledWith('Error loading module styles:', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle theme style loading errors', () => {
        // Mock modules existence false to skip that block
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            if (p.includes('modules')) return false;
            if (p.includes('themes')) return true;
            return false;
        });

        vi.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
            if (p.includes('themes')) throw new Error('Theme load failed');
            return '';
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        getClasses('Test');

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error loading theme style file'),
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    it('should handle user style loading errors', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            if (p.includes('content/style.yaml')) return true;
            return false;
        });

        vi.spyOn(fs, 'readFileSync').mockImplementation((p: any) => {
            if (p.includes('content/style.yaml')) throw new Error('User load failed');
            return '';
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        getClasses('Test');

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error loading user style file'),
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    it('should iterate multiple modules and handle missing style files', () => {
        vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
            if (p.endsWith('modules')) return true;
            if (p.includes('mod1') && p.endsWith('style.yaml')) return true;
            if (p.includes('mod2') && p.endsWith('style.yaml')) return false;
            return false;
        });

        (fs.readdirSync as any).mockReturnValue(['mod1', 'mod2']);
        (fs.readFileSync as any).mockReturnValue('color: red');
        (yaml.load as any).mockReturnValue({ color: 'red' });

        getClasses('Any');
        // Not checking result specifically, just coverage of the loop and branch
    });

    it('should handle empty class string in resolveClasses', () => {
        const result = getComponentClasses({ base: '' });
        expect(result.base).toBe('');
    });

    it('should handle yaml load returning null', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');
        (yaml.load as any).mockReturnValue(null);

        const classes = getClasses('Test');
        expect(classes).toEqual({});
    });
});

