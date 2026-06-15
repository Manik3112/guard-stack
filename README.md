# @manik3112/guard-stack

`@manik3112/guard-stack` secures internal service-to-service calls by signing and validating JWT request envelopes with strict `HS256`.

```bash
npm i @manik3112/guard-stack
```

This package is for internal microservice trust only:
- Request signing
- Service identity verification
- Replay protection
- Optional request binding (method + path + body hash)

This package is not for user authentication, sessions, OAuth, or RBAC.

## Quick Start

```ts
import { Create, Validate } from "@manik3112/guard-stack";

const create = new Create({
  issuer: "service-a",
  audiences: ["service-b"],
  secret: process.env.SERVICE_A_SECRET!,
});

const token = create.execute({
  request: {
    method: "POST",
    path: "/payments/create",
    body: { amount: 499 },
  },
  expiresIn: 30,
});

const validate = new Validate({
  currentService: "service-b",
  trustedIssuers: {
    "service-a": process.env.SERVICE_A_SECRET!,
  },
});

const result = await validate.execute({
  token,
  request: {
    method: "POST",
    path: "/payments/create",
    body: { amount: 499 },
  },
});

if (result.valid) {
  console.log("Caller:", result.payload?.iss);
} else {
  console.error("Rejected:", result.reason);
}
```

## Security Model

- **Algorithm lock:** only explicit allowed algorithms are accepted (default: `HS256`)
- **No alg auto-detection:** `alg: none` and unexpected algorithms are rejected
- **Per-service secrets:** each issuer has its own secret
- **Audience check:** token `aud` must include the current service
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
  aud: string[];
  iat: number;
  exp: number;
  jti: string;
  mth?: string;
  pth?: string;
  bdy?: string;
}
```

## Public API

### `Create`

Configure the issuing service once, then call `execute` per token:

```ts
const create = new Create({ issuer, audiences, secret });
const token = create.execute(input); // returns string
```

Constructor options:
```ts
{
  issuer: string;
  audiences: string[];
  secret: string;
}
```

`CreateInput`:
```ts
type CreateInput = {
  kid?: string;
  request?: RequestBindingInput;
  expiresIn?: number;
  now?: Date;
};
```

### `Validate`

Configure the receiving service once, then call `execute` per request:

```ts
const validate = new Validate(options);
const result = await validate.execute(input); // returns Promise<ValidationResult>
```

Constructor options (`GuardStackMiddlewareOptions`):
```ts
type GuardStackMiddlewareOptions = {
  currentService: string;
  trustedIssuers: Record<string, string>;
  headerName?: string;
  onValidationFailed?: (result: ValidationResult) => void | Promise<void>;
};
```

`ValidateInput`:
```ts
type ValidateInput = {
  token: string;
  request?: RequestBindingInput;
  allowedAlgorithms?: ReadonlyArray<"HS256">;
  clockToleranceSeconds?: number;
  now?: Date;
};
```

`ValidationResult`:
```ts
type ValidationResult = {
  valid: boolean;
  reason?: ValidationReason;
  payload?: GuardStackPayload;
};
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

`Create.execute` accepts an optional `kid` that is written into the JWT header. Validation resolves secrets from `trustedIssuers`, keyed by issuer:

```ts
const create = new Create({
  issuer: "service-a",
  audiences: ["service-b"],
  secret: process.env.SERVICE_A_SECRET_V2!,
});

const token = create.execute({ kid: "service-a-v2" });

const validate = new Validate({
  currentService: "service-b",
  trustedIssuers: {
    "service-a": process.env.SERVICE_A_SECRET_V2!,
  },
});

const result = await validate.execute({ token });
```

## Middleware Adapters

Express, Fastify, and NestJS adapters accept the same `GuardStackMiddlewareOptions` used by the `Validate` constructor:

- Express: `expressMiddleware(options)`
- Fastify: `fastifyPreHandler(options)`
- NestJS: `new GuardStackNestGuard(options)`

```ts
import express from "express";
import { expressMiddleware } from "@manik3112/guard-stack";

const app = express();

app.use(
  expressMiddleware({
    currentService: "service-b",
    trustedIssuers: {
      "service-a": process.env.SERVICE_A_SECRET!,
    },
  }),
);
```

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
