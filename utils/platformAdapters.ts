import type { VercelRequest, VercelResponse } from "../types/vercel";

export type VercelStyleHandler = (
  req: VercelRequest,
  res: VercelResponse
) => Promise<void> | void;

export type CapturedHandlerResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
  "Access-Control-Allow-Headers":
    "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
};

export const buildErrorEnvelope = (code: string, message: string) => {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details: {},
    },
  };
};

export const buildJsonResponse = (
  statusCode: number,
  payload: unknown,
  headers: Record<string, string> = {}
): CapturedHandlerResponse => {
  return {
    statusCode,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
    body: JSON.stringify(payload),
  };
};

const isLikelyJsonPayload = (
  rawBody: string,
  contentType: string | null | undefined
) => {
  const normalizedContentType = (contentType ?? "").toLowerCase();
  if (normalizedContentType.includes("application/json")) {
    return true;
  }

  const trimmedBody = rawBody.trim();
  return trimmedBody.startsWith("{") || trimmedBody.startsWith("[");
};

export const parseRawBody = (
  rawBody: string | null | undefined,
  contentType: string | null | undefined
): unknown => {
  if (typeof rawBody !== "string") {
    return undefined;
  }

  if (rawBody.length === 0) {
    return undefined;
  }

  if (!isLikelyJsonPayload(rawBody, contentType)) {
    return rawBody;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
};

export const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  if (pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const getHeaderValue = (
  headers: Record<string, string | undefined> | undefined,
  headerName: string
) => {
  if (!headers) {
    return undefined;
  }

  const normalizedTarget = headerName.toLowerCase();
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === normalizedTarget) {
      return value;
    }
  }

  return undefined;
};

export const invokeVercelStyleHandler = async (
  handler: VercelStyleHandler,
  request: { method?: string; body: unknown }
): Promise<CapturedHandlerResponse> => {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let responseBody = "";
  let didWriteBody = false;

  const response: VercelResponse = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    status: (nextStatusCode: number) => {
      statusCode = nextStatusCode;
      return response;
    },
    json: (jsonBody: unknown) => {
      didWriteBody = true;
      responseBody = JSON.stringify(jsonBody);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json; charset=utf-8";
      }
      return response;
    },
    end: () => {
      return;
    },
  };

  await handler(
    {
      method: request.method,
      body: request.body,
    } as VercelRequest,
    response
  );

  if (!didWriteBody) {
    responseBody = "";
  }

  return {
    statusCode,
    headers,
    body: responseBody,
  };
};
