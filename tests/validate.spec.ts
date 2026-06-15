import { Create, Validate } from '../src';

const secret = 'super-secret-key-for-testing-123456';

describe('Validate', () => {
    const creator = new Create({
        issuer: 'service-a',
        audiences: ['service-b'],
        secret,
    });

    const validator = new Validate({
        currentService: 'service-b',
        trustedIssuers: {
            'service-a': secret,
        },
    });

    test('rejects malformed tokens', async () => {
        const result = await validator.execute({
            token: 'not.a.jwt.token',
        });

        expect(result.valid).toBe(false);
    });

    test('rejects tampered signatures', async () => {
        const token = creator.execute({});

        const tampered = token.slice(0, -5) + 'A';

        const result = await validator.execute({
            token: tampered,
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('SIGNATURE_INVALID');
    });

    test('rejects tokens signed with wrong secret', async () => {
        const badCreator = new Create({
            issuer: 'service-a',
            audiences: ['service-b'],
            secret: 'wrong-secret',
        });

        const token = badCreator.execute({});

        const result = await validator.execute({
            token,
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('SIGNATURE_INVALID');
    });

    test('rejects expired tokens', async () => {
        const token = creator.execute({
            expiresIn: 0,
        });

        const result = await validator.execute({
            token,
            clockToleranceSeconds: 0,
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('TOKEN_EXPIRED');
    });

    test('rejects wrong audience', async () => {
        const otherCreator = new Create({
            issuer: 'service-a',
            audiences: ['service-c'],
            secret,
        });

        const token = otherCreator.execute({});

        const result = await validator.execute({
            token,
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('AUDIENCE_MISMATCH');
    });

    test('rejects untrusted issuers', async () => {
        const token = creator.execute({});

        const anotherValidator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-x': secret,
            },
        });

        const result = await anotherValidator.execute({
            token,
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('ISSUER_UNTRUSTED');
    });

    test('rejects request method mismatch', async () => {
        const token = creator.execute({
            request: {
                method: 'POST',
                path: '/payments',
            },
        });

        const result = await validator.execute({
            token,
            request: {
                method: 'GET',
                path: '/payments',
            },
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('REQUEST_METHOD_MISMATCH');
    });

    test('rejects request path mismatch', async () => {
        const token = creator.execute({
            request: {
                method: 'GET',
                path: '/payments',
            },
        });

        const result = await validator.execute({
            token,
            request: {
                method: 'GET',
                path: '/users',
            },
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('REQUEST_PATH_MISMATCH');
    });

    test('rejects request body tampering', async () => {
        const token = creator.execute({
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    amount: 100,
                },
            },
        });

        const result = await validator.execute({
            token,
            request: {
                method: 'POST',
                path: '/payments',
                body: {
                    amount: 999,
                },
            },
        });

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('REQUEST_BODY_HASH_MISMATCH');
    });

    test('detects replay attacks using NonceStore', async () => {
        const nonceStore = {
            add: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        };

        const replayValidator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-a': secret,
            },
            nonceStore,
        });

        const token = creator.execute({});

        const first = await replayValidator.execute({
            token,
        });

        const second = await replayValidator.execute({
            token,
        });

        expect(first.valid).toBe(true);
        expect(second.valid).toBe(false);
        expect(second.reason).toBe('REPLAY_DETECTED');
    });

    test('passes the remaining TTL to NonceStore', async () => {
        const nonceStore = {
            add: jest.fn().mockResolvedValue(true),
        };

        const token = creator.execute({
            expiresIn: 60,
        });

        const replayValidator = new Validate({
            currentService: 'service-b',
            trustedIssuers: {
                'service-a': secret,
            },
            nonceStore,
        });

        await replayValidator.execute({
            token,
        });

        expect(nonceStore.add).toHaveBeenCalledWith(expect.any(String), 60);
    });
});
