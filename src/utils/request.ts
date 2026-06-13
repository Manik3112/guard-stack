import { createHash } from "node:crypto";
import type { RequestBindingInput } from "../types";

export const sha256Hex = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

export const normalizeMethod = (method: string): string => method.toUpperCase();

export const normalizePath = (path: string): string => {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
};

export const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  const entries = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`
  );
  return `{${entries.join(",")}}`;
};

export const hashBody = (body: unknown): string => {
  if (typeof body === "undefined") {
    return "";
  }

  if (typeof body === "string") {
    return sha256Hex(body);
  }

  return sha256Hex(stableStringify(body));
};

export const buildRequestBinding = (
  request?: RequestBindingInput
): Pick<{ mth?: string; pth?: string; bdy?: string }, "mth" | "pth" | "bdy"> => {
  if (!request) {
    return {};
  }

  return {
    mth: request.method ? normalizeMethod(request.method) : undefined,
    pth: request.path ? normalizePath(request.path) : undefined,
    bdy: typeof request.body !== "undefined" ? hashBody(request.body) : undefined
  };
};
