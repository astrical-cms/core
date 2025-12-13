/**
 * src/core/test/unit/utils/forms.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper to mock dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDependencies = (handlerNames: string[] | undefined, handlersConfig: any, formsConfig: any = {}) => {
    vi.doMock('site:config', () => ({
        FORM_HANDLERS: {
            defaults: handlerNames,
            handlers: handlersConfig
        },
        FORMS: formsConfig
    }));

    vi.doMock('astro:env/server', () => ({
        getSecret: vi.fn(),
    }));

    vi.doMock('~/form-registry', () => ({
        formHandlers: {
            get: vi.fn(),
            register: vi.fn(),
        }
    }));
};

describe('src/utils/forms', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should execute default handler', async () => {
        const formsConfig = {
            'contact': {
                handlers: {
                    'test-handler': { recipient: 'override@example.com' }
                }
            }
        };
        mockDependencies(['test-handler'], { 'test-handler': { enabled: true, recipient: 'default@example.com' } }, formsConfig);

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        const mockHandler = {
            name: 'test-handler',
            handle: vi.fn().mockResolvedValue(undefined)
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(mockHandler);

        await formProcessor('contact', { name: 'John' }, []);

        expect(formHandlers.get).toHaveBeenCalledWith('test-handler');
        expect(mockHandler.handle).toHaveBeenCalledWith(
            'contact',
            { name: 'John' },
            [],
            expect.objectContaining({ recipient: 'override@example.com', enabled: true })
        );
    });

    it('should skip disabled handler', async () => {
        mockDependencies(['disabled-handler'], { 'disabled-handler': { enabled: false } });

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        const mockHandler = { name: 'disabled-handler', handle: vi.fn() };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(mockHandler);

        await formProcessor('contact', {}, []);

        expect(formHandlers.get).toHaveBeenCalledWith('disabled-handler');
        expect(mockHandler.handle).not.toHaveBeenCalled();
    });

    it('should handle missing handler config (defaults to empty object)', async () => {
        mockDependencies(['test-handler'], {}); // handlers config empty

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        const mockHandler = { name: 'test-handler', handle: vi.fn() };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(mockHandler);

        await formProcessor('contact', {}, []);

        expect(mockHandler.handle).toHaveBeenCalled();
    });

    it('should warn and continue if handler not found', async () => {
        mockDependencies(['missing-handler'], {});

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(undefined);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        await formProcessor('contact', {}, []);

        expect(formHandlers.get).toHaveBeenCalledWith('missing-handler');
        expect(consoleSpy).toHaveBeenCalledWith("FormProcessor: Handler 'missing-handler' not found in registry.");
    });

    it('should throw error if all handlers fail', async () => {
        mockDependencies(['test-handler'], { 'test-handler': { enabled: true } });

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        const mockHandler = {
            name: 'test-handler',
            handle: vi.fn().mockRejectedValue(new Error('Fail'))
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(mockHandler);

        await expect(formProcessor('contact', {}, [])).rejects.toThrow('Form processing failed: test-handler: Fail');
    });

    it('should fallback to default handler if defaults undefined', async () => {
        mockDependencies(undefined, {}); // defaults undefined

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(undefined); // mailgun missing mock (warns)

        await formProcessor('contact', {}, []);

        // Should try 'mailgun' by default
        expect(formHandlers.get).toHaveBeenCalledWith('mailgun');
    });

    it('should handle non-Error objects thrown by handler', async () => {
        mockDependencies(['test-handler'], { 'test-handler': { enabled: true } });

        const { formProcessor } = await import('~/utils/forms');
        const { formHandlers } = await import('~/form-registry');

        const mockHandler = {
            name: 'test-handler',
            handle: vi.fn().mockRejectedValue('String Error')
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formHandlers.get as any).mockReturnValue(mockHandler);

        await expect(formProcessor('contact', {}, [])).rejects.toThrow('Form processing failed: test-handler: String Error');
    });
});
