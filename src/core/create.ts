import { randomUUID } from "node:crypto";
import type { CreateInput, GuardStackPayload } from "../types";
import { DEFAULT_EXPIRY_SECONDS } from "../utils/constants";
import { signJwt } from "../crypto/jwt";
import { buildRequestBinding } from "../utils/request";

export class Create {
  private issuer: string;
  private audience: string;
  constructor(issuer: string, audience: string) {
    this.issuer = issuer;
    this.audience = audience;
  }
  execute(input: CreateInput): string {
    const nowEpoch = Math.floor((input.now ?? new Date()).getTime() / 1000);
    const expiresIn = input.expiresIn ?? DEFAULT_EXPIRY_SECONDS;
    const requestBinding = buildRequestBinding(input.request);

    const payload: GuardStackPayload = {
      iss: input.issuer,
      aud: input.audience,
      iat: nowEpoch,
      exp: nowEpoch + expiresIn,
      jti: randomUUID(),
      ...requestBinding,
    };

    return signJwt(payload, input.secret, input.kid);
  }
}
