import type { VercelRequest, VercelResponse } from "../../types/vercel";

const MPI_PING_MESSAGE = "DATOCMS_RECORD_BIN_PLUGIN_PING";
const MPI_PONG_MESSAGE = "DATOCMS_RECORD_BIN_LAMBDA_PONG";
const MPI_VERSION = "2026-02-25";
const SERVICE_NAME = "record-bin-lambda-function";
const VALID_MPI_PHASES = [
  "finish_installation",
  "config_mount",
  "config_connect",
] as const;
const VALID_MPI_PHASES_MESSAGE =
  "mpi.phase must be finish_installation, config_mount, or config_connect";

type ValidationError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
};

const sendError = (
  res: VercelResponse,
  statusCode: number,
  error: ValidationError
) => {
  res.status(statusCode).json({
    ok: false,
    error,
  });
};

const parseBody = (body: unknown): unknown => {
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  return body;
};

const validatePayload = (payload: any): ValidationError | null => {
  if (payload.event_type !== "plugin_health_ping") {
    return {
      code: "INVALID_EVENT_TYPE",
      message: "event_type must be plugin_health_ping",
      details: {
        expected: "plugin_health_ping",
        received: payload.event_type,
      },
    };
  }

  if (payload.mpi?.message !== MPI_PING_MESSAGE) {
    return {
      code: "INVALID_MPI_MESSAGE",
      message: `mpi.message must be ${MPI_PING_MESSAGE}`,
      details: {
        expected: MPI_PING_MESSAGE,
        received: payload.mpi?.message,
      },
    };
  }

  if (payload.mpi?.version !== MPI_VERSION) {
    return {
      code: "INVALID_MPI_VERSION",
      message: `mpi.version must be ${MPI_VERSION}`,
      details: {
        expected: MPI_VERSION,
        received: payload.mpi?.version,
      },
    };
  }

  if (!VALID_MPI_PHASES.includes(payload.mpi?.phase)) {
    return {
      code: "INVALID_MPI_PHASE",
      message: VALID_MPI_PHASES_MESSAGE,
      details: {
        expected: VALID_MPI_PHASES,
        received: payload.mpi?.phase,
      },
    };
  }

  return null;
};

export default async function pluginHealthHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);

  if (req.method !== "POST") {
    res.status(200).end();
    return;
  }

  try {
    const parsedBody = parseBody(req.body);

    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      sendError(res, 400, {
        code: "INVALID_BODY",
        message: "Request body must be a JSON object",
        details: {},
      });
      return;
    }

    const validationError = validatePayload(parsedBody);
    if (validationError) {
      sendError(res, 400, validationError);
      return;
    }

    res.status(200).json({
      ok: true,
      mpi: {
        message: MPI_PONG_MESSAGE,
        version: MPI_VERSION,
      },
      service: SERVICE_NAME,
      status: "ready",
    });
    return;
  } catch (error) {
    const isJsonSyntaxError =
      error instanceof SyntaxError && typeof req.body === "string";

    if (isJsonSyntaxError) {
      sendError(res, 400, {
        code: "INVALID_JSON",
        message: "Request body is not valid JSON",
        details: {},
      });
      return;
    }

    sendError(res, 500, {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal error occurred",
      details: {},
    });
    return;
  }
}
