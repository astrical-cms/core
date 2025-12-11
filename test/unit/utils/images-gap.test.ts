
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findImage, adaptOpenGraphImages } from '../../../src/utils/images';

vi.mock('astro:assets', () => ({
    getImage: vi.fn()
}));

describe('src/utils/images (Gaps)', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return null if local image not found in fetch map', async () => {
        // Mock fetchLocalImages indirectly by mocking import.meta.glob behavior if we could, 
        // but findImage calls fetchLocalImages which is exported. 
        // But findImage is in the same module so it calls the local function, 
        // likely not the exported one if not using `this` or module import.
        // However, findImage calls `fetchLocalImages()`.

        // Wait, we can mock the internal state or the `import.meta.glob` via a special vitest feature 
        // OR we just assume `fetchLocalImages` returns the result of `import.meta.glob`.

        // Let's rely on the fact that `fetchLocalImages` caches the result of `load()`.
        // If we can control `import.meta.glob`, we can control the result.

        // But `import.meta.glob` is hard to mock in vitest environment sometimes.
        // A better approach is to rely on `findImage` logic.

        // Loophole: `findImage` checks `images && typeof images[key] === 'function'`.
        // If we pass a path like '~/assets/images/nonexistent.png', 
        // `key` becomes '/src/assets/images/nonexistent.png'.
        // If glob didn't find it, it's undefined.
        // So findImage returns null.

        const result = await findImage('~/assets/images/nonexistent.png');
        expect(result).toBeNull();
    });

    it('should handle adaptOpenGraphImages returning object without dimensions', async () => {
        const { getImage } = await import('astro:assets');
        (getImage as any).mockResolvedValue({
            src: 'optimized.jpg'
            // missing width/height
        });

        const og = {
            images: [{ url: 'http://example.com/image.jpg' }]
        };

        const result = await adaptOpenGraphImages(og, new URL('https://example.com'));
        expect(result.images?.[0].width).toBeUndefined();
    });
});
