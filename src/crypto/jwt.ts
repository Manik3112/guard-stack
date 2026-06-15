import { createHmac, timingSafeEqual } from 'node:crypto';
import { decodeBase64Url, encodeBase64Url } from '../utils/base64url';
import { type GuardStackHeader, type GuardStackPayload } from '../types';

import { GUARD_STACK_ALGORITHM, GUARD_STACK_TOKEN_TYPE } from '../utils/constants';

export const signJwt = (payload: GuardStackPayload, secret: string, kid?: string): string => {
    const header: GuardStackHeader = {
        alg: GUARD_STACK_ALGORITHM,
        typ: GUARD_STACK_TOKEN_TYPE,
        kid,
    };

    const encodedHeader = encodeBase64Url(JSON.stringify(header));
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const signature = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();

    return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(signature)}`;
};

const splitJwt = (token: string): [string, string, string] | null => {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return null;
    }

    return [parts[0], parts[1], parts[2]];
};

export const parseJwt = (
    token: string,
): {
    header: GuardStackHeader;
    payload: GuardStackPayload;
    signingInput: string;
    signature: string;
} | null => {
    const parts = splitJwt(token);
    if (!parts) {
        return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    try {
        const header = JSON.parse(decodeBase64Url(encodedHeader)) as GuardStackHeader;
        const payload = JSON.parse(decodeBase64Url(encodedPayload)) as GuardStackPayload;
        return {
            header,
            payload,
            signingInput: `${encodedHeader}.${encodedPayload}`,
            signature,
        };
    } catch (_error) {
        return null;
    }
};

export const verifySignature = (
    signingInput: string,
    providedSignature: string,
    secret: string,
): boolean => {
    const expected = createHmac('sha256', secret).update(signingInput).digest();
    const provided = Buffer.from(providedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    if (provided.length !== expected.length) {
        return false;
    }

    return timingSafeEqual(expected, provided);
};
