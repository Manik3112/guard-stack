import { Create, Validate } from '../src';

const secret = 'super-secret-key-for-testing-123456';

describe('Create', () => {
    const creator = new Create({
        issuer: 'service-a',
        audiences: ['service-b'],
        secret,
    });

    test('creates a valid JWT token', async () => {
        const token = creator.execute({});

        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
    });

    test('creates a token that can be validated', async () => {
        const token = creator.execute({});

        const validator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-a': secret,
            },
        });

        const result = await validator.execute({
            token,
        });

        expect(result.valid).toBe(true);
        expect(result.payload?.iss).toBe('service-a');
        expect(result.payload?.aud).toContain('service-b');
    });

    test('generates a unique jti for each token', () => {
        const token1 = creator.execute({});
        const token2 = creator.execute({});

        expect(token1).not.toBe(token2);
    });

    test('includes request binding information', async () => {
        const token = creator.execute({
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    amount: 100,
                    currency: 'USD',
                },
            },
        });

        const validator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-a': secret,
            },
        });

        const result = await validator.execute({
            token,
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    amount: 100,
                    currency: 'USD',
                },
            },
        });

        expect(result.valid).toBe(true);
    });

    test('creates deterministic body hashes', async () => {
        const token = creator.execute({
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    amount: 100,
                    currency: 'USD',
                },
            },
        });

        const validator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-a': secret,
            },
        });

        const result = await validator.execute({
            token,
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    currency: 'USD',
                    amount: 100,
                },
            },
        });

        expect(result.valid).toBe(true);
    });
});
