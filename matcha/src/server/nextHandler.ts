// matcha/src/server/nextHandler.ts

import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

export const app = next({ dev, hostname, port });
export const handler = app.getRequestHandler();
