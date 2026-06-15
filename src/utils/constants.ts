export const GUARD_STACK_TOKEN_TYPE = 'GST';
export const GUARD_STACK_ALGORITHM = 'HS256';
export const DEFAULT_EXPIRY_SECONDS = 30;
export const DEFAULT_CLOCK_TOLERANCE_SECONDS = 2;
export const DEFAULT_AUTH_HEADER_NAME = 'x-serviceguard-token';
export const DEFAULT_ALLOWED_ALGORITHMS = [GUARD_STACK_ALGORITHM] as const;
