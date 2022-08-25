import { Client } from "@datocms/cma-client";

export default async function getRecordBinModel(client: Client) {
  let recordBinModel;
  try {
    recordBinModel = await client.itemTypes.find("record_bin");
  } catch {
    //if the model doesn't exist.. create it and return the recently created model ID:
    recordBinModel = await client.itemTypes.create({
      name: "🗑 Record Bin",
      api_key: "record_bin",
      collection_appearance: "table",
    });
    const labelField = await client.fields.create("record_bin", {
      label: "Label",
      field_type: "string",
      api_key: "label",
      position: 1,
    });
    client.fields.create("record_bin", {
      label: "Model",
      field_type: "string",
      api_key: "model",
      position: 2,
    });
    client.fields.create("record_bin", {
      label: "Date of deletion",
      field_type: "date_time",
      api_key: "date_of_deletion",
      position: 3,
    });
    client.fields.create("record_bin", {
      label: "Record body",
      field_type: "json",
      api_key: "record_body",
      position: 4,
    });

    await client.itemTypes.update("record_bin", {
      title_field: { type: "field", id: labelField.id },
      collection_appearance: "table",
    });
  }
  return recordBinModel;
}
