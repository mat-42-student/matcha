// matcha/src/server/server.ts
import { createServer } from "http";
import { app, handler } from "./nextHandler";
import { initSocket } from "../lib/socket/socket";
import { seed } from "../lib/seed-users";

async function bootstrap() {
  try {
    await seed();
    await app.prepare();

    const httpServer = createServer(handler);
    initSocket(httpServer);

    // Hand the other websocket upgrades (Next HMR) to Next; socket.io handles its own path
    const upgradeHandler = app.getUpgradeHandler();
    httpServer.on("upgrade", (req, socket, head) => {
      if (!req.url?.startsWith("/socket.io/")) upgradeHandler(req, socket, head);
    });

    const port = Number(process.env.PORT) || 3000;

    httpServer.once("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    httpServer.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error during startup:", err);
    process.exit(1);
  }
}

bootstrap();