import type { GuardStackMiddlewareOptions } from "../types";
import { Validate } from "../core/validate";

type ExecutionContextLike = {
  switchToHttp(): {
    getRequest<T>(): T;
  };
};

export class GuardStackNestGuard {
  private validate: Validate;
  constructor(private readonly options: GuardStackMiddlewareOptions) {
    this.validate = new Validate();
  }

  async canActivate(context: ExecutionContextLike): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      method: string;
      url: string;
      body?: unknown;
      guardStack?: unknown;
    }>();

    const headerName = (
      this.options.headerName ?? "x-guard-stack-token"
    ).toLowerCase();
    const headerValue = request.headers[headerName];
    const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!token) {
      return false;
    }

    const result = await this.validate.execute({
      ...this.options,
      token,
      request: {
        method: request.method,
        path: request.url,
        body: request.body,
      },
    });

    if (!result.valid) {
      await this.options.onValidationFailed?.(result);
      return false;
    }

    request.guardStack = result.payload;
    return true;
  }
}
