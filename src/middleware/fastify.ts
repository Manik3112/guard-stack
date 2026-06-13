import type { GuardStackMiddlewareOptions } from "../types";
import { validate } from "../core/validate";

type FastifyLikeRequest = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
  body?: unknown;
  guardStack?: unknown;
};

type FastifyLikeReply = {
  code(statusCode: number): FastifyLikeReply;
  send(payload: unknown): void;
};

export const fastifyPreHandler =
  (options: GuardStackMiddlewareOptions) =>
  async (request: FastifyLikeRequest, reply: FastifyLikeReply): Promise<void> => {
    const headerName = (options.headerName ?? "x-guard-stack-token").toLowerCase();
    const headerValue = request.headers[headerName];
    const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!token) {
      reply.code(401).send({ valid: false, reason: "MALFORMED_TOKEN" });
      return;
    }

    const result = await validate({
      ...options,
      token,
      request: {
        method: request.method,
        path: request.url,
        body: request.body
      }
    });

    if (!result.valid) {
      await options.onValidationFailed?.(result);
      reply.code(401).send(result);
      return;
    }

    request.guardStack = result.payload;
  };
