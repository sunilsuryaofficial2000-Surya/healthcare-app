"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const socket_1 = require("./realtime/socket");
const ensureSeedData_1 = require("./seed/ensureSeedData");
async function main() {
    await (0, ensureSeedData_1.ensureSeedData)();
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    (0, socket_1.initRealtime)(server);
    const port = Number(process.env.PORT ?? 4000);
    server.listen(port, () => {
        process.stdout.write(`API listening on http://localhost:${port}\n`);
    });
}
main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exit(1);
});
