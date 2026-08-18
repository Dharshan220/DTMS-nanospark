/**
 * Vercel serverless entry — exposes the DTMS Express app at /api/*.
 * Local dev still runs the server via `npm run server` (server/index.js).
 */
import { startServer } from "../server/app.js";

let appPromise = startServer();

export default async function handler(req, res) {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    res.status(500).json({ message: "Server failed to initialise" });
  }
}
