
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { generateSection, generate, getFormField } from '../../../src/utils/generator';

// Mock supportedTypes
vi.mock('~/components', () => ({
    supportedTypes: {
        'Hero': 'hero-component',
        'Input': 'input-component'
    }
}));

describe('src/utils/generator (Gaps)', () => {
    it('should generate sections given valid components', () => {
        const components = [{ type: 'Hero', title: 'Test' }];
        const result = generateSection(components);
        expect(result).toHaveLength(1);
        expect(result[0].props).toEqual(components[0]);
    });

    it('should handle unsupported component types', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const components = [{ type: 'Unknown' }];
        const result = generate(components);

        expect(result).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Unsupported or unresolved component type'),
            expect.anything()
        );
        consoleSpy.mockRestore();
    });

    it('should handle unsupported form field types', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const item = { name: 'field1', type: 'UnknownType' };

        getFormField('test-form', item as any);

        expect(consoleSpy).toHaveBeenCalledWith('Unsupported field type: UnknownType');
        consoleSpy.mockRestore();
    });
});
