export interface NonceStore {
    /**
     * Atomically stores a nonce.
     *
     * Returns:
     * - true  => nonce was stored successfully and the request is accepted.
     * - false => nonce already existed and the request should be rejected as a replay attack.
     *
     * The implementation MUST be atomic to prevent race conditions.
     *
     * The nonce should expire after `ttlSeconds`.
     */
    add(jti: string, ttlSeconds: number): Promise<boolean>;
}
