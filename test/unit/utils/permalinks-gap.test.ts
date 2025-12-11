

import { describe, it, expect, vi } from 'vitest';

// We need to mock site:config BEFORE importing the module
vi.mock('site:config', async () => {
    return {
        SITE: {
            base: '/custom-base',
            trailingSlash: true,
            site: 'https://example.com'
        },
        I18N: { language: 'en' }
    };
});

import { getAsset, createPath, getCanonical, getPermalink } from '../../../src/utils/permalinks';

describe('src/utils/permalinks (Gaps)', () => {
    it('should use configured base path for assets', () => {
        expect(getAsset('img/logo.png')).toBe('/custom-base/img/logo.png');
    });

    it('should handle trailing slash in createPath', () => {
        // trailingSlash is true in our mock
        expect(createPath('foo')).toBe('/foo/');
        expect(createPath('')).toBe('/');
    });

    it('should generate canonical with trailing slash', () => {
        expect(getCanonical('/foo')).toBe('https://example.com/foo/');
    });

    it('should generate permalink with base and trailing slash', () => {
        expect(getPermalink('page')).toBe('/custom-base/page/');
    });
});
