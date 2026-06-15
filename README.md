![npm](https://img.shields.io/npm/v/serviceguard-stack)
![downloads](https://img.shields.io/npm/dm/serviceguard-stack)
![license](https://img.shields.io/npm/l/serviceguard-stack)

# Service Guard Stack

Production-grade internal microservice authentication using signed JWT request envelopes.

Service Guard Stack provides a lightweight authentication layer for service-to-service communication by signing requests with HMAC SHA-256, validating trusted issuers, verifying request integrity, and optionally preventing replay attacks.

---

## Features

- 🔐 HMAC SHA-256 signed JWT envelopes
- 🏢 Service-to-service authentication
- 🔒 Request binding using HTTP method, path, and body hash
- ⏱️ Short-lived tokens with expiration validation
- 🧾 Issuer (`iss`) and audience (`aud`) validation
- 🔄 Optional replay protection using a custom `NonceStore`
- ⚡ Framework adapters for:
    - Express
    - NestJS
    - Fastify

- 📦 Zero runtime dependencies
- 🧪 Fully written in TypeScript with generated type definitions

---

## Why Guard Stack?

Traditional API keys only prove who created the request. They do not guarantee that the request contents were not modified during transit.

Guard Stack signs an envelope containing request metadata:

```
HTTP Request
      |
      |
      v
+------------------+
| JWT Envelope     |
|------------------|
| iss              |
| aud              |
| iat              |
| exp              |
| jti              |
| method           |
| path             |
| bodyHash         |
+------------------+
      |
      |
      v
HMAC SHA-256 Signature
```

The receiving service verifies:

- The sender is trusted
- The token is not expired
- The request method matches
- The request path matches
- The request body matches
- The signature is valid
- The token has not been replayed (when `NonceStore` is configured)

---

## Installation

Using npm:

```bash
npm install @manik3112/guard-stack
```

Using pnpm:

```bash
pnpm add @manik3112/guard-stack
```

Using yarn:

```bash
yarn add @manik3112/guard-stack
```

---

## Basic Token Creation

Service A creates a signed request token before calling Service B.

```ts
import { create } from '@manik3112/guard-stack';

const body = {
    name: 'John Doe',
    email: 'john@example.com',
};

const token = create.execute({
    issuer: 'service-a',
    audience: ['service-b'],
    secret: process.env.SERVICE_A_SECRET!,
    method: 'POST',
    path: '/users',
    body,
});
await axios.post('http://service-b.url/users', body, {
    headers: {
        'x-serviceguard-token': token,
    },
});
```

The generated token is sent with the request:

```http
x-serviceguard-token: <guard-stack-token>
```

---

## Express Middleware

Protect incoming routes using the Express middleware.

```ts
import express from 'express';
import { expressMiddleware } from '@manik3112/guard-stack';

const app = express();

app.use(
    expressMiddleware({
        currentService: 'service-b',
        trustedIssuers: {
            'service-a': process.env.SERVICE_A_SECRET!,
        },
    }),
);

app.get('/users', (req, res) => {
    res.json({
        message: 'Authenticated request',
    });
});
```

---

## Middleware Configuration

```ts
type GuardStackMiddlewareOptions = {
    currentService: string;

    /**
     * Map of trusted service names to their shared secrets.
     */
    trustedIssuers: Record<string, string>;

    /**
     * Optional nonce store for replay protection.
     */
    nonceStore?: NonceStore;

    /**
     * Header containing the token.
     *
     * Default: x-serviceguard-token
     */
    headerName?: string;

    /**
     * Callback executed when validation fails.
     */
    onValidationFailed?: (result: ValidationResult) => void | Promise<void>;
};
```

---

## Custom Authorization Header

By default, Guard Stack reads:

```http
x-serviceguard-token: <token>
```

You may use a custom header:

```ts
expressMiddleware({
    currentService: 'service-b',
    trustedIssuers: {
        'service-a': process.env.SERVICE_A_SECRET!,
    },
    headerName: 'x-guard-token',
});
```

The request should then include:

```http
x-guard-token: <token>
```

---

## Replay Protection

Replay protection is optional and can be enabled by providing a `NonceStore`.

Without a `NonceStore`, Guard Stack validates:

- Signature integrity
- Trusted issuer
- Intended audience
- Token expiration
- Request method
- Request path
- Request body hash

To prevent a valid token from being used multiple times within its lifetime, configure a `NonceStore`.

---

## NonceStore Interface

```ts
export interface NonceStore {
    /**
     * Attempts to store a nonce.
     *
     * Returns:
     * - true  => nonce was stored and the request should be accepted.
     * - false => nonce already existed and the request should be rejected as a replay attack.
     *
     * The implementation must:
     * - Store the nonce for the provided TTL.
     * - Perform the operation atomically to prevent race conditions.
     */
    add(jti: string, ttlSeconds: number): Promise<boolean>;
}
```

---

## Development Example (In-Memory)

The following example is suitable for local development or testing.

⚠️ Do not use an in-memory nonce store in production. It does not work correctly when multiple instances of your application are running.

```ts
const memory = new Map<string, number>();

const nonceStore: NonceStore = {
    add: async (jti, ttlSeconds) => {
        if (memory.has(jti)) {
            return false;
        }

        memory.set(jti, Date.now());

        setTimeout(() => {
            memory.delete(jti);
        }, ttlSeconds * 1000);

        return true;
    },
};
```

Use it with the middleware:

```ts
app.use(
    expressMiddleware({
        currentService: 'service-b',
        trustedIssuers: {
            'service-a': process.env.SERVICE_A_SECRET!,
        },
        nonceStore,
    }),
);
```

---

## Production Example (Redis)

For production environments with multiple service instances, use a distributed cache such as Redis.

The operation must be atomic so that only the first request using a given `jti` is accepted.

Example using Redis `SET NX EX`:

```ts
import Redis from 'ioredis';
import { NonceStore } from '@manik3112/guard-stack';

const redis = new Redis(process.env.REDIS_URL);

const nonceStore: NonceStore = {
    add: async (jti, ttlSeconds) => {
        const result = await redis.set(`guard-stack:nonce:${jti}`, '1', 'EX', ttlSeconds, 'NX');

        return result === 'OK';
    },
};
```

---

## NestJS Integration

Use the provided NestJS guard to protect controllers or routes.

```ts
import { GuardStackGuard } from '@manik3112/guard-stack';

@Controller('users')
@UseGuards(GuardStackGuard)
export class UserController {
    @Get()
    getUsers() {
        return ['John', 'Jane'];
    }
}
```

Configure the guard with the same options:

```ts
{
    currentService: 'service-b',
    trustedIssuers: {
        'service-a': process.env.SERVICE_A_SECRET!,
    },
    nonceStore,
}
```

---

## Fastify Integration

Use the Fastify hook to validate incoming requests:

```ts
import { fastifyHook } from '@manik3112/guard-stack';

fastify.addHook(
    'preHandler',
    fastifyHook({
        currentService: 'service-b',
        trustedIssuers: {
            'service-a': process.env.SERVICE_A_SECRET!,
        },
        nonceStore,
    }),
);
```

---

## Validation Flow

Every incoming request follows the following validation sequence:

```
Incoming Request
        |
        v
Extract JWT Token
        |
        v
Verify HMAC Signature
        |
        v
Validate Issuer
        |
        v
Validate Audience
        |
        v
Validate Expiration
        |
        v
Verify HTTP Method
        |
        v
Verify Request Path
        |
        v
Verify Body Hash
        |
        v
Check NonceStore (optional)
        |
        v
Request Accepted
```

---

## Security Considerations

Guard Stack is designed for internal service-to-service communication where services share symmetric secrets.

### Use strong secrets

Shared secrets should be cryptographically random and sufficiently long.

Recommended:

```text
32+ bytes of random data
```

Example:

```bash
openssl rand -hex 32
```

Avoid:

```text
password123
service-secret
my-api-key
```

---

### Keep token lifetimes short

Guard Stack tokens are intended to be short-lived.

Short expiration windows reduce the impact of leaked or intercepted tokens.

Recommended:

```text
30-300 seconds
```

---

### Enable replay protection in production

Without a `NonceStore`, a valid token may be reused until it expires.

For distributed environments such as Kubernetes, ECS, or multiple application instances, use a distributed store such as Redis.

---

### Protect shared secrets

Never:

- Commit secrets to Git
- Hard-code secrets into applications
- Share secrets between unrelated services

Use secret management systems such as:

- Environment variables
- Cloud secret managers
- Vault systems

---

## Validation Errors

When validation fails, Guard Stack returns a `ValidationResult` containing a failure reason.

Examples:

```text
TOKEN_MISSING
TOKEN_INVALID
SIGNATURE_INVALID
ISSUER_UNTRUSTED
AUDIENCE_INVALID
TOKEN_EXPIRED
METHOD_MISMATCH
PATH_MISMATCH
BODY_HASH_MISMATCH
REPLAY_DETECTED
```

These values are useful for logging and monitoring.

In public HTTP responses, avoid exposing detailed failure reasons. A generic:

```http
401 Unauthorized
```

response is recommended.

---

## Design Principles

Guard Stack follows a few important design decisions:

### Framework agnostic core

The authentication and validation logic is independent of Express, NestJS, or Fastify.

Framework integrations are thin adapters around the same validation engine.

---

### No storage dependencies

Guard Stack does not require Redis, databases, or any external services.

Replay protection is implemented through the `NonceStore` interface, allowing applications to choose the storage technology that fits their infrastructure.

---

### Request-bound tokens

Tokens are tied to the actual HTTP request by signing:

- HTTP method
- Normalized request path
- Deterministic body hash

A valid token for:

```http
POST /users
```

cannot be reused for:

```http
DELETE /users
```

or a modified request body.

---

### Zero runtime dependencies

The package depends only on Node.js built-in cryptographic primitives.

This reduces:

- Supply chain risks
- Installation size
- Dependency maintenance overhead

---

## Package Structure

```text
src/
├── adapters/      # Framework and external integration contracts
├── core/          # Token creation and validation flows
├── crypto/        # HMAC, hashing and JWT utilities
├── middleware/    # Express, NestJS and Fastify integrations
├── types/         # Public TypeScript types
└── utils/         # Request and encoding utilities
```

---

## Current Limitations

### Key rotation (`kid`)

Tokens support an optional `kid` (Key ID) header field.

However, `kid` is currently informational and is not used during validation.

Secret rotation with multiple active keys for the same issuer is planned for a future release.

---

## Roadmap

Planned improvements:

- Support multiple active secrets per issuer using `kid`
- Additional framework integrations
- More built-in testing utilities
- Enhanced security tooling and examples

---

## Versioning

Guard Stack follows semantic versioning.

Breaking changes will only be introduced in major releases.

---

## License

ISC License.

---

Made with ❤️ for secure service-to-service communication.
