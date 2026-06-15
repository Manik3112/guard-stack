import type { GuardStackMiddlewareOptions } from '../types';
import { Validate } from '../core/validate';

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

let validate: Validate;

export const fastifyPreHandler =
    (options: GuardStackMiddlewareOptions) =>
    async (request: FastifyLikeRequest, reply: FastifyLikeReply): Promise<void> => {
        validate =
            validate ??
            new Validate({
                currentService: options.currentService,
                trustedIssuers: options.trustedIssuers,
                nonceStore: options.nonceStore,
            });

        if (!validate) {
            throw new Error('Validate instance not found');
        }
        const headerName = (options.headerName ?? 'x-guard-stack-token').toLowerCase();
        const headerValue = request.headers[headerName];
        const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

        if (!token) {
            reply.code(401).send({ valid: false, reason: 'MALFORMED_TOKEN' });
            return;
        }

        const result = await validate.execute({
            ...options,
            token,
            request: {
                method: request.method,
                path: request.url,
                body: request.body,
            },
        });

        if (!result.valid) {
            await options.onValidationFailed?.(result);
            reply.code(401).send(result);
            return;
        }

        request.guardStack = result.payload;
    };
