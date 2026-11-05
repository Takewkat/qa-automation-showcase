import { serve } from "@hono/node-server";
import { Hono } from "hono";

const PORT = Number(process.env.STUB_PORT || 8080);

/** The reference stub; routes land in app.ts, /health is what Playwright's webServer probes. */
export const app = new Hono();
app.get("/health", (c) => c.json({ status: "ok" }));

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`stub listening on http://127.0.0.1:${info.port}`),
);
