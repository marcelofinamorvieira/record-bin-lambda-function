import { buildClient } from "@datocms/cma-client-node";
import type { VercelRequest, VercelResponse } from "../types/vercel";
import generateTrashLabel from "../utils/generateTrashLabel";
import getRecordBinModel from "../utils/getRecordBinModel";

export default async function (req: VercelRequest, res: VercelResponse) {
  const webhookBody = req.body;
  const client = buildClient({
    apiToken: process.env.DATOCMS_FULLACCESS_API_TOKEN as string,
    environment: webhookBody.environment,
  });

  const deletedModelID = webhookBody.entity.relationships.item_type.data.id;

  const recordBinModel = await getRecordBinModel(client);

  if (recordBinModel.id === deletedModelID) {
    res
      .status(200)
      .json({ recordBin: "Trashed record Permanently deleted with success." });
    return;
  }

  const trashLabel = generateTrashLabel(
    webhookBody.entity.attributes,
    deletedModelID
  );

  webhookBody.event_type = "to_be_restored";

  await client.items.create({
    item_type: {
      type: "item_type",
      id: recordBinModel.id,
    },
    label: trashLabel,
    model: deletedModelID,
    record_body: JSON.stringify(webhookBody),
    date_of_deletion: new Date().toISOString(),
  });
  res.status(200).json({
    recordBin: "The deleted record has been successfully sent to the bin",
  });
  return;
}
