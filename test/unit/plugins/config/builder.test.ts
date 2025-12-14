
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest';
import buildConfig from '~/../plugins/config/utils/builder';

describe('plugins/config/utils/builder', () => {
    it('should build default configuration', () => {
        const config = buildConfig({});

        expect(config.SITE.name).toBe('Website');
        expect(config.I18N.language).toBe('en');
        expect(config.UI.theme).toBe('default');
        expect(config.METADATA.title?.default).toBe('Website');
    });

    it('should merge provided configuration', () => {
        const config = buildConfig({
            site: { name: 'Custom Site', contentDir: 'custom' },
            i18n: { language: 'es', textDirection: 'rtl' },
            ui: { theme: 'dark' },
            formHandlers: {
                defaults: ['smtp'],
                handlers: { smtp: { enabled: true } }
            }
        });

        expect(config.SITE.name).toBe('Custom Site');
        expect(config.SITE.contentDir).toBe('custom');
        expect(config.I18N.language).toBe('es');
        expect(config.UI.theme).toBe('dark');
        expect(config.FORM_HANDLERS.defaults).toContain('smtp');
    });

    it('should handle undefined sections', () => {
        // @ts-ignore - testing robustness
        const config = buildConfig(undefined);
        expect(config.SITE.name).toBe('Website');
    });

    it('should use site name for metadata default title', () => {
        const config = buildConfig({ site: { name: 'My Brand', contentDir: '' } });
        expect(config.METADATA.title?.default).toBe('My Brand');
    });

    it('should fall back to default site name if empty string provided', () => {
        const config = buildConfig({ site: { name: '', contentDir: '' } });
        expect(config.METADATA.title?.default).toBe('Website');
    });
});
