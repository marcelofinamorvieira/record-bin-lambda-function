import pluginHealthHandler from "../api/datocms/plugin-health";
import mainHandler from "../api/mainHandler";
import {
  buildErrorEnvelope,
  buildJsonResponse,
  invokeVercelStyleHandler,
  normalizePathname,
  parseRawBody,
  type CapturedHandlerResponse,
} from "../utils/platformAdapters";

export type Env = {
  DATOCMS_FULLACCESS_API_TOKEN?: string;
};

const toFetchResponse = (response: CapturedHandlerResponse): Response => {
  return new Response(response.body, {
    status: response.statusCode,
    headers: response.headers,
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.DATOCMS_FULLACCESS_API_TOKEN) {
      process.env.DATOCMS_FULLACCESS_API_TOKEN = env.DATOCMS_FULLACCESS_API_TOKEN;
    }

    const url = new URL(request.url);
    const pathname = normalizePathname(url.pathname);
    const contentType = request.headers.get("content-type");
    const rawBody =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text();
    const body = parseRawBody(rawBody, contentType);

    try {
      if (pathname === "/api/datocms/plugin-health") {
        const response = await invokeVercelStyleHandler(pluginHealthHandler, {
          method: request.method,
          body,
        });
        return toFetchResponse(response);
      }

      if (pathname === "/") {
        const response = await invokeVercelStyleHandler(mainHandler, {
          method: request.method,
          body,
        });
        return toFetchResponse(response);
      }

      return toFetchResponse(
        buildJsonResponse(404, buildErrorEnvelope("NOT_FOUND", "Route not found"))
      );
    } catch {
      return toFetchResponse(
        buildJsonResponse(
          500,
          buildErrorEnvelope(
            "INTERNAL_SERVER_ERROR",
            "An unexpected internal error occurred"
          )
        )
      );
    }
  },
};
