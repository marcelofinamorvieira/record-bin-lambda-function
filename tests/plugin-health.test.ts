import assert from "node:assert/strict";
import test from "node:test";
import pluginHealthHandler from "../api/datocms/plugin-health";
import type { VercelRequest, VercelResponse } from "../types/vercel";

const validPayload = {
  event_type: "plugin_health_ping",
  mpi: {
    message: "DATOCMS_RECORD_BIN_PLUGIN_PING",
    version: "2026-02-25",
    phase: "finish_installation",
  },
  plugin: {
    name: "datocms-plugin-record-bin",
    environment: "main",
  },
};

const createMockResponse = () => {
  let statusCode: number | undefined;
  let jsonBody: unknown;
  let ended = false;
  const headers: Record<string, string> = {};

  const res: VercelResponse = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: unknown) => {
      jsonBody = body;
      return res;
    },
    end: () => {
      ended = true;
    },
  };

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
    getHeaders: () => headers,
    wasEnded: () => ended,
  };
};

test("returns 200 and pong payload for a valid plugin health ping", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    { method: "POST", body: validPayload } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 200);
  assert.deepEqual(response.getJsonBody(), {
    ok: true,
    mpi: {
      message: "DATOCMS_RECORD_BIN_LAMBDA_PONG",
      version: "2026-02-25",
    },
    service: "record-bin-lambda-function",
    status: "ready",
  });
  assert.equal(response.getHeaders()["Access-Control-Allow-Origin"], "*");
  assert.equal(
    response.getHeaders()["Access-Control-Allow-Methods"],
    "GET,OPTIONS,POST"
  );
});

test("returns 400 for an invalid mpi message", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    {
      method: "POST",
      body: {
        ...validPayload,
        mpi: {
          ...validPayload.mpi,
          message: "WRONG",
        },
      },
    } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 400);
  assert.deepEqual(response.getJsonBody(), {
    ok: false,
    error: {
      code: "INVALID_MPI_MESSAGE",
      message: "mpi.message must be DATOCMS_RECORD_BIN_PLUGIN_PING",
      details: {
        expected: "DATOCMS_RECORD_BIN_PLUGIN_PING",
        received: "WRONG",
      },
    },
  });
});

test("returns 400 for an invalid mpi version", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    {
      method: "POST",
      body: {
        ...validPayload,
        mpi: {
          ...validPayload.mpi,
          version: "2020-01-01",
        },
      },
    } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 400);
  assert.deepEqual(response.getJsonBody(), {
    ok: false,
    error: {
      code: "INVALID_MPI_VERSION",
      message: "mpi.version must be 2026-02-25",
      details: {
        expected: "2026-02-25",
        received: "2020-01-01",
      },
    },
  });
});

test("returns 400 for an invalid mpi phase", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    {
      method: "POST",
      body: {
        ...validPayload,
        mpi: {
          ...validPayload.mpi,
          phase: "unknown_phase",
        },
      },
    } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 400);
  assert.deepEqual(response.getJsonBody(), {
    ok: false,
    error: {
      code: "INVALID_MPI_PHASE",
      message: "mpi.phase must be finish_installation or config_mount",
      details: {
        expected: ["finish_installation", "config_mount"],
        received: "unknown_phase",
      },
    },
  });
});

test("returns 400 for bad JSON in request body", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    {
      method: "POST",
      body: '{"event_type":"plugin_health_ping"',
    } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 400);
  assert.deepEqual(response.getJsonBody(), {
    ok: false,
    error: {
      code: "INVALID_JSON",
      message: "Request body is not valid JSON",
      details: {},
    },
  });
});

test("returns 500 on internal failures", async () => {
  const response = createMockResponse();
  const body: Record<string, unknown> = {};

  Object.defineProperty(body, "event_type", {
    enumerable: true,
    get() {
      throw new Error("boom");
    },
  });

  await pluginHealthHandler(
    { method: "POST", body } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 500);
  assert.deepEqual(response.getJsonBody(), {
    ok: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal error occurred",
      details: {},
    },
  });
});

test("returns 200 and ends for non-POST methods", async () => {
  const response = createMockResponse();

  await pluginHealthHandler(
    { method: "OPTIONS", body: {} } as VercelRequest,
    response.res
  );

  assert.equal(response.getStatusCode(), 200);
  assert.equal(response.wasEnded(), true);
  assert.equal(response.getJsonBody(), undefined);
});
