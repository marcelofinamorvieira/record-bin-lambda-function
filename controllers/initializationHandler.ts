import { buildClient } from "@datocms/cma-client";
import { VercelRequest, VercelResponse } from "@vercel/node";

const initializationHandler = async (
  req: VercelRequest,
  res: VercelResponse
) => {
  const client = buildClient({
    apiToken: process.env.DATOCMS_FULLACCESS_API_TOKEN as string,
    environment: req.body.environment,
  });

  try {
    await client.webhooks.create({
      name: "🗑 Record Bin",
      url: req.body.vercelURL,
      custom_payload: null,
      headers: { foo: "bar" },
      events: [
        {
          entity_type: "item",
          event_types: ["delete"],
        },
      ],
      http_basic_user: "",
      http_basic_password: "",
      enabled: true,
      payload_api_version: "3",
      nested_items_in_payload: true,
    });
  } catch {}

  res.status(200).json({
    recordBin: "The plugin was successfully initialized!",
  });
  return;
};

export default initializationHandler;
