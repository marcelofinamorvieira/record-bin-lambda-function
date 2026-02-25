export default function (attributes: any, modelID: string) {
  let titleValue = "No title record";
  for (const attributeKey in attributes) {
    if (
      typeof attributes[attributeKey] === "string" &&
      Number.isNaN(Number(attributes[attributeKey])) //to avoid numeric ID strings
    ) {
      //this just finds the first string in the record and sets it as a label title, not optimal but saves a request
      titleValue = attributes[attributeKey];
      break;
    }
  }

  const labelString =
    titleValue + " | Model: " + modelID + " | " + new Date().toDateString();
  return labelString;
}
