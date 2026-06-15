import type { GuardStackMiddlewareOptions } from '../types';
import { Validate } from '../core/validate';

type ExpressLikeRequest = {
    headers: Record<string, string | string[] | undefined>;
    method: string;
    path?: string;
    url?: string;
    originalUrl?: string;
    body?: unknown;
    guardStack?: unknown;
};

type ExpressLikeResponse = {
    status(code: number): ExpressLikeResponse;
    json(payload: unknown): void;
};

type NextFn = () => void;

let validate: Validate;

export const expressMiddleware =
    (options: GuardStackMiddlewareOptions) =>
    async (req: ExpressLikeRequest, res: ExpressLikeResponse, next: NextFn) => {
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

        const headerName = (options.headerName ?? 'x-serviceguard-token').toLowerCase();
        const headerValue = req.headers[headerName];
        const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

        if (!token) {
            res.status(401).json({ valid: false, reason: 'MALFORMED_TOKEN' });
            return;
        }

        const result = await validate.execute({
            token,
            request: {
                method: req.method,
                path: req.originalUrl ?? req.path ?? req.url,
                body: req.body,
            },
        });

        if (!result.valid) {
            await options.onValidationFailed?.(result);
            res.status(401).json(result);
            return;
        }

        req.guardStack = result.payload;
        next();
    };
