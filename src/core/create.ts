import { randomUUID } from "node:crypto";
import type { CreateInput, GuardStackPayload } from "../types";
import { DEFAULT_EXPIRY_SECONDS } from "../utils/constants";
import { signJwt } from "../crypto/jwt";
import { buildRequestBinding } from "../utils/request";

export class Create {
  private issuer: string;
  private audiences: string[];
  private secret: string;
  constructor({issuer, audiences, secret}: {issuer: string, audiences: string[], secret: string}) {
    this.issuer = issuer;
    this.audiences = audiences;
    this.secret = secret;
  }
  execute(input: CreateInput): string {
    const nowEpoch = Math.floor((input.now ?? new Date()).getTime() / 1000);
    const expiresIn = input.expiresIn ?? DEFAULT_EXPIRY_SECONDS;
    const requestBinding = buildRequestBinding(input.request);

    const payload: GuardStackPayload = {
      iss: this.issuer,
      aud: this.audiences,
      iat: nowEpoch,
      exp: nowEpoch + expiresIn,
      jti: randomUUID(),
      ...(input.request ? requestBinding : {}),
    };

    return signJwt(payload, this.secret, input.kid);
  }
}
