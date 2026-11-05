import { serve } from "@hono/node-server";

import { app } from "./app";

const PORT = Number(process.env.STUB_PORT || 8080);

serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" }, (info) =>
  console.log(`stub listening on http://127.0.0.1:${info.port}`),
);
