import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedGuestAccounts } from "./lib/seedGuests";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  socket.on("join-room", (userId: string) => {
    if (userId) {
      socket.join(userId);
    }
  });

  socket.on("call-user", (data: {
    to: string;
    from: string;
    fromName: string;
    isVideo: boolean;
    offer: unknown;
  }) => {
    io.to(data.to).emit("incoming-call", {
      from: data.from,
      fromName: data.fromName,
      isVideo: data.isVideo,
      offer: data.offer,
    });
  });

  socket.on("call-accepted", (data: { to: string; answer: unknown }) => {
    io.to(data.to).emit("call-accepted", { answer: data.answer });
  });

  socket.on("call-rejected", (data: { to: string }) => {
    io.to(data.to).emit("call-rejected");
  });

  socket.on("call-ended", (data: { to: string }) => {
    io.to(data.to).emit("call-ended");
  });

  socket.on("ice-candidate", (data: { to: string; candidate: unknown }) => {
    io.to(data.to).emit("ice-candidate", { candidate: data.candidate });
  });
});

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  void seedGuestAccounts();
});
