import binCleanupHandler from "../controllers/binCleanupHandler";
import deletionHandler from "../controllers/deletionHandler";
import restorationHandler from "../controllers/restorationHandler";
import type { VercelRequest, VercelResponse } from "../types/vercel";
import initializationHandler from "../controllers/initializationHandler";

export default async function mainHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method != "POST") {
    res.status(200).end();
    return;
  }

  switch (req.body.event_type) {
    case "delete":
      await deletionHandler(req, res);
      break;
    case "to_be_restored":
      await restorationHandler(req, res);
      break;
    case "cleanup":
      await binCleanupHandler(req, res);
      break;
    case "initialization":
      await initializationHandler(req, res);
      break;
  }

  res.status(200).end();
  return;
}
