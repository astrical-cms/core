/**
 * src/core/test/unit/utils/form-handlers/smtp.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SMTPHandler } from '~/form-handlers/smtp';

// Mock utils
vi.mock('~/utils/utils', () => ({
    isEdge: vi.fn(),
    isProd: vi.fn(),
    trim: vi.fn((s) => s),
    isObject: vi.fn(),
    mergeDeep: vi.fn(),
    formatter: { format: vi.fn() },
    getFormattedDate: vi.fn(),
    toUiAmount: vi.fn()
}));

vi.mock('astro:env/server', () => ({
    getSecret: vi.fn((key) => process.env[key])
}));

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = vi.fn().mockReturnValue({
    sendMail: mockSendMail
});

vi.mock('nodemailer', () => ({
    createTransport: mockCreateTransport,
    default: {
        createTransport: mockCreateTransport
    }
}));

// Mock worker-mailer
const mockWorkerSend = vi.fn().mockResolvedValue({ id: 'worker-id' });
const mockWorkerConnect = vi.fn().mockResolvedValue({
    send: mockWorkerSend
});

vi.mock('worker-mailer', () => ({
    WorkerMailer: {
        connect: mockWorkerConnect
    }
}));

describe('SMTPHandler', () => {
    let handler: SMTPHandler;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        handler = new SMTPHandler();

        // Setup default env vars
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'user';
        process.env.SMTP_PASS = 'pass';
        process.env.SMTP_FROM = 'sender@test.com';
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SMTP_FROM;
    });

    describe('Node.js Environment', () => {
        beforeEach(async () => {
            const utils = await import('~/utils/utils');
            (utils.isEdge as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(false);
        });

        it('should send email using nodemailer via createTransport', async () => {
            const data = { name: 'Test User', email: 'test@example.com' };
            // Use Uint8Array for attachments as per new signature
            const attachments = [{ filename: 'test.txt', data: new Uint8Array([1, 2, 3]) }];
            const config = { recipients: ['admin@example.com'] };

            await handler.handle('contact', data, attachments, config);

            expect(mockCreateTransport).toHaveBeenCalledWith({
                host: 'smtp.test.com',
                port: 587,
                secure: false, // Default
                auth: { user: 'user', pass: 'pass' }
            });

            expect(mockSendMail).toHaveBeenCalledWith({
                from: 'sender@test.com',
                to: 'admin@example.com',
                subject: 'New Submission: contact',
                text: expect.stringContaining('name: Test User'),
                html: expect.stringContaining('name: Test User'),
                attachments: [{ filename: 'test.txt', content: Buffer.from(new Uint8Array([1, 2, 3])) }]
            });
        });

        it('should handle array data values', async () => {
            const data = { skills: ['Node', 'Edge'] };
            await handler.handle('contact', data, [], { recipients: 'test@test.com' });

            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('skills: Node, Edge')
            }));
        });

        it('should use default empty strings when configuration is missing', async () => {
            // Unset env vars to force default fallbacks
            delete process.env.SMTP_HOST;
            delete process.env.SMTP_PORT;
            delete process.env.SMTP_USER;
            delete process.env.SMTP_PASS;
            delete process.env.SMTP_FROM;

            await handler.handle('contact', {}, [], { recipients: 'test@test.com' });

            expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
                host: '',
                port: 587, // Default port
                auth: { user: '', pass: '' }
            }));
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: 'noreply@example.com' // Default from
            }));
        });

        it('should log warning and return if no recipients configured', async () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            await handler.handle('contact', {}, [], {});
            expect(consoleSpy).toHaveBeenCalledWith("SMTPHandler: No recipients configured for form 'contact'.");
        });

        it('should handle SMTP errors gracefully', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('Auth failed'));

            await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
                .rejects.toThrow('Node SMTP Error: Auth failed');
        });

        it('should handle non-Error objects gracefully', async () => {
            mockSendMail.mockRejectedValueOnce('String Error');

            await expect(handler.handle('contact', {}, [], { recipients: 'admin@example.com' }))
                .rejects.toThrow('Node SMTP Error: String Error');
        });

        it('should send email via Node with array of recipients', async () => {
            await handler.handle('contact', {}, [], { recipients: ['a@node.com', 'b@node.com'] });

            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'a@node.com,b@node.com'
            }));
        });
    });

    describe('Edge Environment (Cloudflare)', () => {
        beforeEach(async () => {
            const utils = await import('~/utils/utils');
            (utils.isEdge as unknown as { mockReturnValue: (val: boolean) => void }).mockReturnValue(true);
        });

        it('should send email using worker-mailer via connect', async () => {
            const data = { name: 'Edge User' };
            const attachments = [{ filename: 'doc.pdf', data: new Uint8Array([10, 20]) }];
            const config = { recipients: ['edge@example.com'], secure: true };

            await handler.handle('contact', data, attachments, config);

            expect(mockWorkerConnect).toHaveBeenCalledWith({
                transport: {
                    host: 'smtp.test.com',
                    port: 587,
                    secure: true,
                    auth: { user: 'user', pass: 'pass' }
                },
                defaults: {
                    from: { name: 'Website Form', address: 'sender@test.com' }
                }
            });

            expect(mockWorkerConnect).toHaveBeenCalledWith({
                transport: {
                    host: 'smtp.test.com',
                    port: 587,
                    secure: true,
                    auth: { user: 'user', pass: 'pass' }
                },
                defaults: {
                    from: { name: 'Website Form', address: 'sender@test.com' }
                }
            });

            expect(mockWorkerSend).toHaveBeenCalledWith({
                to: 'edge@example.com',
                subject: 'New Submission: contact',
                text: expect.stringContaining('name: Edge User'),
                html: expect.stringContaining('name: Edge User'),
                attachments: [{
                    filename: 'doc.pdf',
                    content: new Uint8Array([10, 20]),
                    contentType: 'application/octet-stream'
                }]
            });
        });

        it('should send email with no attachments in Edge', async () => {
            const data = { name: 'No Attachments' };
            const config = { recipients: ['edge@example.com'] };

            await handler.handle('contact', data, [], config);

            expect(mockWorkerSend).toHaveBeenCalledWith(expect.objectContaining({
                attachments: undefined
            }));
        });

        it('should handle WorkerMailer errors', async () => {
            mockWorkerConnect.mockRejectedValueOnce(new Error('Connection timeout'));

            await expect(handler.handle('contact', {}, [], { recipients: 'r' }))
                .rejects.toThrow('Edge SMTP Error: Connection timeout');
        });

        it('should handle non-Error objects gracefully in Edge', async () => {
            mockWorkerConnect.mockRejectedValueOnce('Edge String Error');

            await expect(handler.handle('contact', {}, [], { recipients: 'r' }))
                .rejects.toThrow('Edge SMTP Error: Edge String Error');
        });

        it('should send email via Edge with single recipient string', async () => {
            const data = { name: 'Single Recipient Edge' };
            await handler.handle('contact', data, [], { recipients: 'single@edge.com' });

            expect(mockWorkerSend).toHaveBeenCalledWith(expect.objectContaining({
                to: 'single@edge.com'
            }));
        });
    });

});

