const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res); // Next.js gère les routes
  });

  const io = new Server(server, {
    cors: {
      origin: "https://localhost:8443", // l'URL exposée par Nginx
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });

    socket.on("chat-message", (msg) => {
      console.log("Received message:", msg);
      io.emit("chat-message", msg); // broadcast à tous
    });
  });

  server.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
});
