export default function recursivelyDeleteAllBlockIDs(
  recursiveObject: any,
  previousKey: String
) {
  if (recursiveObject.hasOwnProperty("id") && previousKey !== "data") {
    delete recursiveObject["id"];
  }
  for (const key of Object.keys(recursiveObject)) {
    if (recursiveObject[key] instanceof Object) {
      recursivelyDeleteAllBlockIDs(recursiveObject[key], key);
    }
  }
}
