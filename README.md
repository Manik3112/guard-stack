# guard-stack

`guard-stack` secures internal service-to-service calls by signing and validating JWT request envelopes with strict `HS256`.

This package is for internal microservice trust only:
- Request signing
- Service identity verification
- Replay protection
- Optional request binding (method + path + body hash)

This package is not for user authentication, sessions, OAuth, or RBAC.

## Quick Start

```ts
import { create, validate } from "guard-stack";

const token = create({
  issuer: "service-a",
  audience: "service-b",
  secret: process.env.SERVICE_A_SECRET!,
  request: {
    method: "POST",
    path: "/payments/create",
    body: { amount: 499 }
  },
  expiresIn: 30
});

const result = await validate({
  token,
  currentService: "service-b",
  trustedIssuers: {
    "service-a": process.env.SERVICE_A_SECRET!
  },
  request: {
    method: "POST",
    path: "/payments/create",
    body: { amount: 499 }
  }
});
```

## Security Model

- **Algorithm lock:** only explicit allowed algorithms are accepted (default: `HS256`)
- **No alg auto-detection:** `alg: none` and unexpected algorithms are rejected
- **Per-service secrets:** each issuer has its own secret
- **Audience check:** token must target current service
- **Expiry check:** short-lived tokens (default 30s)
- **Replay defense:** optional `NonceStore` blocks duplicate `jti`
- **Request binding:** can bind token to method/path/body-hash

## Token Format

Header:
```json
{
  "alg": "HS256",
  "typ": "GST",
  "kid": "service-a-v1"
}
```

Payload:
```ts
type GuardStackPayload = {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
  mth?: string;
  pth?: string;
  bdy?: string;
}
```

## Public API

- `create(input): string`
- `validate(input): Promise<ValidationResult>`

`ValidationResult`:
```ts
type ValidationResult = {
  valid: boolean;
  reason?: string;
  payload?: GuardStackPayload;
}
```

## Nonce Stores

Interface:
```ts
interface NonceStore {
  has(jti: string): Promise<boolean>;
  set(jti: string, ttlSeconds: number): Promise<void>;
}
```

Built-in:
- `MemoryNonceStore`
- `RedisNonceStore` (`ioredis`-compatible client)

## Secret Rotation

`create` supports `kid`; `validate` supports async secret resolution via:

```ts
getSecret: async (issuer, kid) => { ... }
```

## Middleware Adapters

- Express: `expressMiddleware(options)`
- Fastify: `fastifyPreHandler(options)`
- NestJS: `GuardStackNestGuard`

See `examples/` for working snippets.

## Architecture

```txt
src/
  core/        # create/validate flows
  crypto/      # JWT HMAC signing + verification
  middleware/  # Express/NestJS/Fastify adapters
  stores/      # Nonce store adapters
  types/       # Public type contracts
  utils/       # Hashing/normalization utilities
tests/
examples/
```

Flow diagram:

```txt
Client -> API Gateway --(GST token)--> Service A --(new GST token)--> Service B
```

## Development

```bash
npm install
npm test
npm run build
```
