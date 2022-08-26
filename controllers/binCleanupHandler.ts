import { buildClient } from "@datocms/cma-client";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  const requestBody = req.body;
  const cutOffDate = new Date();
  cutOffDate.setDate(new Date().getDate() - requestBody.numberOfDays);

  const client = buildClient({
    apiToken: process.env.DATOCMS_FULLACCESS_API_TOKEN as string,
    environment: requestBody.environment,
  });

  try {
    const recordsToBeDeleted = await client.items.list({
      filter: {
        fields: {
          dateOfDeletion: {
            lte: cutOffDate.toISOString(),
          },
        },
        type: "record_bin",
      },
    });

    await client.items.bulkDestroy({
      items: recordsToBeDeleted.map((item) => {
        return { type: "item", id: item.id };
      }),
    });
  } catch (error) {
    res.status(429).json({
      recordBin: "Couldn't clean the bin!",
    });
    return;
  }

  res.status(200).json({
    recordBin: "The bin has been successfully cleaned!",
  });
  return;
}
