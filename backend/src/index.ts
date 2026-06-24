import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { initRealtime } from "./realtime/socket";
import { ensureSeedData } from "./seed/ensureSeedData";

async function main() {
  await ensureSeedData();

  const app = createApp();
  const server = http.createServer(app);
  initRealtime(server);

  const port = Number(process.env.PORT ?? 4000);
  server.listen(port, () => {
    process.stdout.write(`API listening on http://localhost:${port}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
