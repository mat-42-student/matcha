// matcha/src/server/server.ts

import { createServer } from "http";
// @ts-expect-error vscode cant handle extension in include path
import { app, handler } from "./nextHandler.ts";
// @ts-expect-error vscode cant handle extension in include path
import { initSocket } from "../lib/socket/socket.ts";
// @ts-expect-error vscode cant handle extension in include path
import { seed } from "../lib/seed-users.ts";

await seed();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  initSocket(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(3000, () => {
      console.log("> Ready on http://localhost:3000");
    });
});
