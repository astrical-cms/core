/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '~/pages/api/submit-form';
import { formProcessor } from '~/utils/forms';

// Mock formProcessor
vi.mock('~/utils/forms', () => ({
    formProcessor: vi.fn(),
}));

describe('pages/api/submit-form', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 200 for bot field (honeypot)', async () => {
        const formData = new FormData();
        formData.append('bot-field', 'I am a bot');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(formProcessor).not.toHaveBeenCalled();
    });

    it('should return 400 if form name is missing', async () => {
        const formData = new FormData();

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Form name is required');
    });

    it('should process valid form submission', async () => {
        const formData = new FormData();
        formData.append('form-name', 'contact');
        formData.append('contact-name', 'John Doe');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(formProcessor).toHaveBeenCalledWith('contact', { name: 'John Doe' }, []);
    });

    it('should handle array fields (checkboxes)', async () => {
        const formData = new FormData();
        formData.append('form-name', 'survey');
        formData.append('survey-options', 'A');
        formData.append('survey-options', 'B');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);

        expect(response.status).toBe(200);
        expect(formProcessor).toHaveBeenCalledWith('survey', { options: ['A', 'B'] }, []);
    });

    it('should handle file attachments', async () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        // Ensure arrayBuffer is available (Node/Vitest compatibility)
        if (!file.arrayBuffer) {
            (file as any).arrayBuffer = async () => new TextEncoder().encode('content');
        }

        // Mock request.formData() to return an iterable that yields our exact File instance
        const mockFormData = {
            get: (key: string) => {
                if (key === 'form-name') return 'upload';
                return null;
            },
            entries: function* () {
                yield ['form-name', 'upload'];
                yield ['upload-file', file];
            }
        };

        const request = {
            formData: async () => mockFormData
        };

        const response = await POST({ request } as any);

        if (response.status !== 200) {
            console.error('API Error:', await response.json());
        }

        expect(response.status).toBe(200);
        // When using FormData in Node/Vitest environment with node-fetch/undici polyfills,
        // the File object behavior might differ slightly.
        // We typically expect the processor to receive the text content or a proper object.
        // In the implementation, it extracts `value.name` and reads `arrayBuffer()`.

        // Since we are mocking Request/FormData interaction, let's verify what the implementation actually does.
        // It reads from formData.entries().

        expect(formProcessor).toHaveBeenCalledWith(
            'upload',
            expect.objectContaining({
                'file': expect.stringContaining('Attached file: test.txt')
            }),
            expect.arrayContaining([
                expect.objectContaining({ filename: 'test.txt' })
            ])
        );
    });

    it('should ignore empty bot field and process form', async () => {
        const formData = new FormData();
        formData.append('form-name', 'contact');
        formData.append('bot-field', ''); // Empty honeypot should be ignored
        formData.append('contact-name', 'Jane Doe');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(formProcessor).toHaveBeenCalledWith('contact', { name: 'Jane Doe' }, []);
    });

    it('should handle formProcessor errors', async () => {
        (formProcessor as any).mockRejectedValueOnce(new Error('Processing failed'));

        const formData = new FormData();
        formData.append('form-name', 'contact');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Processing failed');
    });

    it('should handle unknown error types gracefully', async () => {
        (formProcessor as any).mockRejectedValueOnce('Critical string error');

        const formData = new FormData();
        formData.append('form-name', 'contact');

        const request = new Request('http://localhost/api/submit-form', {
            method: 'POST',
            body: formData,
        });

        const response = await POST({ request } as any);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
    });
});
