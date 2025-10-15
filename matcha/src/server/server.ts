// matcha/src/server/server.ts

import { createServer } from "http";
// @ts-ignore
import { app, handler } from "./nextHandler.ts";
// @ts-ignore
import { initSocket } from "./socket.ts";
// @ts-ignore
import { seed } from "./seed-users.ts";

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
