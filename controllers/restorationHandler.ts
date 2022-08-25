import recursivelyDeleteAllBlockIDs from "../utils/recursivelyDeleteAllBlockIDs";
import { buildClient } from "@datocms/cma-client-node";
import { VercelResponse } from "@vercel/node";

export default async function restorationHandler(
  recordBody: any,
  res: VercelResponse
) {
  const requestBody = recordBody.entity;
  delete requestBody.id;
  delete requestBody.attributes.created_at;
  delete requestBody.attributes.updated_at;
  delete requestBody.relationships.creator;
  requestBody.meta = {
    created_at: requestBody.meta.created_at,
    first_published_at: requestBody.meta.first_published_at,
  };

  recursivelyDeleteAllBlockIDs(requestBody, "");

  const client = buildClient({
    apiToken: process.env.DATOCMS_FULLACCESS_API_TOKEN as string,
    environment: requestBody.environment,
  });

  let restoredRecord;

  try {
    restoredRecord = await client.items.rawCreate({ data: requestBody });
  } catch (error) {
    console.log(error);
    res.status(429).json({ recordBin: "The record could not be restored!" });
    return;
  }

  await client.items.destroy(recordBody.trashRecordID);

  res.status(200).json({
    recordBin: "The record has been successfully restored!",
    restoredRecord: {
      id: restoredRecord.data.id,
      modelID: restoredRecord.data.relationships.item_type.data.id,
    },
  });
  return;
}