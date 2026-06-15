import { NonceStore } from '../adapters/NonceStore';
import { GUARD_STACK_ALGORITHM, GUARD_STACK_TOKEN_TYPE } from '../utils/constants';

export type GuardStackAlgorithm = typeof GUARD_STACK_ALGORITHM;

export type GuardStackPayload = {
    iss: string;
    aud: string[];
    iat: number;
    exp: number;
    jti: string;
    mth?: string;
    pth?: string;
    bdy?: string;
};

export type GuardStackHeader = {
    alg: GuardStackAlgorithm;
    typ: typeof GUARD_STACK_TOKEN_TYPE;
    kid?: string;
};

export type ValidationReason =
    | 'MALFORMED_TOKEN'
    | 'INVALID_HEADER'
    | 'ALGORITHM_NOT_ALLOWED'
    | 'SIGNATURE_INVALID'
    | 'PAYLOAD_INVALID'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_NOT_ACTIVE'
    | 'ISSUER_UNTRUSTED'
    | 'AUDIENCE_MISMATCH'
    | 'REPLAY_DETECTED'
    | 'REQUEST_METHOD_MISMATCH'
    | 'REQUEST_PATH_MISMATCH'
    | 'REQUEST_BODY_HASH_MISMATCH'
    | 'SECRET_NOT_FOUND'
    | 'NONCE_STORE_ERROR';

export type ValidationResult = {
    valid: boolean;
    reason?: ValidationReason;
    payload?: GuardStackPayload;
};

export type RequestBindingInput = {
    method?: string;
    path?: string;
    body?: unknown;
};

export type SecretProvider = (
    issuer: string,
    kid?: string,
) => Promise<string | undefined> | string | undefined;

export type CreateInput = {
    kid?: string;
    request?: RequestBindingInput;
    expiresIn?: number;
    now?: Date;
};

export type ValidateInput = {
    token: string;
    request?: RequestBindingInput;
    // allowedAlgorithms?: ReadonlyArray<GuardStackAlgorithm>;
    clockToleranceSeconds?: number;
    now?: Date;
};

export type GuardStackMiddlewareOptions = {
    currentService: string;
    trustedIssuers: Record<string, string>;
    nonceStore?: NonceStore;
    headerName?: string;
    onValidationFailed?: (result: ValidationResult) => void | Promise<void>;
};
