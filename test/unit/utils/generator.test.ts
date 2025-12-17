/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate, generateLinks, getHeaderMenu, getFooterMenu, getActions, getAuxMenu, getSocialMenu, getFootNote, getFormField, generateData, generateSite, generateSection } from '~/utils/generator';

vi.mock('~/utils/loader', () => ({
    getSpecs: vi.fn(),
}));
vi.mock('~/utils/router', () => ({
    routes: vi.fn(),
}));
vi.mock('~/components', () => ({
    supportedTypes: {
        'TestComponent': { isAstro: true }
    }
}));
// Mock site:config
vi.mock('site:config', () => ({
    SITE: { organization: 'Test Org' }
}));

import { getSpecs } from '~/utils/loader';
import { routes } from '~/utils/router';

describe('src/utils/generator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Menu Getters', () => {
        beforeEach(() => {
            (getSpecs as any).mockReturnValue({
                'header': [{ text: 'Home' }],
                'footer': [{ title: 'Links' }],
                'actions': [{ text: 'Click' }],
                'auxillary': [{ text: 'Aux' }],
                'social': [{ text: 'Social' }]
            });
        });

        it('should retrieve all menu types', () => {

            expect(getHeaderMenu()).toEqual([{ text: 'Home' }]);
            expect(getFooterMenu()).toEqual([{ title: 'Links' }]);
            expect(getActions()).toEqual([{ text: 'Click' }]);
            expect(getAuxMenu()).toEqual([{ text: 'Aux' }]);
            expect(getSocialMenu()).toEqual([{ text: 'Social' }]);
        });
    });

    describe('getFootNote()', () => {
        it('should return copyright string with year and org', () => {
            const year = new Date().getFullYear();
            expect(getFootNote()).toBe(`© ${year}, Test Org`);
        });
    });

    describe('generate() & generateSection()', () => {

        it('should resolve supported components', () => {
            const components = [
                { type: 'TestComponent', props: { a: 1 } },
                { type: 'Unknown', props: { b: 2 } }
            ];
            const result = generate(components as any);
            expect(result).toHaveLength(1);
            expect(result[0].props).toEqual({ type: 'TestComponent', props: { a: 1 } });
        });

        it('should wrap components with access control in AuthGuard', () => {
            const components = [
                { type: 'TestComponent', props: { a: 1 }, access: ['admin'] }
            ];
            const result = generate(components as any);
            expect(result).toHaveLength(1);
            // AuthGuard is used as component
            expect(result[0].props).toHaveProperty('requiredRoles', ['admin']);
            expect(result[0].props).toHaveProperty('checkMode', 'any');
            expect(result[0].props).toHaveProperty('component');
        });

        it('should handle empty input', () => {
            expect(generate(undefined as any)).toEqual([]);
            expect(generateSection(undefined as any)).toEqual([]);
        });
    });

    describe('generateLinks()', () => {
        it('should return page links excluding home', () => {
            (routes as any).mockReturnValue([
                { name: 'home' },
                { name: 'page1' },
                { name: 'page2' }
            ]);
            expect(generateLinks()).toEqual(['page1', 'page2']);
        });

        it('should filter pages based on access control', () => {
            (routes as any).mockReturnValue([
                { name: 'page1', props: { metadata: { access: ['public'] } } },
                { name: 'page2', props: { metadata: { access: ['admin'] } } },
                { name: 'page3', props: { metadata: {} } },
                { name: 'page4', props: {} }
            ]);
            expect(generateLinks()).toEqual(['page1', 'page3', 'page4']);
        });
    });

    describe('getFormField()', () => {

        it('should generate form field config', () => {
            const item = { name: 'email', type: 'text', label: 'Email', placeholder: 'Enter email' };
            const result = getFormField('contact', item as any);

            expect(result.name).toBe('contact-email');
            expect(result.type).toBe('field');
            expect(result.props.name).toBe('contact-email');
            expect(result.props.label).toBe('Email');
            expect(result.tag).toBeUndefined(); // 'text' not in supportedTypes mock
        });

        it('should handle supported field type', () => {
            const item = { name: 'field1', type: 'TestComponent' };
            const result = getFormField('form', item as any);
            expect(result.tag).toBeDefined();
            expect(result.tag).toEqual({ isAstro: true });
        });
    });

    describe('Data Generation', () => {
        it('should generate clean data stripping styles and enforcing access control', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return {
                    'home': {
                        title: 'Home',
                        bg: 'red',
                        classes: 'p-4',
                        metadata: { access: ['public'] },
                        sections: [
                            {
                                // Public section with map structure
                                access: ['public'],
                                components: {
                                    main: [
                                        { type: 'PublicWidget', text: 'Visible', access: ['public'] },
                                        { type: 'PrivateWidget', text: 'Hidden', access: ['admin'] },
                                        { type: 'DefaultWidget', text: 'Also Visible' } // No access implies public
                                    ]
                                }
                            },
                            {
                                // Private section
                                access: ['admin'],
                                components: {
                                    main: [
                                        { type: 'PublicWidgetInSection', text: 'HiddenBySection', access: ['public'] }
                                    ]
                                }
                            }
                        ]
                    }
                };
                if (type === 'menus') return { header: [] };
                return {};
            });

            const data = generateData('home');

            // Check root properties
            expect(data).toEqual(expect.objectContaining({
                title: 'Home',
                // metadata.access is stripped by stripStyle
            }));

            expect((data as any).bg).toBeUndefined();

            // Check flattened widgets
            const widgets = (data as any).widgets;
            expect(widgets).toHaveLength(2);

            // Widget 1: PublicWidget
            expect(widgets[0]).toEqual({
                type: 'PublicWidget',
                text: 'Visible'
            });
            // Should strip access prop from output
            expect(widgets[0].access).toBeUndefined();

            // Widget 2: DefaultWidget
            expect(widgets[1]).toEqual({
                type: 'DefaultWidget',
                text: 'Also Visible'
            });

            // Private widget and Private section contents should be missing
            expect(widgets.find((w: any) => w.text === 'Hidden')).toBeUndefined();
            expect(widgets.find((w: any) => w.text === 'HiddenBySection')).toBeUndefined();
        });

        it('should handle missing page data in generateData', () => {
            (getSpecs as any).mockReturnValue({});
            expect(generateData('missing')).toBeNull();
        });

        it('should handle page with no sections', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return { 'empty-page': { title: 'Empty' } };
                return {};
            });
            const result = generateData('empty-page');
            expect((result as any).widgets).toEqual([]);
        });

        it('should ignore invalid component map values', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return {
                    'invalid-map': {
                        title: 'Invalid',
                        sections: [{
                            components: {
                                main: 'not-an-array', // Should be ignored
                                valid: [{ type: 'W1', text: 'Valid' }]
                            }
                        }]
                    }
                };
                return {};
            });
            const result = generateData('invalid-map');
            expect((result as any).widgets).toHaveLength(1);
            expect((result as any).widgets[0].text).toBe('Valid');
        });

        it('should generate complete site data excluding private pages', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return {
                    'p1': {
                        title: 'P1',
                        metadata: { access: ['public'] },
                        sections: [{ components: { main: [{ type: 'W1', text: 'T1' }] } }]
                    },
                    'p2': {
                        title: 'P2',
                        metadata: { access: ['admin'] },
                        sections: []
                    }
                };
                if (type === 'menus') return { header: [{ text: 'H' }] };
                return {};
            });

            const site = generateSite();
            expect((site as any).menus).toEqual({ header: [{ text: 'H' }] });

            // Public page should be present
            expect((site as any).pages['p1']).toBeDefined();
            expect(((site as any).pages['p1'] as any).widgets[0].text).toBe('T1');

            // Private page should be excluded
            expect((site as any).pages['p2']).toBeUndefined();
        });
    });
});
