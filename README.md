# Record Bin Lambda Function

Serverless backend used by the [DatoCMS Record Bin plugin](https://github.com/marcelofinamorvieira/datocms-plugin-record-bin).

It supports three deployment targets with equivalent behavior:

- Vercel Serverless Functions
- Netlify Functions
- Cloudflare Workers (Worker runtime with `nodejs_compat`)

## Required environment variable

Set this in every platform:

- `DATOCMS_FULLACCESS_API_TOKEN`: DatoCMS full-access API token used by restore/cleanup/delete flows.

## API routes

### `POST /` (existing restore/cleanup/delete/initialization behavior)

This route keeps the original webhook-based behavior and dispatches by `event_type`:

- `delete`
- `to_be_restored`
- `cleanup`
- `initialization`

The existing logic was kept untouched.

## Cleanup trigger model (no CronJobs in this repo)

Cleanup is request-driven. The lambda cleanup flow runs only when a client sends:

```json
{
  "event_type": "cleanup",
  "numberOfDays": 30,
  "environment": "main"
}
```

to `POST /`.

This repository does not configure background schedulers such as:

- Vercel Cron Jobs
- Netlify Scheduled Functions
- Cloudflare Cron Triggers

We intentionally opted out of built-in cron jobs. On serverless platforms, scheduled invocations add recurring compute cost, while storage reduction versus boot-triggered cleanup is usually small.

### `POST /api/datocms/plugin-health`

Health-check handshake route used by plugin installation/configuration.

Request body:

```json
{
  "event_type": "plugin_health_ping",
  "mpi": {
    "message": "DATOCMS_RECORD_BIN_PLUGIN_PING",
    "version": "2026-02-25",
    "phase": "config_connect"
  },
  "plugin": {
    "name": "datocms-plugin-record-bin",
    "environment": "main"
  }
}
```

Validation rules:

- `event_type` must be `plugin_health_ping`
- `mpi.message` must be `DATOCMS_RECORD_BIN_PLUGIN_PING`
- `mpi.version` must be `2026-02-25`
- `mpi.phase` must be `finish_installation`, `config_mount`, or `config_connect`
- The health endpoint is stateless and supports concurrent checks from multiple plugin sessions.

Success response (`200`):

```json
{
  "ok": true,
  "mpi": {
    "message": "DATOCMS_RECORD_BIN_LAMBDA_PONG",
    "version": "2026-02-25"
  },
  "service": "record-bin-lambda-function",
  "status": "ready"
}
```

Validation/internal error response envelope (`400` / `500`):

```json
{
  "ok": false,
  "error": {
    "code": "<MACHINE_CODE>",
    "message": "<human readable>",
    "details": {}
  }
}
```

All supported platforms return CORS headers compatible with browser calls from the DatoCMS plugin iframe.

Curl example:

```bash
curl -i -X POST "https://<your-deployment>/api/datocms/plugin-health" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "plugin_health_ping",
    "mpi": {
      "message": "DATOCMS_RECORD_BIN_PLUGIN_PING",
      "version": "2026-02-25",
      "phase": "config_connect"
    },
    "plugin": {
      "name": "datocms-plugin-record-bin",
      "environment": "main"
    }
  }'
```

## Deploying on Vercel

One-click deploy:

- https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmarcelofinamorvieira%2Frecord-bin-lambda-function&env=DATOCMS_FULLACCESS_API_TOKEN&project-name=datocms-record-bin-lambda-function&repo-name=datocms-record-bin-lambda-function

What this repo uses for Vercel:

- `vercel.json` routes:
  - `/` -> `api/mainHandler.ts`
  - `/api/datocms/plugin-health` -> `api/datocms/plugin-health.ts`

Local run:

- `npx vercel dev`

## Deploying on Netlify

This repo includes Netlify function entrypoints and redirects:

- Functions:
  - `netlify/functions/main.ts`
  - `netlify/functions/plugin-health.ts`
- Routing config:
  - `netlify.toml`

`netlify.toml` maps:

- `/` -> `/.netlify/functions/main`
- `/api/datocms/plugin-health` -> `/.netlify/functions/plugin-health`

Deployment steps:

1. Create/import this repository in Netlify.
2. Set `DATOCMS_FULLACCESS_API_TOKEN` in Site settings -> Environment variables.
3. Deploy (Netlify builds functions automatically from `netlify/functions`).

Local run:

- `npx netlify dev`

## Deploying on Cloudflare Workers

This repo includes a worker wrapper:

- Worker entrypoint: `cloudflare/worker.ts`
- Wrangler config: `wrangler.toml`

The worker handles:

- `POST /`
- `POST /api/datocms/plugin-health`

And returns `404` JSON for unknown routes.

Deployment steps:

1. Install Wrangler (if needed): `npm i -D wrangler` or use `npx wrangler`.
2. Authenticate: `npx wrangler login`
3. Set secret token: `npx wrangler secret put DATOCMS_FULLACCESS_API_TOKEN`
4. Deploy: `npx wrangler deploy`

Local run:

- `npx wrangler dev`

Notes:

- `wrangler.toml` enables `nodejs_compat`, which is required because the existing handlers use Node-style dependencies and `process.env`.
- `cloudflare/worker.ts` copies the worker secret into `process.env.DATOCMS_FULLACCESS_API_TOKEN` so existing restore/cleanup/delete handlers continue to work without code changes.

## Local verification

Run the tests:

```bash
npm test
```

This suite validates:

- plugin-health success and error paths
- Netlify wrapper behavior
- Cloudflare worker behavior
