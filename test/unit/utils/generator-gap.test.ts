/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { generateSection, generate, getFormField, generateData } from '../../../src/utils/generator';
import { getSpecs } from '../../../src/utils/loader';

// Mock supportedTypes
vi.mock('~/components', () => ({
    supportedTypes: {
        'Hero': 'hero-component',
        'Input': 'input-component'
    }
}));

vi.mock('../../../src/utils/loader', () => ({
    getSpecs: vi.fn((type) => {
        if (type === 'pages') return {}; // Return empty pages for missing page test
        return {};
    })
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

    it('should ignore inherited properties in getFormField', () => {
        const item = Object.create({ inherited: 'value' });
        item.name = 'field';
        item.type = 'text';

        const result = getFormField('form', item);
        expect(result.props).not.toHaveProperty('inherited');
        // 'text' is not a supported type in the mock, so it falls back or returns something else.
        // Wait, props.type is NOT the component type. Component type is 'field'.
        // props is what we are checking.
        // In getFormField:
        // for (const property in item) ...
        // if property == 'name' -> props[name] = ...
        // else if property != 'type' -> props[property] = item[property]
        // So 'type' is EXCLUDED from props.
        // Ah, so expectations were wrong. I should expect 'type' is NOT in props.
        expect(result.props).not.toHaveProperty('type');
    });

    it('should ignore inherited properties in stripStyle via generateData', () => {
        // We mocked getSpecs at the top level
        // We can access the mock via import if we import the mocked module?
        // But since we used vi.mock with a factory, we can't easily access the spy unless we imported it first.

        // Let's redefine the mock for this test if possible, or assume generic behavior?
        // Actually, we can just use `vi.mocked` on the imported function if we import it.
        // We did NOT import it yet.

        // Wait, stripStyle is internal. generateData calls getSpecs('pages') -> returns data.
        // Then calls stripStyle(data).
        // If we want to test stripStyle's inherited property check:
        // formatting:
        // for (const key in data) { if (hasOwnProperty) ... }
        // We need 'data' to have inherited properties.
        // `getSpecs` returns the data.

        // So we need getSpecs to return an object with inherited properties.

        // We can use a spy on the imported getSpecs?
        // But getSpecs IS imported from loader?
        // No, in this test file, we only imported from generator.

        // We need to import getSpecs from loader to spy on it.
        // And ensure the mock at top level allows us to update it.

        const mockedGetSpecs = vi.mocked(getSpecs);

        // Define an object with inherited properties and some own properties
        const inheritedProto = { inherited: 'value', classes: 'hidden-inherited' };
        const componentWithInherited = Object.create(inheritedProto);
        componentWithInherited.prop = 'real';
        componentWithInherited.bg = 'red'; // This should be stripped by stripStyle
        componentWithInherited.classes = 'visible-own'; // This should override inherited and then be stripped

        mockedGetSpecs.mockImplementation((type) => {
            if (type === 'pages') {
                return {
                    'test-page-with-inherited': {
                        sections: [
                            {
                                components: [
                                    componentWithInherited
                                ]
                            }
                        ]
                    }
                };
            }
            return {};
        });

        const result = generateData('test-page-with-inherited');



        expect(result).not.toBeNull();
        const resEnv = result as any;
        expect(resEnv.sections).toHaveLength(1);
        expect(resEnv.sections[0].components).toHaveLength(1);

        const processedComponent = resEnv.sections[0].components[0];

        // 'inherited' from prototype should not be present
        expect(processedComponent).not.toHaveProperty('inherited');
        // 'classes' (both inherited and own) should be stripped by stripStyle
        expect(processedComponent).not.toHaveProperty('classes');
        // 'bg' (own property) should be stripped by stripStyle
        expect(processedComponent).not.toHaveProperty('bg');
        // 'prop' (own property) should remain
        expect(processedComponent).toHaveProperty('prop', 'real');

        // Ensure no other unexpected properties are present
        expect(processedComponent).toEqual({ prop: 'real' });

        mockedGetSpecs.mockRestore(); // Restore the original mock implementation
    });

    it('should handle missing page data in generateData', () => {
        const result = generateData('missing-page');
        expect(result).toBeNull();
    });

    it('should handle missing page data in generateData', () => {
        // We've imported generateData which uses getSpecs from loader.ts.
        // We need to mock getSpecs.
        // Since we are inside the test already, we can rely on existing mocks or define a new one for this module.
        // However, `loader.ts` imports were not mocked at the top of this file for getSpecs.
        // We need to add mock for `../../../src/utils/loader`.

        // mocking happens at top level usually.
        // I'll add the mock at the top and then spy on it here if needed, or just let it default.
    });

});

