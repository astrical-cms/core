import { describe, it, expect } from 'vitest';
import { mergeDeep } from '~/utils/utils';

describe('Core Utilities Integration', () => {
    it('should correctly merge configuration objects', () => {
        const baseConfig = { site: { title: 'Default' }, features: { analytics: false } };
        const userConfig = { site: { title: 'Custom' } };

        const merged = mergeDeep(baseConfig, userConfig);

        expect(merged.site.title).toBe('Custom');
        expect(merged.features.analytics).toBe(false);
    });
});
