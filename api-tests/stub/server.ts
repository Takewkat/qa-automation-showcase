import { createServer } from "node:http";

import { app } from "./app.ts";

const PORT = Number(process.env.STUB_PORT || 8080);

createServer(app).listen(PORT, "127.0.0.1", () =>
  console.log(`stub listening on http://127.0.0.1:${PORT}`),
);
