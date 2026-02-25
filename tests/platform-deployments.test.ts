import assert from "node:assert/strict";
import test from "node:test";
import cloudflareWorker from "../cloudflare/worker";
import { handler as netlifyMainHandler } from "../netlify/functions/main";
import { handler as netlifyPluginHealthHandler } from "../netlify/functions/plugin-health";

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

test("Netlify plugin-health function returns handshake success payload", async () => {
  const response = await netlifyPluginHealthHandler({
    httpMethod: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(validPayload),
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    ok: true,
    mpi: {
      message: "DATOCMS_RECORD_BIN_LAMBDA_PONG",
      version: "2026-02-25",
    },
    service: "record-bin-lambda-function",
    status: "ready",
  });
  assert.equal(response.headers?.["Access-Control-Allow-Origin"], "*");
});

test("Netlify plugin-health function keeps bad JSON behavior", async () => {
  const response = await netlifyPluginHealthHandler({
    httpMethod: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: '{"event_type":"plugin_health_ping"',
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: {
      code: "INVALID_JSON",
      message: "Request body is not valid JSON",
      details: {},
    },
  });
});

test("Netlify main function preserves legacy root behavior", async () => {
  const response = await netlifyMainHandler({
    httpMethod: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      event_type: "unmapped_event",
    }),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "");
  assert.equal(response.headers?.["Access-Control-Allow-Origin"], "*");
});

test("Cloudflare worker returns handshake success payload", async () => {
  const request = new Request(
    "https://record-bin.example.com/api/datocms/plugin-health",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(validPayload),
    }
  );

  const response = await cloudflareWorker.fetch(request, {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    mpi: {
      message: "DATOCMS_RECORD_BIN_LAMBDA_PONG",
      version: "2026-02-25",
    },
    service: "record-bin-lambda-function",
    status: "ready",
  });
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
});

test("Cloudflare worker returns 404 JSON envelope for unknown route", async () => {
  const request = new Request("https://record-bin.example.com/unknown", {
    method: "GET",
  });

  const response = await cloudflareWorker.fetch(request, {});

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: {},
    },
  });
});
