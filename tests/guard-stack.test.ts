import { describe, expect, test } from "vitest";
import { create, MemoryNonceStore, validate } from "../src";

const gatewaySecret = "gateway-secret";
const serviceASecret = "service-a-secret";

describe("guard-stack", () => {
  test("creates and validates token", async () => {
    const token = create({
      issuer: "api-gateway",
      audience: "service-a",
      secret: gatewaySecret,
      request: {
        method: "POST",
        path: "/payments/create",
        body: { amount: 25 }
      }
    });

    const result = await validate({
      token,
      currentService: "service-a",
      trustedIssuers: {
        "api-gateway": gatewaySecret
      },
      request: {
        method: "POST",
        path: "/payments/create",
        body: { amount: 25 }
      }
    });

    expect(result.valid).toBe(true);
    expect(result.payload?.iss).toBe("api-gateway");
  });

  test("detects tampered tokens", async () => {
    const token = create({
      issuer: "api-gateway",
      audience: "service-a",
      secret: gatewaySecret
    });

    const tampered = `${token.slice(0, -1)}A`;
    const result = await validate({
      token: tampered,
      currentService: "service-a",
      trustedIssuers: {
        "api-gateway": gatewaySecret
      }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("SIGNATURE_INVALID");
  });

  test("rejects expired tokens", async () => {
    const now = new Date("2026-01-01T00:00:31.000Z");
    const token = create({
      issuer: "api-gateway",
      audience: "service-a",
      secret: gatewaySecret,
      expiresIn: 1,
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    const result = await validate({
      token,
      currentService: "service-a",
      trustedIssuers: { "api-gateway": gatewaySecret },
      now
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("TOKEN_EXPIRED");
  });

  test("rejects wrong audience", async () => {
    const token = create({
      issuer: "api-gateway",
      audience: "service-b",
      secret: gatewaySecret
    });

    const result = await validate({
      token,
      currentService: "service-a",
      trustedIssuers: { "api-gateway": gatewaySecret }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("AUDIENCE_MISMATCH");
  });

  test("rejects wrong issuer", async () => {
    const token = create({
      issuer: "service-a",
      audience: "service-b",
      secret: serviceASecret
    });

    const result = await validate({
      token,
      currentService: "service-b",
      trustedIssuers: { "api-gateway": gatewaySecret }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("ISSUER_UNTRUSTED");
  });

  test("rejects request body hash mismatch", async () => {
    const token = create({
      issuer: "service-a",
      audience: "service-b",
      secret: serviceASecret,
      request: {
        method: "POST",
        path: "/billing/pay",
        body: { amount: 100, currency: "USD" }
      }
    });

    const result = await validate({
      token,
      currentService: "service-b",
      trustedIssuers: { "service-a": serviceASecret },
      request: {
        method: "POST",
        path: "/billing/pay",
        body: { amount: 100, currency: "EUR" }
      }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("REQUEST_BODY_HASH_MISMATCH");
  });

  test("rejects replayed token", async () => {
    const nonceStore = new MemoryNonceStore();
    const token = create({
      issuer: "service-a",
      audience: "service-b",
      secret: serviceASecret
    });

    const first = await validate({
      token,
      currentService: "service-b",
      trustedIssuers: { "service-a": serviceASecret },
      nonceStore
    });

    const second = await validate({
      token,
      currentService: "service-b",
      trustedIssuers: { "service-a": serviceASecret },
      nonceStore
    });

    expect(first.valid).toBe(true);
    expect(second.valid).toBe(false);
    expect(second.reason).toBe("REPLAY_DETECTED");
  });
});
