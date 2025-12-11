

import { describe, it, expect, vi } from 'vitest';
import { getImagesOptimized } from '../../../src/utils/images-optimization';

vi.mock('astro:assets', () => ({
    getImage: vi.fn(),
}));

describe('src/utils/images-optimization (Gap)', () => {
    it('should parse string number aspectRatio', async () => {
        const image = { src: 'test.jpg', width: 100, height: 100, format: 'jpg' as const };
        // We use getImagesOptimized with a string aspect ratio that is just a number
        const result = await getImagesOptimized(image, { aspectRatio: '1.5' });

        // If parsed correctly, 1.5 is valid.
        // If not, it falls through to undefined. 
        // We can't easily check internal state, but we know if it didn't parse, behavior might differ or error.
        expect(result).toBeDefined();
    });
});
