import { parseJwt, verifySignature } from "../crypto/jwt";
import {
  type GuardStackPayload,
  type ValidationResult,
  type ValidateInput,
} from "../types";

import {
  DEFAULT_ALLOWED_ALGORITHMS,
  DEFAULT_CLOCK_TOLERANCE_SECONDS,
  GUARD_STACK_TOKEN_TYPE,
} from "../utils/constants";

import { buildRequestBinding } from "../utils/request";

export class Validate {
  async executevalidate(input: ValidateInput): Promise<ValidationResult> {
    const parsed = parseJwt(input.token);
    if (!parsed) {
      return this.fail("MALFORMED_TOKEN");
    }

    const { header, payload, signingInput, signature } = parsed;

    if (
      header.typ !== GUARD_STACK_TOKEN_TYPE ||
      typeof header.alg !== "string"
    ) {
      return this.fail("INVALID_HEADER");
    }

    const allowedAlgorithms =
      input.allowedAlgorithms ?? DEFAULT_ALLOWED_ALGORITHMS;
    if (!allowedAlgorithms.includes(header.alg)) {
      return this.fail("ALGORITHM_NOT_ALLOWED");
    }

    if (!this.isPayloadShapeValid(payload)) {
      return this.fail("PAYLOAD_INVALID");
    }

    if (!input.getSecret && !input.trustedIssuers?.[payload.iss]) {
      return this.fail("ISSUER_UNTRUSTED");
    }

    let secret: string | undefined;
    if (input.getSecret) {
      secret = await input.getSecret(payload.iss, header.kid);
    } else {
      secret = input.trustedIssuers?.[payload.iss];
    }

    if (!secret) {
      return this.fail("SECRET_NOT_FOUND");
    }

    if (!verifySignature(signingInput, signature, secret)) {
      return this.fail("SIGNATURE_INVALID");
    }

    const nowEpoch = Math.floor((input.now ?? new Date()).getTime() / 1000);
    const clockTolerance =
      input.clockToleranceSeconds ?? DEFAULT_CLOCK_TOLERANCE_SECONDS;

    if (payload.iat > nowEpoch + clockTolerance) {
      return this.fail("TOKEN_NOT_ACTIVE");
    }

    if (payload.exp <= nowEpoch - clockTolerance) {
      return this.fail("TOKEN_EXPIRED");
    }

    if (payload.aud !== input.currentService) {
      return this.fail("AUDIENCE_MISMATCH");
    }

    const expectedRequest = buildRequestBinding(input.request);
    if (payload.mth && payload.mth !== expectedRequest.mth) {
      return this.fail("REQUEST_METHOD_MISMATCH");
    }

    if (payload.pth && payload.pth !== expectedRequest.pth) {
      return this.fail("REQUEST_PATH_MISMATCH");
    }

    if (payload.bdy && payload.bdy !== expectedRequest.bdy) {
      return this.fail("REQUEST_BODY_HASH_MISMATCH");
    }

    return {
      valid: true,
      payload,
    };
  }
  isPayloadShapeValid(payload: GuardStackPayload): boolean {
    return (
      typeof payload.iss === "string" &&
      typeof payload.aud === "string" &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.jti === "string"
    );
  }

  fail(reason: ValidationResult["reason"]) {
    return { valid: false, reason };
  }
}
